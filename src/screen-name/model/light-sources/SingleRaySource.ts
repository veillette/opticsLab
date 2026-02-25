/**
 * SingleRaySource.ts
 *
 * A single directional ray of light. Defined by an origin point and
 * a second point that indicates direction. Emits exactly one ray.
 */

import { BaseElement } from "../optics/BaseElement.js";
import type { Point } from "../optics/Geometry.js";
import { normalize, point, subtract } from "../optics/Geometry.js";
import type { ElementCategory, SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class SingleRaySource extends BaseElement {
  public readonly type = "SingleRay";
  public readonly category: ElementCategory = "lightSource";

  public p1: Point;
  public p2: Point;
  public brightness: number;
  public wavelength: number;

  public constructor(p1: Point, p2: Point, brightness = 1, wavelength = GREEN_WAVELENGTH) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.brightness = brightness;
    this.wavelength = wavelength;
  }

  public override emitRays(_rayDensity: number, _mode: ViewMode): SimulationRay[] {
    const dir = normalize(subtract(this.p2, this.p1));
    return [
      {
        origin: point(this.p1.x, this.p1.y),
        direction: dir,
        brightnessS: 0.5 * this.brightness,
        brightnessP: 0.5 * this.brightness,
        gap: true,
        isNew: true,
        wavelength: this.wavelength,
      },
    ];
  }

  public serialize(): Record<string, unknown> {
    return {
      type: this.type,
      p1: this.p1,
      p2: this.p2,
      brightness: this.brightness,
      wavelength: this.wavelength,
    };
  }
}
