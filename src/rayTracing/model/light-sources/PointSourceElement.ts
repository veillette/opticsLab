/**
 * PointSourceElement.ts
 *
 * A 360-degree point source of light that emits rays uniformly in all
 * directions. The angular spacing of rays depends on rayDensity.
 */

import { BaseElement } from "../optics/BaseElement.js";
import type { Point } from "../optics/Geometry.js";
import { point } from "../optics/Geometry.js";
import { POLARIZATION_SPLIT, RAY_DENSITY_SCALE } from "../optics/OpticsConstants.js";
import type { ElementCategory, SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class PointSourceElement extends BaseElement {
  public readonly type = "PointSource";
  public readonly category: ElementCategory = "lightSource";

  public position: Point;
  public brightness: number;
  public wavelength: number;

  public constructor(position: Point, brightness = 0.5, wavelength = GREEN_WAVELENGTH) {
    super();
    this.position = position;
    this.brightness = brightness;
    this.wavelength = wavelength;
  }

  public override emitRays(rayDensity: number, mode: ViewMode): SimulationRay[] {
    const angularStep = (Math.PI * 2) / Math.max(1, Math.floor(rayDensity * RAY_DENSITY_SCALE));
    const startAngle = mode === "observer" ? -angularStep * 2 + 1e-6 : 0;
    const b = Math.min(this.brightness / rayDensity, 1);

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
