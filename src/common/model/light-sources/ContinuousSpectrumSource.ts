/**
 * ContinuousSpectrumSource.ts
 *
 * A single-direction light source with a uniform continuous spectrum,
 * discretized into equal-energy rays at a fixed wavelength step.
 * Only meaningful when "Simulate Colors" is enabled.
 *
 * Control points:
 *   p1 – origin of the rays
 *   p2 – direction point (rays travel from p1 toward p2)
 *
 * Parameters:
 *   wavelengthMin  – minimum wavelength (nm)
 *   wavelengthStep – wavelength step between adjacent rays (nm)
 *   wavelengthMax  – maximum wavelength (nm)
 *   brightness     – total brightness shared equally across all wavelengths
 */

import { BaseElement } from "../optics/BaseElement.js";
import type { Point } from "../optics/Geometry.js";
import { normalize, point, subtract } from "../optics/Geometry.js";
import { BRIGHTNESS_NORMALIZE, POLARIZATION_SPLIT } from "../optics/OpticsConstants.js";
import type { ElementCategory, SimulationRay, ViewMode } from "../optics/OpticsTypes.js";

export class ContinuousSpectrumSource extends BaseElement {
  public readonly type = "continuousSpectrumSource";
  public readonly category: ElementCategory = "lightSource";

  /** Origin of all emitted rays. */
  public p1: Point;
  /** Direction point – rays travel from p1 toward p2. */
  public p2: Point;

  public wavelengthMin: number;
  public wavelengthStep: number;
  public wavelengthMax: number;
  public brightness: number;

  public constructor(
    p1: Point,
    p2: Point,
    wavelengthMin = 380,
    wavelengthStep = 10,
    wavelengthMax = 700,
    brightness = 0.5,
  ) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.wavelengthMin = wavelengthMin;
    this.wavelengthStep = wavelengthStep;
    this.wavelengthMax = wavelengthMax;
    this.brightness = brightness;
  }

  public override emitRays(_rayDensity: number, _mode: ViewMode): SimulationRay[] {
    const step = Math.max(1, this.wavelengthStep);
    const wavelengths: number[] = [];
    for (let wl = this.wavelengthMin; wl <= this.wavelengthMax + 1e-9; wl += step) {
      wavelengths.push(wl);
    }
    if (wavelengths.length === 0) {
      return [];
    }

    const dir = normalize(subtract(this.p2, this.p1));
    // Each wavelength ray carries the full per-ray brightness, matching the
    // convention of all other sources (PointSource, SingleRay, etc.).
    const b = this.brightness / BRIGHTNESS_NORMALIZE;

    const rays: SimulationRay[] = [];
    let first = true;
    for (const wavelength of wavelengths) {
      rays.push({
        origin: point(this.p1.x, this.p1.y),
        direction: dir,
        brightnessS: b * POLARIZATION_SPLIT,
        brightnessP: b * POLARIZATION_SPLIT,
        gap: first,
        isNew: true,
        wavelength,
      });
      first = false;
    }

    return rays;
  }

  public serialize(): Record<string, unknown> {
    return {
      type: this.type,
      p1: this.p1,
      p2: this.p2,
      wavelengthMin: this.wavelengthMin,
      wavelengthStep: this.wavelengthStep,
      wavelengthMax: this.wavelengthMax,
      brightness: this.brightness,
    };
  }
}
