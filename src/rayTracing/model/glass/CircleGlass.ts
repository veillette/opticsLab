/**
 * CircleGlass.ts
 *
 * A circular glass element defined by a center (p1) and a point on the
 * boundary (p2). Refracts rays at both entry and exit surfaces using
 * Snell's law with Fresnel partial reflections.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  circle,
  distance,
  dot,
  fresnelReflectance,
  normalize,
  type Point,
  point,
  pointInCircle,
  rayCircleIntersections,
  refract,
  subtract,
} from "../optics/Geometry.js";
import { FRESNEL_REFLECTION_THRESHOLD, MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class CircleGlass extends BaseElement {
  public readonly type = "CircleGlass";
  public readonly category: ElementCategory = "glass";

  /** Center of the circle. */
  public p1: Point;
  /** A point on the circle boundary. */
  public p2: Point;
  public refIndex: number;

  public constructor(p1: Point, p2: Point, refIndex = 1.5) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.refIndex = refIndex;
  }

  private get radius(): number {
    return distance(this.p1, this.p2);
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const r = this.radius;
    const hits = rayCircleIntersections(ray.origin, ray.direction, circle(this.p1, r));
    for (const hit of hits) {
      const dSq = (hit.point.x - ray.origin.x) ** 2 + (hit.point.y - ray.origin.y) ** 2;
      if (dSq < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      const outwardNormal = normalize(subtract(hit.point, this.p1));
      return { point: hit.point, t: hit.t, element: this, normal: outwardNormal };
    }
    return null;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const isInside = pointInCircle(ray.origin, circle(this.p1, this.radius));
    let n = intersection.normal;
    let n1: number;
    let n2: number;

    if (isInside) {
      n1 = this.refIndex;
      n2 = 1;
      n = point(-n.x, -n.y); // flip normal inward
    } else {
      n1 = 1;
      n2 = this.refIndex;
    }

    const refractedDir = refract(ray.direction, n, n1, n2);
    if (!refractedDir) {
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

    const outgoing: SimulationRay = {
      origin: intersection.point,
      direction: normalize(refractedDir),
      brightnessS: ray.brightnessS * (1 - Rs),
      brightnessP: ray.brightnessP * (1 - Rp),
      gap: false,
      isNew: false,
      wavelength: ray.wavelength,
    };

    const newRays: SimulationRay[] = [];
    const reflBrightS = ray.brightnessS * Rs;
    const reflBrightP = ray.brightnessP * Rp;
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
