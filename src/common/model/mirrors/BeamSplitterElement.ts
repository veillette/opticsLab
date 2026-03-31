/**
 * BeamSplitterElement.ts
 *
 * A beam splitter modeled as a line segment. When a ray hits it, a fraction
 * (transRatio) is transmitted and the rest is reflected. The reflected ray
 * follows the law of reflection, while the transmitted ray continues
 * in the original direction.
 */

import { ELEMENT_CATEGORY_MIRROR, ELEMENT_TYPE_BEAM_SPLITTER } from "../../../OpticsLabStrings.js";
import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import { dot, normalize, type Point, point } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class BeamSplitterElement extends BaseSegmentElement {
  public readonly type = ELEMENT_TYPE_BEAM_SPLITTER;
  public readonly category: ElementCategory = ELEMENT_CATEGORY_MIRROR;

  /** Fraction of brightness transmitted (0..1). The rest is reflected. */
  public transRatio: number;

  public constructor(p1: Point, p2: Point, transRatio = 0.5) {
    super(p1, p2);
    this.transRatio = transRatio;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const n = intersection.normal;
    const d = ray.direction;
    const dn = dot(d, n);

    // Reflected ray
    const reflectedDir = normalize(point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y));
    const reflectRatio = 1 - this.transRatio;

    const reflectedRay: SimulationRay = {
      origin: intersection.point,
      direction: reflectedDir,
      brightnessS: ray.brightnessS * reflectRatio,
      brightnessP: ray.brightnessP * reflectRatio,
      gap: true,
      isNew: false,
      wavelength: ray.wavelength,
    };

    // Transmitted ray continues in original direction
    const transmittedRay: SimulationRay = {
      origin: intersection.point,
      direction: point(d.x, d.y),
      brightnessS: ray.brightnessS * this.transRatio,
      brightnessP: ray.brightnessP * this.transRatio,
      gap: false,
      isNew: false,
      wavelength: ray.wavelength,
    };

    return {
      isAbsorbed: false,
      outgoingRay: transmittedRay,
      newRays: [reflectedRay],
    };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, transRatio: this.transRatio };
  }
}
