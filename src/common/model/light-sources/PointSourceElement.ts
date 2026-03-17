/**
 * PointSourceElement.ts
 *
 * A 360-degree point source of light that emits rays uniformly in all
 * directions. The angular spacing of rays depends on rayDensity.
 */

import type { Point } from "../optics/Geometry.js";
import { point } from "../optics/Geometry.js";
import { BRIGHTNESS_CONTINUOUS_THRESHOLD, POLARIZATION_SPLIT, RAY_DENSITY_SCALE } from "../optics/OpticsConstants.js";
import type { SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { BaseLightSource } from "./BaseLightSource.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class PointSourceElement extends BaseLightSource {
  public readonly type = "PointSource";

  public position: Point;

  public constructor(position: Point, brightness = 0.5, wavelength = GREEN_WAVELENGTH) {
    super(brightness, wavelength);
    this.position = position;
  }

  public override emitRays(rayDensity: number, mode: ViewMode): SimulationRay[] {
    const maxRays = Math.max(1, Math.floor(rayDensity * RAY_DENSITY_SCALE));
    const isContinuous = this.brightness >= BRIGHTNESS_CONTINUOUS_THRESHOLD;
    const numRays = isContinuous
      ? maxRays
      : Math.max(1, Math.round((this.brightness / BRIGHTNESS_CONTINUOUS_THRESHOLD) * maxRays));
    const angularStep = (Math.PI * 2) / numRays;
    const startAngle = mode === "observer" ? -angularStep * 2 + 1e-6 : 0;
    // In discrete mode every ray has fixed intensity (BRIGHTNESS_CONTINUOUS_THRESHOLD).
    // In continuous mode intensity scales with brightness up to BRIGHTNESS_NORMALIZE.
    const b = this.normalizeBrightness();

    const rays: SimulationRay[] = [];
    let first = true;

    for (let angle = startAngle; angle < Math.PI * 2 - 1e-5; angle += angularStep) {
      rays.push({
        origin: point(this.position.x, this.position.y),
        direction: point(Math.sin(angle), Math.cos(angle)),
        brightnessS: b * POLARIZATION_SPLIT,
        brightnessP: b * POLARIZATION_SPLIT,
        gap: first,
        isNew: true,
        wavelength: this.wavelength,
      });
      first = false;
    }

    return rays;
  }

  public serialize(): Record<string, unknown> {
    return {
      type: this.type,
      x: this.position.x,
      y: this.position.y,
      brightness: this.brightness,
      wavelength: this.wavelength,
    };
  }
}
