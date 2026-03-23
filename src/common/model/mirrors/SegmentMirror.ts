/**
 * SegmentMirror.ts
 *
 * A flat mirror defined by a line segment. Reflects rays according to the
 * law of reflection: angle of incidence = angle of reflection.
 */

import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import { dot, normalize, point } from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class SegmentMirror extends BaseSegmentElement {
  public readonly type = "Mirror";
  public readonly category: ElementCategory = "mirror";

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const n = intersection.normal;
    const d = ray.direction;
    const dn = dot(d, n);
    const reflectedDir = point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y);
    return {
      isAbsorbed: false,
      outgoingRay: {
        origin: intersection.point,
        direction: normalize(reflectedDir),
        brightnessS: ray.brightnessS,
        brightnessP: ray.brightnessP,
        gap: false,
        isNew: false,
        wavelength: ray.wavelength,
      },
    };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2 };
  }
}
