/**
 * CircleBlocker.ts
 *
 * A circular blocker defined by center (p1) and a boundary point (p2).
 * Absorbs all rays hitting its circumference.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  circle,
  distance,
  dot,
  normalize,
  type Point,
  point,
  rayCircleIntersections,
  subtract,
} from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

const MIN_RAY_LENGTH_SQ = 1e-6;

export class CircleBlocker extends BaseElement {
  public readonly type = "CircleBlocker";
  public readonly category: ElementCategory = "blocker";

  public p1: Point;
  public p2: Point;

  public constructor(p1: Point, p2: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
  }

  private get radius(): number {
    return distance(this.p1, this.p2);
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const hits = rayCircleIntersections(ray.origin, ray.direction, circle(this.p1, this.radius));
    for (const hit of hits) {
      const dSq = (hit.point.x - ray.origin.x) ** 2 + (hit.point.y - ray.origin.y) ** 2;
      if (dSq < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      const outwardNormal = normalize(subtract(hit.point, this.p1));
      const facingRay =
        dot(outwardNormal, ray.direction) < 0 ? outwardNormal : point(-outwardNormal.x, -outwardNormal.y);
      return { point: hit.point, t: hit.t, element: this, normal: facingRay };
    }
    return null;
  }

  public override onRayIncident(_ray: SimulationRay, _intersection: IntersectionResult): RayInteractionResult {
    return { isAbsorbed: true };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2 };
  }
}
