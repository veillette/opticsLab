/**
 * AperturedParabolicMirror.ts
 *
 * A parabolic mirror with a centered aperture (hole). Rays hitting within
 * the aperture half-width of the mirror's axis pass through unimpeded;
 * rays outside the aperture are reflected parabolically.
 *
 * Geometry matches ParabolicMirror exactly. The additional field
 * `apertureHalfWidth` (metres) controls the radius of the central opening,
 * measured along the chord direction from the chord midpoint.
 */

import { PARABOLIC_MIRROR_SEGMENT_COUNT } from "../../../OpticsLabConstants.js";
import { ELEMENT_CATEGORY_MIRROR, ELEMENT_TYPE_APERTURED_PARABOLIC_MIRROR } from "../../../OpticsLabStrings.js";
import { BaseElement } from "../optics/BaseElement.js";
import {
  distance,
  dot,
  normalize,
  type Point,
  point,
  raySegmentIntersection,
  segment,
  segmentNormal,
} from "../optics/Geometry.js";
import { MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class AperturedParabolicMirror extends BaseElement {
  public readonly type = ELEMENT_TYPE_APERTURED_PARABOLIC_MIRROR;
  public readonly category: ElementCategory = ELEMENT_CATEGORY_MIRROR;

  public p1: Point;
  public p2: Point;
  /** Vertex of the parabola (constrained to perpendicular bisector of p1–p2). */
  public p3: Point;
  /** Half-width (metres) of the central aperture, measured along the chord. */
  public apertureHalfWidth: number;

  public constructor(p1: Point, p2: Point, p3: Point, apertureHalfWidth: number) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.apertureHalfWidth = apertureHalfWidth;
  }

  /**
   * Compute the polyline approximation of the parabola in scene coordinates.
   * Matches ParabolicMirror.computePoints() exactly.
   */
  public computePoints(): Point[] {
    const chordMidX = (this.p1.x + this.p2.x) / 2;
    const chordMidY = (this.p1.y + this.p2.y) / 2;
    const chordLen = distance(this.p1, this.p2);
    if (chordLen < 1e-10) {
      return [this.p1, this.p2];
    }

    const tangentX = (this.p2.x - this.p1.x) / chordLen;
    const tangentY = (this.p2.y - this.p1.y) / chordLen;

    const sagitta = (this.p3.x - chordMidX) * -tangentY + (this.p3.y - chordMidY) * tangentX;

    const halfAperture = chordLen / 2;
    const a = halfAperture * halfAperture === 0 ? 0 : sagitta / (halfAperture * halfAperture);

    const points: Point[] = [];
    for (let i = 0; i <= PARABOLIC_MIRROR_SEGMENT_COUNT; i++) {
      const t = -1 + (2 * i) / PARABOLIC_MIRROR_SEGMENT_COUNT; // t in [-1, 1]
      const u = t * halfAperture;
      const v = sagitta - a * u * u;
      const px = chordMidX + tangentX * u + -tangentY * v;
      const py = chordMidY + tangentY * u + tangentX * v;
      points.push(point(px, py));
    }
    return points;
  }

  /**
   * Returns the signed chord-axis coordinate of a hit point (positive toward p2).
   * Used to determine whether the hit falls within the aperture.
   */
  private chordCoord(p: Point): number {
    const chordMidX = (this.p1.x + this.p2.x) / 2;
    const chordMidY = (this.p1.y + this.p2.y) / 2;
    const chordLen = distance(this.p1, this.p2);
    if (chordLen < 1e-10) {
      return 0;
    }
    const tangentX = (this.p2.x - this.p1.x) / chordLen;
    const tangentY = (this.p2.y - this.p1.y) / chordLen;
    return (p.x - chordMidX) * tangentX + (p.y - chordMidY) * tangentY;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const parabolaPoints = this.computePoints();
    const chordLen = distance(this.p1, this.p2);
    const halfAperture = chordLen / 2;
    // Clamp aperture to half the mirror width so it never fully blocks reflection
    const effectiveHalfWidth = Math.min(this.apertureHalfWidth, halfAperture * 0.99);

    let bestT = Infinity;
    let bestHit: { point: Point; segIndex: number } | null = null;

    for (let i = 0; i < parabolaPoints.length - 1; i++) {
      const p1 = parabolaPoints[i];
      const p2 = parabolaPoints[i + 1];
      if (!(p1 && p2)) {
        continue;
      }
      const hit = raySegmentIntersection(ray.origin, ray.direction, segment(p1, p2));
      if (hit && hit.t < bestT) {
        const dSq = (hit.point.x - ray.origin.x) ** 2 + (hit.point.y - ray.origin.y) ** 2;
        if (dSq <= MIN_RAY_LENGTH_SQ) {
          continue;
        }
        // Skip hits within the central aperture
        if (Math.abs(this.chordCoord(hit.point)) < effectiveHalfWidth) {
          continue;
        }
        bestT = hit.t;
        bestHit = { point: hit.point, segIndex: i };
      }
    }

    if (!bestHit) {
      return null;
    }

    const segP1 = parabolaPoints[bestHit.segIndex];
    const segP2 = parabolaPoints[bestHit.segIndex + 1];
    if (!(segP1 && segP2)) {
      return null;
    }
    const seg = segment(segP1, segP2);
    const normal = segmentNormal(seg);
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: bestHit.point, t: bestT, element: this, normal: facingRay };
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const n = intersection.normal;
    const d = ray.direction;
    const dn = dot(d, n);
    const reflectedDir = point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y);
    return {
      isAbsorbed: false,
      outgoingRay: {
        origin: intersection.point,
        direction: normalize(reflectedDir),
        brightnessS: ray.brightnessS,
        brightnessP: ray.brightnessP,
        gap: false,
        isNew: false,
        wavelength: ray.wavelength,
      },
    };
  }

  public serialize(): Record<string, unknown> {
    return {
      type: this.type,
      p1: this.p1,
      p2: this.p2,
      p3: this.p3,
      apertureHalfWidth: this.apertureHalfWidth,
    };
  }
}
