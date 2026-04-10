/**
 * BaseLightSource.ts
 *
 * Abstract base class for all single-wavelength light source elements.
 * Centralises the three properties shared by every concrete light source
 * (brightness, wavelength, category) and provides a protected
 * brightness-normalization helper used during ray emission.
 */

import { ELEMENT_CATEGORY_LIGHT_SOURCE } from "../../../OpticsLabStrings.js";
import { BaseElement } from "../optics/BaseElement.js";
import type { Point } from "../optics/Geometry.js";
import {
  BRIGHTNESS_CONTINUOUS_THRESHOLD,
  BRIGHTNESS_NORMALIZE,
  POLARIZATION_SPLIT,
  RAY_DENSITY_REFERENCE,
} from "../optics/OpticsConstants.js";
import type { ElementCategory, SimulationRay } from "../optics/OpticsTypes.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export abstract class BaseLightSource extends BaseElement {
  public readonly category: ElementCategory = ELEMENT_CATEGORY_LIGHT_SOURCE;

  private _brightness: number;
  private _wavelength: number;

  public get brightness(): number {
    return this._brightness;
  }
  public set brightness(v: number) {
    if (v <= 0) {
      throw new Error(`brightness must be positive, got ${v}`);
    }
    this._brightness = v;
  }

  public get wavelength(): number {
    return this._wavelength;
  }
  public set wavelength(v: number) {
    if (v <= 0) {
      throw new Error(`wavelength must be positive, got ${v}`);
    }
    this._wavelength = v;
  }

  protected constructor(brightness: number, wavelength: number = GREEN_WAVELENGTH) {
    super();
    // Initialise to valid sentinels first (TypeScript requires definite assignment
    // before any method call), then overwrite through the guarded setters so that
    // the invariants (brightness > 0, wavelength > 0) are enforced from the very
    // first construction — matching the pattern used by BaseGlass for refIndex.
    this._brightness = 1;
    this._wavelength = 1;
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
   *
   * At ray densities above RAY_DENSITY_REFERENCE the per-ray brightness is
   * scaled down inversely so that total luminosity is conserved: doubling the
   * number of rays halves each ray's intensity.  This lets overlapping
   * semi-transparent rays produce a continuous filled appearance at high
   * density (same approach as optics-template).
   *
   * @param rayDensity  The scene ray-density value used for this emission call.
   */
  protected normalizeBrightness(rayDensity: number): number {
    const isContinuous = this.brightness >= BRIGHTNESS_CONTINUOUS_THRESHOLD;
    const bBase = isContinuous ? this.brightness : BRIGHTNESS_CONTINUOUS_THRESHOLD;
    const densityFactor = Math.min(1, RAY_DENSITY_REFERENCE / rayDensity);
    return (bBase / BRIGHTNESS_NORMALIZE) * densityFactor;
  }

  /**
   * Construct a SimulationRay with the polarization split and source wavelength
   * already applied. All emitted rays go through this method.
   *
   * @param origin    Ray start position.
   * @param direction Pre-normalized direction vector.
   * @param b         Pre-computed brightness scalar (before polarization split).
   * @param gap       True for the first ray in an emission group.
   * @param sourceId  Emitting source ID (for continuous-ray rendering).
   * @param rayIndex  Index within the emission fan (for continuous-ray rendering).
   */
  protected makeRay(
    origin: Point,
    direction: Point,
    b: number,
    gap: boolean,
    sourceId?: string,
    rayIndex?: number,
  ): SimulationRay {
    return {
      origin,
      direction,
      brightnessS: b * POLARIZATION_SPLIT,
      brightnessP: b * POLARIZATION_SPLIT,
      gap,
      isNew: true,
      wavelength: this.wavelength,
      sourceId,
      rayIndex,
    };
  }
}
