/**
 * ArcLightSource.ts
 *
 * A point light source that emits rays only within a finite angular cone.
 * The emission zone spans [direction − emissionAngle/2, direction + emissionAngle/2].
 *
 * Angle convention: standard screen coordinates where angle 0 = right,
 * π/2 = down (positive y-axis), consistent with Math.atan2(dy, dx).
 */

import type { Point } from "../optics/Geometry.js";
import { normalize, point } from "../optics/Geometry.js";
import { BRIGHTNESS_CONTINUOUS_THRESHOLD, POLARIZATION_SPLIT, RAY_DENSITY_SCALE } from "../optics/OpticsConstants.js";
import type { SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { BaseLightSource } from "./BaseLightSource.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class ArcLightSource extends BaseLightSource {
  public readonly type = "ArcSource";

  public position: Point;

  /**
   * Central emission direction α (radians).
   * 0 = right, π/2 = down, π = left, 3π/2 = up (screen coordinates, y-down).
   */
  public direction: number;

  /**
   * Total angular spread β (radians). The source emits in
   * [direction − β/2, direction + β/2]. Range: (0, 2π].
   */
  public emissionAngle: number;

  public constructor(
    position: Point,
    direction = 0,
    emissionAngle = Math.PI / 6, // 30 degrees
    brightness = 0.5,
    wavelength = GREEN_WAVELENGTH,
  ) {
    super(brightness, wavelength);
    this.position = position;
    this.direction = direction;
    this.emissionAngle = emissionAngle;
  }

  public override emitRays(rayDensity: number, _mode: ViewMode): SimulationRay[] {
    const beta = Math.max(0, this.emissionAngle);
    if (beta <= 0) {
      return [];
    }

    const baseStep = (Math.PI * 2) / Math.max(1, Math.floor(rayDensity * RAY_DENSITY_SCALE));
    const maxRays = Math.max(1, Math.ceil(beta / baseStep));
    const isContinuous = this.brightness >= BRIGHTNESS_CONTINUOUS_THRESHOLD;
    const numRays = isContinuous
      ? maxRays
      : Math.max(1, Math.round((this.brightness / BRIGHTNESS_CONTINUOUS_THRESHOLD) * maxRays));
    const angularStep = beta / numRays;
    const b = this.normalizeBrightness();

    const halfAngle = beta / 2;
    const startAngle = this.direction - halfAngle;
    const endAngle = this.direction + halfAngle;

    const rays: SimulationRay[] = [];
    let first = true;

    for (let angle = startAngle; angle < endAngle - 1e-9; angle += angularStep) {
      rays.push({
        origin: point(this.position.x, this.position.y),
        direction: normalize(point(Math.cos(angle), Math.sin(angle))),
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
      direction: this.direction,
      emissionAngle: this.emissionAngle,
      brightness: this.brightness,
      wavelength: this.wavelength,
    };
  }
}
