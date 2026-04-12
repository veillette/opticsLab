/**
 * PointSourceElement.ts
 *
 * A 360-degree point source of light that emits rays uniformly in all
 * directions. The angular spacing of rays depends on rayDensity.
 */

import { ELEMENT_TYPE_POINT_SOURCE } from "../../../OpticsLabStrings.js";
import type { Bounds, Point } from "../optics/Geometry.js";
import { point } from "../optics/Geometry.js";
import { BRIGHTNESS_CONTINUOUS_THRESHOLD, RAY_DENSITY_SCALE } from "../optics/OpticsConstants.js";
import type { SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { BaseLightSource } from "./BaseLightSource.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class PointSourceElement extends BaseLightSource {
  public readonly type = ELEMENT_TYPE_POINT_SOURCE;

  public position: Point;

  public constructor(position: Point, brightness = 0.5, wavelength = GREEN_WAVELENGTH) {
    super(brightness, wavelength);
    this.position = position;
  }

  public getBounds(): Bounds {
    return { minX: this.position.x, minY: this.position.y, maxX: this.position.x, maxY: this.position.y };
  }

  public override emitRays(rayDensity: number, mode: ViewMode, jitter = false): SimulationRay[] {
    const maxRays = Math.max(1, Math.floor(rayDensity * RAY_DENSITY_SCALE));
    const isContinuous = this.brightness >= BRIGHTNESS_CONTINUOUS_THRESHOLD;
    const numRays = isContinuous
      ? maxRays
      : Math.max(1, Math.round((this.brightness / BRIGHTNESS_CONTINUOUS_THRESHOLD) * maxRays));
    const angularStep = (Math.PI * 2) / numRays;
    const startAngle = mode === "observer" ? -angularStep * 2 + 1e-6 : 0;
    // In discrete mode every ray has fixed intensity (BRIGHTNESS_CONTINUOUS_THRESHOLD).
    // In continuous mode intensity scales with brightness up to BRIGHTNESS_NORMALIZE.
    const b = this.normalizeBrightness(rayDensity);

    const rays: SimulationRay[] = [];
    let first = true;
    let idx = 0;

    for (let angle = startAngle; angle < Math.PI * 2 - 1e-5; angle += angularStep) {
      const jitterOffset = jitter ? (Math.random() - 0.5) * angularStep : 0;
      const jitteredAngle = angle + jitterOffset;
      rays.push(
        this.makeRay(
          point(this.position.x, this.position.y),
          point(Math.sin(jitteredAngle), Math.cos(jitteredAngle)),
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
      brightness: this.brightness,
      wavelength: this.wavelength,
    };
  }
}
