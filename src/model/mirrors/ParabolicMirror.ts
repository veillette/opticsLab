/**
 * ParabolicMirror.ts
 *
 * A parabolic mirror defined by two endpoints (p1, p2) and the vertex (p3).
 * The parabola is approximated by a series of line segments, and ray
 * intersection is tested against each segment. The local surface normal
 * is interpolated from the neighboring segment normals.
 */

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
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

const NUM_SEGMENTS = 80;
const MIN_RAY_LENGTH_SQ = 1e-6;

export class ParabolicMirror extends BaseElement {
  public readonly type = "ParabolicMirror";
  public readonly category: ElementCategory = "mirror";

  public p1: Point;
  public p2: Point;
  /** Vertex of the parabola. */
  public p3: Point;

  public constructor(p1: Point, p2: Point, p3: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  /**
   * Compute the polyline approximation of the parabola in scene coordinates.
   * The parabola is defined so that its vertex is at p3, its axis is
   * perpendicular to the chord p1–p2 passing through p3, and it passes
   * through p1 and p2.
   */
  private computePoints(): Point[] {
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
    for (let i = 0; i <= NUM_SEGMENTS; i++) {
      const t = -1 + (2 * i) / NUM_SEGMENTS; // t in [-1, 1]
      const u = t * halfAperture;
      const v = a * u * u;
      const px = chordMidX + tangentX * u + -tangentY * v;
      const py = chordMidY + tangentY * u + tangentX * v;
      points.push(point(px, py));
    }
    return points;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const pts = this.computePoints();
    let bestT = Infinity;
    let bestHit: { point: Point; segIndex: number } | null = null;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (!(p1 && p2)) {
        continue;
      }
      const hit = raySegmentIntersection(ray.origin, ray.direction, segment(p1, p2));
      if (hit && hit.t < bestT) {
        const dSq = (hit.point.x - ray.origin.x) ** 2 + (hit.point.y - ray.origin.y) ** 2;
        if (dSq > MIN_RAY_LENGTH_SQ) {
          bestT = hit.t;
          bestHit = { point: hit.point, segIndex: i };
        }
      }
    }

    if (!bestHit) {
      return null;
    }

    const segP1 = pts[bestHit.segIndex];
    const segP2 = pts[bestHit.segIndex + 1];
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
    return { type: this.type, p1: this.p1, p2: this.p2, p3: this.p3 };
  }
}
