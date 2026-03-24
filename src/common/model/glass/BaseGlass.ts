/**
 * BaseGlass.ts
 *
 * Abstract base class for all glass elements. Provides common refractive
 * properties (refIndex, cauchyB, partialReflect) and the core refraction
 * computation (Snell's law vector form + Fresnel equations). Follows the
 * architecture of optics-template/src/core/sceneObjs/BaseGlass.js.
 */

import { CAUCHY_WAVELENGTH_FACTOR, DEFAULT_CAUCHY_B, DEFAULT_REFRACTIVE_INDEX } from "../../../OpticsLabConstants.js";
import { BaseElement } from "../optics/BaseElement.js";
import { normalize, type Point, point } from "../optics/Geometry.js";
import { FRESNEL_REFLECTION_THRESHOLD } from "../optics/OpticsConstants.js";
import type { ElementCategory, RayInteractionResult, SimulationRay } from "../optics/OpticsTypes.js";

export abstract class BaseGlass extends BaseElement {
  public readonly category: ElementCategory = "glass";

  /** Global toggle controlled by preferences. When false, Fresnel reflection is suppressed for all glass elements. */
  public static partialReflectionEnabled = true;

  private _refIndex: number;
  public cauchyB: number;
  public partialReflect: boolean;

  public get refIndex(): number {
    return this._refIndex;
  }
  public set refIndex(v: number) {
    if (v === 0) {
      throw new Error(`refIndex must not be zero (would cause division by zero in Snell's law)`);
    }
    this._refIndex = v;
  }

  protected constructor(refIndex = DEFAULT_REFRACTIVE_INDEX, cauchyB = DEFAULT_CAUCHY_B, partialReflect = true) {
    super();
    this._refIndex = refIndex;
    this.cauchyB = cauchyB;
    this.partialReflect = partialReflect;
  }

  /**
   * Effective refractive index at a surface point, accounting for Cauchy
   * dispersion when wavelength simulation is active.
   */
  public getRefIndexAt(_point: Point | null, ray: SimulationRay): number {
    if (ray.wavelength !== undefined) {
      return this.refIndex + this.cauchyB / (ray.wavelength * ray.wavelength * CAUCHY_WAVELENGTH_FACTOR);
    }
    return this.refIndex;
  }

  /**
   * Core refraction at a glass surface using the Snell's law vector form.
   * Handles total internal reflection, partial Fresnel reflection, and
   * negative refractive indices.
   *
   * @param ray - Incident ray.
   * @param incidentPoint - Point of incidence on the surface.
   * @param normal - Surface normal at incidence (must face the incoming ray so
   *   that cos θ_i = −n̂·d̂ > 0).
   * @param n1 - Ratio n_incident / n_transmitted.
   */
  protected refractRay(ray: SimulationRay, incidentPoint: Point, normal: Point, n1Param: number): RayInteractionResult {
    let modNeg = false;
    let n1 = n1Param;
    if (n1 < 0) {
      n1 = -n1;
      modNeg = true;
    }

    const normalLen = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    const nx = normal.x / normalLen;
    const ny = normal.y / normalLen;

    const d = ray.direction;
    const dLen = Math.sqrt(d.x * d.x + d.y * d.y);
    const dx = d.x / dLen;
    const dy = d.y / dLen;

    const cos1 = -(nx * dx + ny * dy);
    const sq1 = 1 - n1 * n1 * (1 - cos1 * cos1);

    if (sq1 < 0) {
      const reflDir = normalize(point(dx + 2 * cos1 * nx, dy + 2 * cos1 * ny));
      return {
        isAbsorbed: false,
        outgoingRay: {
          origin: incidentPoint,
          direction: reflDir,
          brightnessS: ray.brightnessS,
          brightnessP: ray.brightnessP,
          gap: false,
          isNew: false,
          wavelength: ray.wavelength,
        },
      };
    }

    let cos2 = Math.sqrt(sq1);

    let Rs = 0;
    let Rp = 0;
    if (this.partialReflect && BaseGlass.partialReflectionEnabled) {
      Rs = ((n1 * cos1 - cos2) / (n1 * cos1 + cos2)) ** 2;
      Rp = ((n1 * cos2 - cos1) / (n1 * cos2 + cos1)) ** 2;
    }

    const newRays: SimulationRay[] = [];
    let truncation = 0;

    const reflDir = normalize(point(dx + 2 * cos1 * nx, dy + 2 * cos1 * ny));
    const reflBrightS = ray.brightnessS * Rs;
    const reflBrightP = ray.brightnessP * Rp;
    if (reflBrightS + reflBrightP > FRESNEL_REFLECTION_THRESHOLD) {
      newRays.push({
        origin: incidentPoint,
        direction: reflDir,
        brightnessS: reflBrightS,
        brightnessP: reflBrightP,
        gap: true,
        isNew: false,
        wavelength: ray.wavelength,
      });
    } else {
      truncation += reflBrightS + reflBrightP;
    }

    if (modNeg) {
      n1 = -n1;
      cos2 = Math.cos(2 * Math.PI - Math.acos(cos2));
    }

    const refrDir = normalize(point(n1 * dx + (n1 * cos1 - cos2) * nx, n1 * dy + (n1 * cos1 - cos2) * ny));
    const refrBrightS = ray.brightnessS * (1 - Rs);
    const refrBrightP = ray.brightnessP * (1 - Rp);

    if (refrBrightS + refrBrightP > 0) {
      const result: RayInteractionResult = {
        isAbsorbed: false,
        outgoingRay: {
          origin: incidentPoint,
          direction: refrDir,
          brightnessS: refrBrightS,
          brightnessP: refrBrightP,
          gap: false,
          isNew: false,
          wavelength: ray.wavelength,
        },
      };
      if (newRays.length > 0) {
        result.newRays = newRays;
      }
      if (truncation > 0) {
        result.truncation = truncation;
      }
      return result;
    }

    const absResult: RayInteractionResult = {
      isAbsorbed: true,
      truncation: truncation + refrBrightS + refrBrightP,
    };
    if (newRays.length > 0) {
      absResult.newRays = newRays;
    }
    return absResult;
  }

  /**
   * Determine whether the ray is incident from inside to outside or vice versa.
   * @returns 1 (inside→outside), -1 (outside→inside), 0 (overlap), NaN (edge/ambiguous)
   */
  public abstract getIncidentType(ray: SimulationRay): number;
}
