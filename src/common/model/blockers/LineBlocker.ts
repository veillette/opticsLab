/**
 * LineBlocker.ts
 *
 * A line-segment blocker that absorbs all rays hitting it.
 */

import { ELEMENT_CATEGORY_BLOCKER, ELEMENT_TYPE_LINE_BLOCKER } from "../../../OpticsLabStrings.js";
import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class LineBlocker extends BaseSegmentElement {
  public readonly type = ELEMENT_TYPE_LINE_BLOCKER;
  public readonly category: ElementCategory = ELEMENT_CATEGORY_BLOCKER;

  public override onRayIncident(_ray: SimulationRay, _intersection: IntersectionResult): RayInteractionResult {
    return { isAbsorbed: true };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2 };
  }
}
