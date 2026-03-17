/**
 * DetectorElement.ts
 *
 * A line-segment detector that absorbs all incident rays and records
 * irradiance (brightness) along its length in spatial bins.
 */

import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import { subtract } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export const DETECTOR_BINS_MIN = 8;
export const DETECTOR_BINS_MAX = 128;
const DEFAULT_NUM_BINS = 64;

export class DetectorElement extends BaseSegmentElement {
  public readonly type = "Detector";
  public readonly category: ElementCategory = "blocker";

  /** Number of spatial bins along the detector length. */
  private _numBins: number = DEFAULT_NUM_BINS;

  /** Irradiance accumulated per spatial bin along the detector length. */
  public binData: number[] = new Array(DEFAULT_NUM_BINS).fill(0);

  /** Total absorbed optical power. */
  public totalPower = 0;

  public get numBins(): number {
    return this._numBins;
  }

  public set numBins(value: number) {
    this._numBins = value;
    this.binData = new Array(value).fill(0);
    this.totalPower = 0;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const segDir = subtract(this.p2, this.p1);
    const len = Math.hypot(segDir.x, segDir.y);

    if (len > 0) {
      const toHit = subtract(intersection.point, this.p1);
      const dist = (toHit.x * segDir.x + toHit.y * segDir.y) / len;
      const binIndex = Math.min(this._numBins - 1, Math.max(0, Math.floor((dist / len) * this._numBins)));
      const brightness = ray.brightnessS + ray.brightnessP;
      this.binData[binIndex] = (this.binData[binIndex] ?? 0) + brightness;
      this.totalPower += brightness;
    }

    return { isAbsorbed: true };
  }

  /** Reset all bins and accumulated power before a new simulation pass. */
  public clearBins(): void {
    this.binData.fill(0);
    this.totalPower = 0;
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, numBins: this._numBins };
  }
}
