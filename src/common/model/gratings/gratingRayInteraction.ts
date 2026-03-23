/**
 * Shared ray interaction for line-segment diffraction gratings.
 * Transmission and reflection use the same grating equation for sin(θ_m);
 * they differ only in whether the outgoing ray lies on the −n or +n side of the surface.
 */

import { GRATING_DEFAULT_WAVELENGTH_NM, GRATING_MAX_DIFFRACTION_ORDER } from "../../../OpticsLabConstants.js";
import { dot, normalize, type Point, point } from "../optics/Geometry.js";
import type { IntersectionResult, RayInteractionResult, SimulationRay } from "../optics/OpticsTypes.js";

export type GratingInteractionMode = "transmission" | "reflection";

export function gratingRayInteraction(
  linesDensity: number,
  dutyCycle: number,
  ray: SimulationRay,
  intersection: IntersectionResult,
  mode: GratingInteractionMode,
): RayInteractionResult {
  const n = intersection.normal;
  const wavelengthNm = ray.wavelength ?? GRATING_DEFAULT_WAVELENGTH_NM;
  const d = 1e-3 / linesDensity;
  const wavelengthM = wavelengthNm * 1e-9;

  const tangent = point(-n.y, n.x);
  const sinThetaI = dot(ray.direction, tangent);
  const normalSign = mode === "reflection" ? 1 : -1;

  const newRays: SimulationRay[] = [];
  const avgBrightness = (ray.brightnessS + ray.brightnessP) / 2;
  const orders: { m: number; intensity: number; dir: Point }[] = [];

  for (let m = -GRATING_MAX_DIFFRACTION_ORDER; m <= GRATING_MAX_DIFFRACTION_ORDER; m++) {
    const sinThetaM = sinThetaI + (m * wavelengthM) / d;
    if (Math.abs(sinThetaM) >= 1) {
      continue;
    }
    const cosThetaM = Math.sqrt(1 - sinThetaM * sinThetaM);
    const outDir = normalize(
      point(normalSign * n.x * cosThetaM + tangent.x * sinThetaM, normalSign * n.y * cosThetaM + tangent.y * sinThetaM),
    );

    const arg = m * dutyCycle;
    const intensity = m === 0 ? 1.0 : (Math.sin(Math.PI * arg) / (Math.PI * arg)) ** 2;
    if (intensity < 0.001) {
      continue;
    }

    orders.push({ m, intensity, dir: outDir });
  }

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
