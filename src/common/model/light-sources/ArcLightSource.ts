/**
 * ArcLightSource.ts
 *
 * A point light source that emits rays only within a finite angular cone.
 * The emission zone spans [direction − emissionAngle/2, direction + emissionAngle/2].
 *
 * Angle convention: standard screen coordinates where angle 0 = right,
 * π/2 = down (positive y-axis), consistent with Math.atan2(dy, dx).
 */

import { DEFAULT_ARC_CONE_HALF_ANGLE_RAD } from "../../../OpticsLabConstants.js";
import { ELEMENT_TYPE_ARC_SOURCE } from "../../../OpticsLabStrings.js";
import type { Bounds, Point } from "../optics/Geometry.js";
import { normalize, point } from "../optics/Geometry.js";
import { BRIGHTNESS_CONTINUOUS_THRESHOLD, RAY_DENSITY_SCALE } from "../optics/OpticsConstants.js";
import type { SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { BaseLightSource } from "./BaseLightSource.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class ArcLightSource extends BaseLightSource {
  public readonly type = ELEMENT_TYPE_ARC_SOURCE;

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
    emissionAngle = DEFAULT_ARC_CONE_HALF_ANGLE_RAD,
    brightness = 0.5,
    wavelength = GREEN_WAVELENGTH,
  ) {
    super(brightness, wavelength);
    this.position = position;
    this.direction = direction;
    this.emissionAngle = emissionAngle;
  }

  public getBounds(): Bounds {
    return { minX: this.position.x, minY: this.position.y, maxX: this.position.x, maxY: this.position.y };
  }

  public override emitRays(rayDensity: number, _mode: ViewMode, jitter = false): SimulationRay[] {
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
    const b = this.normalizeBrightness(rayDensity);

    const halfAngle = beta / 2;
    const startAngle = this.direction - halfAngle;
    const endAngle = this.direction + halfAngle;

    const rays: SimulationRay[] = [];
    let first = true;
    let idx = 0;

    for (let angle = startAngle; angle < endAngle - 1e-9; angle += angularStep) {
      const jitterOffset = jitter ? (Math.random() - 0.5) * angularStep : 0;
      const jitteredAngle = angle + jitterOffset;
      rays.push(
        this.makeRay(
          point(this.position.x, this.position.y),
          normalize(point(Math.cos(jitteredAngle), Math.sin(jitteredAngle))),
          b,
          first,
          this.id,
          idx,
        ),
      );
      first = false;
      idx++;
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
