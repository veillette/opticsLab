/**
 * BeamSource.ts
 *
 * A perfectly parallel beam of light, defined by a segment perpendicular to
 * the beam direction. Emits multiple parallel rays evenly distributed along
 * the segment.
 */

import type { Point } from "../optics/Geometry.js";
import { distance, normalize, point, subtract } from "../optics/Geometry.js";
import { BEAM_RAY_DENSITY_SCALE, BRIGHTNESS_CONTINUOUS_THRESHOLD } from "../optics/OpticsConstants.js";
import type { SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { BaseLightSource } from "./BaseLightSource.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class BeamSource extends BaseLightSource {
  public readonly type = "Beam";

  /** First endpoint of the segment perpendicular to beam direction. */
  public p1: Point;
  /** Second endpoint of the segment perpendicular to beam direction. */
  public p2: Point;

  public constructor(p1: Point, p2: Point, brightness = 0.5, wavelength = GREEN_WAVELENGTH) {
    super(brightness, wavelength);
    this.p1 = p1;
    this.p2 = p2;
  }

  public override emitRays(rayDensity: number, _mode: ViewMode, jitter = false): SimulationRay[] {
    const segLen = distance(this.p1, this.p2);
    if (segLen < 1e-10) {
      return [];
    }

    const maxN = Math.max(1, Math.round(segLen * rayDensity * BEAM_RAY_DENSITY_SCALE));
    const isContinuous = this.brightness >= BRIGHTNESS_CONTINUOUS_THRESHOLD;
    const n = isContinuous ? maxN : Math.max(1, Math.round((this.brightness / BRIGHTNESS_CONTINUOUS_THRESHOLD) * maxN));
    const stepX = (this.p2.x - this.p1.x) / n;
    const stepY = (this.p2.y - this.p1.y) / n;
    const normal = Math.atan2(stepX, stepY) + Math.PI / 2.0;
    const b = Math.min(this.normalizeBrightness(rayDensity), 1);

    const rays: SimulationRay[] = [];

    for (let i = 0.5; i <= n; i++) {
      const jitterFrac = jitter ? Math.random() - 0.5 : 0;
      const x = this.p1.x + (i + jitterFrac) * stepX;
      const y = this.p1.y + (i + jitterFrac) * stepY;
      const dir = normalize(subtract(point(x + Math.sin(normal), y + Math.cos(normal)), point(x, y)));
      rays.push(this.makeRay(point(x, y), dir, b, i === 0.5));
    }

    return rays;
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
