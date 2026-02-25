/**
 * BeamSource.ts
 *
 * A parallel (or divergent) beam of light, defined by a segment
 * perpendicular to the beam direction. Emits multiple parallel rays
 * evenly distributed along the segment.
 */

import { BaseElement } from "../optics/BaseElement.js";
import type { Point } from "../optics/Geometry.js";
import { distance, normalize, point, subtract } from "../optics/Geometry.js";
import { POLARIZATION_SPLIT, RAY_DENSITY_SCALE } from "../optics/OpticsConstants.js";
import type { ElementCategory, SimulationRay, ViewMode } from "../optics/OpticsTypes.js";
import { GREEN_WAVELENGTH } from "./LightSourceConstants.js";

export class BeamSource extends BaseElement {
  public readonly type = "Beam";
  public readonly category: ElementCategory = "lightSource";

  /** First endpoint of the segment perpendicular to beam direction. */
  public p1: Point;
  /** Second endpoint of the segment perpendicular to beam direction. */
  public p2: Point;
  public brightness: number;
  public wavelength: number;
  /** Divergence half-angle in degrees (0 = perfectly parallel). */
  public emisAngle: number;

  public constructor(p1: Point, p2: Point, brightness = 0.5, wavelength = GREEN_WAVELENGTH, emisAngle = 0) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.brightness = brightness;
    this.wavelength = wavelength;
    this.emisAngle = emisAngle;
  }

  public override emitRays(rayDensity: number, _mode: ViewMode): SimulationRay[] {
    const segLen = distance(this.p1, this.p2);
    if (segLen < 1e-10) {
      return [];
    }

    const n = Math.max(1, Math.round(segLen * rayDensity));
    const stepX = (this.p2.x - this.p1.x) / n;
    const stepY = (this.p2.y - this.p1.y) / n;
    const normal = Math.atan2(stepX, stepY) + Math.PI / 2.0;
    const halfAngle = (this.emisAngle / 180) * Math.PI * 0.5;
    const angularStep = (Math.PI * 2) / Math.max(1, Math.floor(rayDensity * RAY_DENSITY_SCALE));
    const numAngledRays = 1 + Math.floor(halfAngle / angularStep) * 2;
    const brightnessFactor = 1.0 / numAngledRays;

    const rays: SimulationRay[] = [];

    for (let i = 0.5; i <= n; i++) {
      const x = this.p1.x + i * stepX;
      const y = this.p1.y + i * stepY;

      rays.push(this.createRay(x, y, normal, 0, i === 0.5, brightnessFactor, rayDensity));

      for (let angle = angularStep; angle < halfAngle; angle += angularStep) {
        rays.push(this.createRay(x, y, normal, angle, false, brightnessFactor, rayDensity));
        rays.push(this.createRay(x, y, normal, -angle, false, brightnessFactor, rayDensity));
      }
    }

    return rays;
  }

  private createRay(
    x: number,
    y: number,
    normalAngle: number,
    angle: number,
    gap: boolean,
    brightnessFactor: number,
    rayDensity: number,
  ): SimulationRay {
    const dir = normalize(
      subtract(point(x + Math.sin(normalAngle + angle), y + Math.cos(normalAngle + angle)), point(x, y)),
    );
    const b = Math.min((this.brightness / rayDensity) * brightnessFactor, 1);
    return {
      origin: point(x, y),
      direction: dir,
      brightnessS: b * POLARIZATION_SPLIT,
      brightnessP: b * POLARIZATION_SPLIT,
      gap,
      isNew: true,
      wavelength: this.wavelength,
    };
  }

  public serialize(): Record<string, unknown> {
    return {
      type: this.type,
      p1: this.p1,
      p2: this.p2,
      brightness: this.brightness,
      wavelength: this.wavelength,
      emisAngle: this.emisAngle,
    };
  }
}
