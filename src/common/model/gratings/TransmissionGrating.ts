/**
 * TransmissionGrating.ts
 *
 * A transmission diffraction grating defined by a line segment.
 * Light passes through the grating and is dispersed into multiple
 * diffraction orders on the opposite side, according to the grating equation:
 *   d (sin θ_m − sin θ_i) = m λ
 *
 * Properties:
 *  - linesDensity: groove density in lines/mm (1–2500)
 *  - dutyCycle:    slit-width to line-spacing ratio (0–1), controls order intensities
 */

import {
  GRATING_DEFAULT_LINES_DENSITY,
  GRATING_DEFAULT_WAVELENGTH_NM,
  GRATING_MAX_DIFFRACTION_ORDER,
} from "../../../OpticsLabConstants.js";
import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import { dot, normalize, type Point, point } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class TransmissionGrating extends BaseSegmentElement {
  public readonly type = "TransmissionGrating";
  public readonly category: ElementCategory = "glass";

  /** Groove density in lines per mm. */
  public linesDensity: number;
  /** Slit-width / line-spacing ratio (0–1). */
  public dutyCycle: number;

  public constructor(p1: Point, p2: Point, linesDensity = GRATING_DEFAULT_LINES_DENSITY, dutyCycle = 0.5) {
    super(p1, p2);
    this.linesDensity = linesDensity;
    this.dutyCycle = dutyCycle;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const n = intersection.normal;
    const wavelengthNm = ray.wavelength ?? GRATING_DEFAULT_WAVELENGTH_NM;
    // Grating spacing in metres
    const d = 1e-3 / this.linesDensity;
    const wavelengthM = wavelengthNm * 1e-9;

    // Compute grating tangent (perpendicular to normal, in the plane of the grating)
    const tangent = point(-n.y, n.x);

    // Angle of incidence: sin(θ_i) = dot(rayDir, tangent)
    const sinThetaI = dot(ray.direction, tangent);

    // Transmitted direction for m=0 is the incident direction (straight through)
    const newRays: SimulationRay[] = [];
    const avgBrightness = (ray.brightnessS + ray.brightnessP) / 2;

    // Collect valid orders and their intensities
    const orders: { m: number; intensity: number; dir: Point }[] = [];

    for (let m = -GRATING_MAX_DIFFRACTION_ORDER; m <= GRATING_MAX_DIFFRACTION_ORDER; m++) {
      const sinThetaM = sinThetaI + (m * wavelengthM) / d;
      if (Math.abs(sinThetaM) >= 1) {
        continue;
      }
      const cosThetaM = Math.sqrt(1 - sinThetaM * sinThetaM);

      // Transmitted ray exits on the opposite side of the grating from the incoming normal
      const outDir = normalize(
        point(-n.x * cosThetaM + tangent.x * sinThetaM, -n.y * cosThetaM + tangent.y * sinThetaM),
      );

      // sinc² envelope for slit of width a = dutyCycle * d
      const arg = m * this.dutyCycle;
      const intensity = m === 0 ? 1.0 : (Math.sin(Math.PI * arg) / (Math.PI * arg)) ** 2;
      if (intensity < 0.001) {
        continue;
      }

      orders.push({ m, intensity, dir: outDir });
    }

    // Normalise intensities so total doesn't exceed incident brightness
    const totalIntensity = orders.reduce((sum, o) => sum + o.intensity, 0);
    const scale = totalIntensity > 0 ? 1 / totalIntensity : 0;

    let outgoingRay: SimulationRay | undefined;
    for (const order of orders) {
      const brightness = avgBrightness * order.intensity * scale;
      const diffRay: SimulationRay = {
        origin: intersection.point,
        direction: order.dir,
        brightnessS: brightness,
        brightnessP: brightness,
        gap: false,
        isNew: false,
        wavelength: ray.wavelength,
      };

      if (order.m === 0) {
        outgoingRay = diffRay;
      } else {
        newRays.push(diffRay);
      }
    }

    const result: RayInteractionResult = {
      isAbsorbed: !outgoingRay && newRays.length === 0,
    };
    if (outgoingRay) {
      result.outgoingRay = outgoingRay;
    }
    if (newRays.length > 0) {
      result.newRays = newRays;
    }
    return result;
  }

  public serialize(): Record<string, unknown> {
    return {
      type: this.type,
      p1: this.p1,
      p2: this.p2,
      linesDensity: this.linesDensity,
      dutyCycle: this.dutyCycle,
    };
  }
}
