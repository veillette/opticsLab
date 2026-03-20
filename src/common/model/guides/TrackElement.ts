/**
 * TrackElement.ts
 *
 * A visual guide/rail defined by a line segment (p1, p2).
 * Does not interact with rays — it serves only as a snap target
 * for other optical elements dragged near it.
 */

import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import type { Point } from "../optics/Geometry.js";
import type { ElementCategory, IntersectionResult, SimulationRay } from "../optics/OpticsTypes.js";

export class TrackElement extends BaseSegmentElement {
  public readonly type = "Track";
  public readonly category: ElementCategory = "guide";

  public constructor(p1: Point, p2: Point) {
    super(p1, p2);
  }

  public override checkRayIntersection(_ray: SimulationRay): IntersectionResult | null {
    return null;
  }

  public override serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2 };
  }
}
