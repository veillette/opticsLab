/**
 * DetectorAcquisition.ts
 *
 * Manages time-based acquisition and histogram accumulation for a detector.
 * Extracted from DetectorElement so that geometry, hit storage, and acquisition
 * timing are each owned by a focused class.
 *
 * Usage:
 *   const acq = new DetectorAcquisition(numBins);
 *   acq.start();
 *   // on each simulation pass while isAcquiring:
 *   acq.accumulate(t, brightness);
 *   // on each animation frame:
 *   if (acq.step(dt)) { ... acquisition finished ... }
 */

import { ACQUISITION_DURATION_S } from "../../../OpticsLabConstants.js";

export class DetectorAcquisition {
  /** Number of histogram bins. */
  public numBins: number;

  /** Accumulated irradiance per bin (sized to numBins at acquisition start). */
  public bins: number[] = [];

  /** True while an acquisition pass is in progress. */
  public isAcquiring = false;

  /** True after an acquisition pass has completed (cleared on next start()). */
  public isComplete = false;

  private elapsed = 0;

  public constructor(numBins: number) {
    this.numBins = numBins;
  }

  /** Begin a new acquisition pass, resetting previous results. */
  public start(): void {
    this.bins = new Array(this.numBins).fill(0);
    this.isAcquiring = true;
    this.isComplete = false;
    this.elapsed = 0;
  }

  /**
   * Advance the acquisition timer by dt seconds.
   * @returns true when the acquisition has just finished.
   */
  public step(dt: number): boolean {
    if (!this.isAcquiring) {
      return false;
    }
    this.elapsed += dt;
    if (this.elapsed >= ACQUISITION_DURATION_S) {
      this.isAcquiring = false;
      this.isComplete = true;
      return true;
    }
    return false;
  }

  /**
   * Add a ray hit to the histogram bin corresponding to normalized position t ∈ [0, 1].
   * Should only be called while isAcquiring is true.
   */
  public accumulate(t: number, brightness: number): void {
    const bin = Math.min(this.numBins - 1, Math.floor(t * this.numBins));
    this.bins[bin] = (this.bins[bin] ?? 0) + brightness;
  }

  /** Clear completed acquisition data (e.g. when the scene changes). */
  public clearIfComplete(): void {
    if (this.isComplete) {
      this.isComplete = false;
      this.bins = [];
    }
  }
}
