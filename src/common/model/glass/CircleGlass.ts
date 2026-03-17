/**
 * CircleGlass.ts
 *
 * A circular glass element defined by a center (p1) and a point on the
 * boundary (p2). Refracts rays at both entry and exit surfaces using
 * Snell's law with Fresnel partial reflections.
 */

import {
  circle,
  distance,
  normalize,
  type Point,
  point,
  pointInCircle,
  rayCircleIntersections,
  subtract,
} from "../optics/Geometry.js";
import { MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type { IntersectionResult, RayInteractionResult, SimulationRay } from "../optics/OpticsTypes.js";
import { BaseGlass } from "./BaseGlass.js";

export class CircleGlass extends BaseGlass {
  public readonly type = "CircleGlass";

  /** Center of the circle. */
  public p1: Point;
  /** A point on the circle boundary. */
  public p2: Point;

  public constructor(p1: Point, p2: Point, refIndex = 1.5) {
    // cauchyB=0 preserves current behaviour (no dispersion); partialReflect=true
    super(refIndex, 0, true);
    this.p1 = p1;
    this.p2 = p2;
  }

  private get radius(): number {
    return distance(this.p1, this.p2);
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const r = this.radius;
    const hits = rayCircleIntersections(ray.origin, ray.direction, circle(this.p1, r));
    for (const hit of hits) {
      const dSq = (hit.point.x - ray.origin.x) ** 2 + (hit.point.y - ray.origin.y) ** 2;
      if (dSq < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      const outwardNormal = normalize(subtract(hit.point, this.p1));
      return { point: hit.point, t: hit.t, element: this, normal: outwardNormal };
    }
    return null;
  }

  /**
   * Returns 1 when the ray origin is inside the circle (glass→air),
   * -1 when outside (air→glass).
   */
  public getIncidentType(ray: SimulationRay): number {
    return pointInCircle(ray.origin, circle(this.p1, this.radius)) ? 1 : -1;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const incidentType = this.getIncidentType(ray);
    const n1 =
      incidentType === 1
        ? this.getRefIndexAt(intersection.point, ray)
        : 1 / this.getRefIndexAt(intersection.point, ray);

    let normal = intersection.normal;
    const cosI = -(normal.x * ray.direction.x + normal.y * ray.direction.y);
    if (cosI < 0) {
      normal = point(-normal.x, -normal.y);
    }

    return this.refractRay(ray, intersection.point, normal, n1);
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, refIndex: this.refIndex };
  }
}
