/**
 * HalfPlaneGlass.ts
 *
 * A glass half-plane: everything on one side of a line segment boundary
 * has refractive index `refIndex`. Rays crossing the boundary are
 * refracted by Snell's law. The "inside" is the left side when
 * looking from p1 toward p2.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  dot,
  fresnelReflectance,
  normalize,
  type Point,
  point,
  raySegmentIntersection,
  refract,
  segment,
  segmentNormal,
} from "../optics/Geometry.js";
import { FRESNEL_REFLECTION_THRESHOLD } from "../optics/OpticsConstants.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class HalfPlaneGlass extends BaseElement {
  public readonly type = "PlaneGlass";
  public readonly category: ElementCategory = "glass";

  public p1: Point;
  public p2: Point;
  public refIndex: number;

  public constructor(p1: Point, p2: Point, refIndex = 1.5) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.refIndex = refIndex;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const hit = raySegmentIntersection(ray.origin, ray.direction, segment(this.p1, this.p2));
    if (!hit) {
      return null;
    }
    const normal = segmentNormal(segment(this.p1, this.p2));
    return { point: hit.point, t: hit.t, element: this, normal };
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    let n = intersection.normal;
    const cosI = -dot(ray.direction, n);

    // Determine which side the ray is coming from
    let n1: number;
    let n2: number;
    if (cosI > 0) {
      // Entering the glass
      n1 = 1;
      n2 = this.refIndex;
    } else {
      // Exiting the glass
      n1 = this.refIndex;
      n2 = 1;
      n = point(-n.x, -n.y);
    }

    const refractedDir = refract(ray.direction, n, n1, n2);
    if (!refractedDir) {
      // Total internal reflection
      const d = ray.direction;
      const dn = dot(d, n);
      return {
        isAbsorbed: false,
        outgoingRay: {
          origin: intersection.point,
          direction: normalize(point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y)),
          brightnessS: ray.brightnessS,
          brightnessP: ray.brightnessP,
          gap: false,
          isNew: false,
          wavelength: ray.wavelength,
        },
      };
    }

    const absCosI = Math.abs(dot(ray.direction, n));
    const [Rs, Rp] = fresnelReflectance(absCosI, n1, n2);

    // Primary ray: refracted
    const outgoing: SimulationRay = {
      origin: intersection.point,
      direction: normalize(refractedDir),
      brightnessS: ray.brightnessS * (1 - Rs),
      brightnessP: ray.brightnessP * (1 - Rp),
      gap: false,
      isNew: false,
      wavelength: ray.wavelength,
    };

    // Partially reflected ray
    const reflBrightS = ray.brightnessS * Rs;
    const reflBrightP = ray.brightnessP * Rp;
    const newRays: SimulationRay[] = [];
    if (reflBrightS + reflBrightP > FRESNEL_REFLECTION_THRESHOLD) {
      const d = ray.direction;
      const dn = dot(d, n);
      newRays.push({
        origin: intersection.point,
        direction: normalize(point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y)),
        brightnessS: reflBrightS,
        brightnessP: reflBrightP,
        gap: true,
        isNew: false,
        wavelength: ray.wavelength,
      });
    }

    return { isAbsorbed: false, outgoingRay: outgoing, newRays };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, refIndex: this.refIndex };
  }
}
