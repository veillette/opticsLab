/**
 * BaseSegmentElement.ts
 *
 * Abstract base class for optical elements defined by a line segment (p1, p2).
 * Provides shared p1/p2 fields and a default checkRayIntersection that tests
 * for a segment hit and returns a normal oriented toward the incoming ray.
 */

import { BaseElement } from "./BaseElement.js";
import {
  type Bounds,
  dot,
  type Point,
  point,
  pointsBounds,
  raySegmentIntersection,
  segment,
  segmentNormal,
} from "./Geometry.js";
import type { IntersectionResult, SimulationRay } from "./OpticsTypes.js";

export abstract class BaseSegmentElement extends BaseElement {
  public p1: Point;
  public p2: Point;

  public constructor(p1: Point, p2: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
  }

  public getBounds(): Bounds {
    return pointsBounds([this.p1, this.p2]);
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
}
