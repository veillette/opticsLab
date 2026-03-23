/**
 * ReflectionGrating.ts
 *
 * A reflection diffraction grating defined by a line segment.
 * Light bounces off the grooved, mirrored surface and is dispersed into
 * multiple diffraction orders, according to the grating equation:
 *   d (sin θ_m + sin θ_i) = m λ   (reflection geometry)
 *
 * Properties:
 *  - linesDensity: groove density in lines/mm (1–2500)
 *  - dutyCycle:    slit-width to line-spacing ratio (0–1), controls order intensities
 */

import { GRATING_DEFAULT_LINES_DENSITY } from "../../../OpticsLabConstants.js";
import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import type { Point } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";
import { gratingRayInteraction } from "./gratingRayInteraction.js";

export class ReflectionGrating extends BaseSegmentElement {
  public readonly type = "ReflectionGrating";
  public readonly category: ElementCategory = "mirror";

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
    return gratingRayInteraction(this.linesDensity, this.dutyCycle, ray, intersection, "reflection");
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
