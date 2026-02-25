/**
 * IdealLens.ts
 *
 * An ideal thin lens that obeys the thin lens equation 1/f = 1/do + 1/di
 * exactly for all rays. Represented as a line segment (p1, p2) with a
 * focal length. Unlike glass elements, an ideal lens does not use Snell's
 * law — it directly maps incoming rays to outgoing rays via the lens equation.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  normalize,
  type Point,
  point,
  raySegmentIntersection,
  segment,
  segmentMidpoint,
  segmentNormal,
} from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class IdealLens extends BaseElement {
  public readonly type = "IdealLens";
  public readonly category: ElementCategory = "glass";

  public p1: Point;
  public p2: Point;
  public focalLength: number;

  public constructor(p1: Point, p2: Point, focalLength = 100) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.focalLength = focalLength;
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
    const center = segmentMidpoint(segment(this.p1, this.p2));
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const len = Math.hypot(dx, dy);

    if (len < 1e-10) {
      return { isAbsorbed: false, outgoingRay: { ...ray, origin: intersection.point, gap: false, isNew: false } };
    }

    // Lens-local coordinate system: "par" along the lens, "per" along the optical axis
    const parX = dx / len;
    const parY = dy / len;
    const n = intersection.normal;
    const perX = n.x;
    const perY = n.y;

    // Ray direction in lens-local coords
    const rayDirPar = ray.direction.x * parX + ray.direction.y * parY;
    const rayDirPer = ray.direction.x * perX + ray.direction.y * perY;

    if (Math.abs(rayDirPer) < 1e-12) {
      // Ray parallel to lens — passes through unaffected
      return { isAbsorbed: false, outgoingRay: { ...ray, origin: intersection.point, gap: false, isNew: false } };
    }

    // Height of incidence on the lens (distance from optical axis along lens)
    const ipX = intersection.point.x - center.x;
    const ipY = intersection.point.y - center.y;
    const h = ipX * parX + ipY * parY;

    // Thin lens deflection: the ray is deflected so that its parallel
    // slope changes by -h/f while perpendicular component is preserved
    const slopeIn = rayDirPar / rayDirPer;
    const slopeOut = slopeIn - h / this.focalLength;

    // Reconstruct direction: per component keeps its sign
    const outDirPer = Math.sign(rayDirPer);
    const outDirPar = slopeOut * outDirPer;
    const outX = outDirPar * parX + outDirPer * perX;
    const outY = outDirPar * parY + outDirPer * perY;

    return {
      isAbsorbed: false,
      outgoingRay: {
        origin: intersection.point,
        direction: normalize(point(outX, outY)),
        brightnessS: ray.brightnessS,
        brightnessP: ray.brightnessP,
        gap: false,
        isNew: false,
        wavelength: ray.wavelength,
      },
    };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, focalLength: this.focalLength };
  }
}
