/**
 * ApertureElement.ts
 *
 * An aperture with a hole. Defined by four colinear points:
 *   p1 ──── p3 (hole start) ··· p4 (hole end) ──── p2
 * The segments p1–p3 and p4–p2 are opaque blockers.
 * The gap p3–p4 lets light through.
 */

import { BaseElement } from "../optics/BaseElement.js";
import { dot, type Point, point, raySegmentIntersection, segment, segmentNormal } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class ApertureElement extends BaseElement {
  public readonly type = "Aperture";
  public readonly category: ElementCategory = "blocker";

  /** Outer endpoint 1. */
  public p1: Point;
  /** Outer endpoint 2. */
  public p2: Point;
  /** Inner endpoint 1 (start of the hole). */
  public p3: Point;
  /** Inner endpoint 2 (end of the hole). */
  public p4: Point;

  public constructor(p1: Point, p2: Point, p3: Point, p4: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    // Test intersection with the two opaque segments (p1→p3 and p4→p2)
    const hit1 = raySegmentIntersection(ray.origin, ray.direction, segment(this.p1, this.p3));
    const hit2 = raySegmentIntersection(ray.origin, ray.direction, segment(this.p4, this.p2));

    let best: { t: number; point: Point; seg: { p1: Point; p2: Point } } | null = null;
    if (hit1) {
      best = { ...hit1, seg: { p1: this.p1, p2: this.p3 } };
    }
    if (hit2 && (!best || hit2.t < best.t)) {
      best = { ...hit2, seg: { p1: this.p4, p2: this.p2 } };
    }

    if (!best) {
      return null;
    }

    const normal = segmentNormal(segment(best.seg.p1, best.seg.p2));
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: best.point, t: best.t, element: this, normal: facingRay };
  }

  public override onRayIncident(_ray: SimulationRay, _intersection: IntersectionResult): RayInteractionResult {
    return { isAbsorbed: true };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, p3: this.p3, p4: this.p4 };
  }
}
