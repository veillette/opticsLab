/**
 * HalfPlaneGlass.ts
 *
 * A glass half-plane: everything on one side of a line segment boundary
 * has refractive index `refIndex`. Rays crossing the boundary are
 * refracted by Snell's law. The "inside" is the left side when
 * looking from p1 toward p2.
 */

import { type Point, point, rayLineIntersection, segment, segmentNormal } from "../optics/Geometry.js";
import type { IntersectionResult, RayInteractionResult, SimulationRay } from "../optics/OpticsTypes.js";
import { BaseGlass } from "./BaseGlass.js";

export class HalfPlaneGlass extends BaseGlass {
  public readonly type = "PlaneGlass";

  public p1: Point;
  public p2: Point;

  public constructor(p1: Point, p2: Point, refIndex = 1.5) {
    // cauchyB=0 preserves current behaviour (no dispersion); partialReflect=true
    super(refIndex, 0, true);
    this.p1 = p1;
    this.p2 = p2;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const hit = rayLineIntersection(ray.origin, ray.direction, segment(this.p1, this.p2));
    if (!hit) {
      return null;
    }
    const normal = segmentNormal(segment(this.p1, this.p2));
    return { point: hit.point, t: hit.t, element: this, normal };
  }

  /**
   * Returns -1 when the ray origin is on the outside (normal side, air→glass),
   * 1 when on the inside (glass→air).
   */
  public getIncidentType(ray: SimulationRay): number {
    const n = segmentNormal(segment(this.p1, this.p2));
    const side = (ray.origin.x - this.p1.x) * n.x + (ray.origin.y - this.p1.y) * n.y;
    return side > 0 ? -1 : 1;
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
