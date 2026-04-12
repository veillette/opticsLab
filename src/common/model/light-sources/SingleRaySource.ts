/**
 * SingleRaySource.ts
 *
 * A single directional ray of light. Defined by an origin point and
 * a second point that indicates direction. Emits exactly one ray.
 */

import { ELEMENT_TYPE_SINGLE_RAY } from "../../../OpticsLabStrings.js";
import type { Bounds, Point } from "../optics/Geometry.js";
import { normalize, point, pointsBounds, subtract } from "../optics/Geometry.js";
import type { SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { BaseLightSource } from "./BaseLightSource.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class SingleRaySource extends BaseLightSource {
  public readonly type = ELEMENT_TYPE_SINGLE_RAY;

  public p1: Point;
  public p2: Point;

  public constructor(p1: Point, p2: Point, brightness = 1, wavelength = GREEN_WAVELENGTH) {
    super(brightness, wavelength);
    this.p1 = p1;
    this.p2 = p2;
  }

  public getBounds(): Bounds {
    return pointsBounds([this.p1, this.p2]);
  }

  public override emitRays(_rayDensity: number, _mode: ViewMode): SimulationRay[] {
    const dir = normalize(subtract(this.p2, this.p1));
    return [this.makeRay(point(this.p1.x, this.p1.y), dir, this.brightness, true)];
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
