/**
 * SegmentMirror.ts
 *
 * A flat mirror defined by a line segment. Reflects rays according to the
 * law of reflection: angle of incidence = angle of reflection.
 */

import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import { normalize, point, subtract } from "../optics/Geometry.js";
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
    const inDir = normalize(subtract(ray.origin, intersection.point));
    const n = intersection.normal;
    const reflectedDir = point(
      inDir.x * (n.y * n.y - n.x * n.x) - 2 * inDir.y * n.x * n.y,
      inDir.y * (n.x * n.x - n.y * n.y) - 2 * inDir.x * n.x * n.y,
    );
    return {
      isAbsorbed: false,
      outgoingRay: {
        origin: intersection.point,
        direction: normalize(point(-reflectedDir.x, -reflectedDir.y)),
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
