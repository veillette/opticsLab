/**
 * LineBlocker.ts
 *
 * A line-segment blocker that absorbs all rays hitting it.
 */

import { BaseElement } from "../optics/BaseElement.js";
import { dot, type Point, point, raySegmentIntersection, segment, segmentNormal } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class LineBlocker extends BaseElement {
  public readonly type = "Blocker";
  public readonly category: ElementCategory = "blocker";

  public p1: Point;
  public p2: Point;

  public constructor(p1: Point, p2: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const hit = raySegmentIntersection(ray.origin, ray.direction, segment(this.p1, this.p2));
    if (!hit) {
      return null;
    }
    const normal = segmentNormal(segment(this.p1, this.p2));
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: hit.point, t: hit.t, element: this, normal: facingRay };
  }

  public override onRayIncident(_ray: SimulationRay, _intersection: IntersectionResult): RayInteractionResult {
    return { isAbsorbed: true };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2 };
  }
}
