/**
 * TrackElement.ts
 *
 * A visual guide/rail defined by a line segment (p1, p2).
 * Does not interact with rays — it serves only as a snap target
 * for other optical elements dragged near it.
 */

import { ELEMENT_CATEGORY_GUIDE, ELEMENT_TYPE_TRACK } from "../../../OpticsLabStrings.js";
import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import type { ElementCategory, IntersectionResult, SimulationRay } from "../optics/OpticsTypes.js";

export class TrackElement extends BaseSegmentElement {
  public readonly type = ELEMENT_TYPE_TRACK;
  public readonly category: ElementCategory = ELEMENT_CATEGORY_GUIDE;

  public override checkRayIntersection(_ray: SimulationRay): IntersectionResult | null {
    return null;
  }

  public override serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2 };
  }
}
