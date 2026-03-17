/**
 * DetectorElement.ts
 *
 * A line-segment detector that absorbs all incident rays and records
 * each hit as an exact normalized position along its length together
 * with the ray brightness. Precision is limited only by the number of
 * simulated rays, not by a bin count.
 */

import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import { subtract } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

/** Maximum number of hits stored; older hits are replaced via reservoir sampling. */
export const DETECTOR_MAX_HITS = 2000;

export type DetectorHit = { t: number; brightness: number };

export class DetectorElement extends BaseSegmentElement {
  public readonly type = "Detector";
  public readonly category: ElementCategory = "blocker";

  /** Raw hit records — normalized position t ∈ [0, 1] along the segment. */
  public hits: DetectorHit[] = [];

  /** Total number of rays that have hit the detector (including those dropped by the cap). */
  public totalHitCount = 0;

  /** Total absorbed optical power. */
  public totalPower = 0;

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const segDir = subtract(this.p2, this.p1);
    const len2 = segDir.x * segDir.x + segDir.y * segDir.y;

    if (len2 > 0) {
      const toHit = subtract(intersection.point, this.p1);
      const t = Math.min(1, Math.max(0, (toHit.x * segDir.x + toHit.y * segDir.y) / len2));
      const brightness = ray.brightnessS + ray.brightnessP;

      this.totalHitCount++;
      this.totalPower += brightness;

      // Reservoir sampling: keep a uniform random sample of up to DETECTOR_MAX_HITS
      if (this.hits.length < DETECTOR_MAX_HITS) {
        this.hits.push({ t, brightness });
      } else {
        const idx = Math.floor(Math.random() * this.totalHitCount);
        if (idx < DETECTOR_MAX_HITS) {
          this.hits[idx] = { t, brightness };
        }
      }
    }

    return { isAbsorbed: true };
  }

  /** Reset all hit data before a new simulation pass. */
  public clearHits(): void {
    this.hits = [];
    this.totalHitCount = 0;
    this.totalPower = 0;
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2 };
  }
}
