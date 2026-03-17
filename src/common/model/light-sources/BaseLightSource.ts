/**
 * BaseLightSource.ts
 *
 * Abstract base class for all single-wavelength light source elements.
 * Centralises the three properties shared by every concrete light source
 * (brightness, wavelength, category) and provides a protected
 * brightness-normalization helper used during ray emission.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  BRIGHTNESS_CONTINUOUS_THRESHOLD,
  BRIGHTNESS_NORMALIZE,
} from "../optics/OpticsConstants.js";
import type { ElementCategory } from "../optics/OpticsTypes.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export abstract class BaseLightSource extends BaseElement {
  public readonly category: ElementCategory = "lightSource";

  public brightness: number;
  public wavelength: number;

  protected constructor(brightness: number, wavelength: number = GREEN_WAVELENGTH) {
    super();
    this.brightness = brightness;
    this.wavelength = wavelength;
  }

  /**
   * Returns the per-ray brightness factor (before polarization split).
   *
   * Two emission modes:
   * - Discrete  (brightness < BRIGHTNESS_CONTINUOUS_THRESHOLD): every ray
   *   carries a fixed intensity of BRIGHTNESS_CONTINUOUS_THRESHOLD so that
   *   visual appearance is consistent regardless of how many rays are drawn.
   * - Continuous (brightness >= BRIGHTNESS_CONTINUOUS_THRESHOLD): intensity
   *   scales linearly with brightness up to BRIGHTNESS_NORMALIZE.
   */
  protected normalizeBrightness(): number {
    const isContinuous = this.brightness >= BRIGHTNESS_CONTINUOUS_THRESHOLD;
    const bBase = isContinuous ? this.brightness : BRIGHTNESS_CONTINUOUS_THRESHOLD;
    return bBase / BRIGHTNESS_NORMALIZE;
  }
}
