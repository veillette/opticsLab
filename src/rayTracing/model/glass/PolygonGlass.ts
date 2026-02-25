/**
 * PolygonGlass.ts
 *
 * A glass element whose boundary is a closed polygon (which may include
 * circular arc segments in a future extension). Rays crossing any edge
 * are refracted by Snell's law. Point-in-polygon testing determines
 * whether the ray origin is inside or outside the glass.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  dot,
  fresnelReflectance,
  normalize,
  type Point,
  point,
  pointInPolygon,
  raySegmentIntersection,
  refract,
  segment,
  segmentNormal,
} from "../optics/Geometry.js";
import { FRESNEL_REFLECTION_THRESHOLD, MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export interface PolygonVertex {
  x: number;
  y: number;
  /** If true, this vertex is the control point of a circular arc. */
  arc?: boolean;
}

export class PolygonGlass extends BaseElement {
  public readonly type = "Glass";
  public readonly category: ElementCategory = "glass";

  public path: PolygonVertex[];
  public refIndex: number;

  public constructor(path: PolygonVertex[], refIndex = 1.5) {
    super();
    this.path = path;
    this.refIndex = refIndex;
  }

  private get vertices(): Point[] {
    return this.path.filter((v) => !v.arc).map((v) => point(v.x, v.y));
  }

  /**
   * Iterate over the line-segment edges of the polygon.
   * Arc segments are currently linearized (arc vertex skipped).
   */
  private *edges(): Generator<{ p1: Point; p2: Point; index: number }> {
    const verts = this.vertices;
    const n = verts.length;
    for (let i = 0; i < n; i++) {
      const p1 = verts[i];
      const p2 = verts[(i + 1) % n];
      if (!(p1 && p2)) {
        continue;
      }
      yield { p1, p2, index: i };
    }
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    let bestT = Infinity;
    let bestResult: IntersectionResult | null = null;

    for (const edge of this.edges()) {
      const hit = raySegmentIntersection(ray.origin, ray.direction, segment(edge.p1, edge.p2));
      if (!hit) {
        continue;
      }
      const dSq = (hit.point.x - ray.origin.x) ** 2 + (hit.point.y - ray.origin.y) ** 2;
      if (dSq < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      if (hit.t < bestT) {
        bestT = hit.t;
        const normal = segmentNormal(segment(edge.p1, edge.p2));
        bestResult = { point: hit.point, t: hit.t, element: this, normal };
      }
    }
    return bestResult;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const isInside = pointInPolygon(ray.origin, this.vertices);
    let n = intersection.normal;
    let n1: number;
    let n2: number;

    if (isInside) {
      n1 = this.refIndex;
      n2 = 1;
      n = point(-n.x, -n.y);
    } else {
      n1 = 1;
      n2 = this.refIndex;
      // Make sure normal faces the ray
      if (dot(ray.direction, n) > 0) {
        n = point(-n.x, -n.y);
      }
    }

    const refractedDir = refract(ray.direction, n, n1, n2);
    if (!refractedDir) {
      const d = ray.direction;
      const dn = dot(d, n);
      return {
        isAbsorbed: false,
        outgoingRay: {
          origin: intersection.point,
          direction: normalize(point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y)),
          brightnessS: ray.brightnessS,
          brightnessP: ray.brightnessP,
          gap: false,
          isNew: false,
          wavelength: ray.wavelength,
        },
      };
    }

    const absCosI = Math.abs(dot(ray.direction, n));
    const [Rs, Rp] = fresnelReflectance(absCosI, n1, n2);

    const outgoing: SimulationRay = {
      origin: intersection.point,
      direction: normalize(refractedDir),
      brightnessS: ray.brightnessS * (1 - Rs),
      brightnessP: ray.brightnessP * (1 - Rp),
      gap: false,
      isNew: false,
      wavelength: ray.wavelength,
    };

    const newRays: SimulationRay[] = [];
    const reflBrightS = ray.brightnessS * Rs;
    const reflBrightP = ray.brightnessP * Rp;
    if (reflBrightS + reflBrightP > FRESNEL_REFLECTION_THRESHOLD) {
      const d = ray.direction;
      const dn = dot(d, n);
      newRays.push({
        origin: intersection.point,
        direction: normalize(point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y)),
        brightnessS: reflBrightS,
        brightnessP: reflBrightP,
        gap: true,
        isNew: false,
        wavelength: ray.wavelength,
      });
    }

    return { isAbsorbed: false, outgoingRay: outgoing, newRays };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, path: this.path, refIndex: this.refIndex };
  }
}
