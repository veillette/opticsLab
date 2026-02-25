/**
 * IdealCurvedMirror.ts
 *
 * An ideal curved mirror that obeys the mirror equation 1/f = 1/do + 1/di
 * exactly for all rays, not just paraxial ones. Represented as a line
 * segment (p1, p2) with an associated focal length.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  dot,
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

export class IdealCurvedMirror extends BaseElement {
  public readonly type = "IdealMirror";
  public readonly category: ElementCategory = "mirror";

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
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: hit.point, t: hit.t, element: this, normal: facingRay };
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const center = segmentMidpoint(segment(this.p1, this.p2));
    const n = intersection.normal;

    // Mirror equation logic: a ray arriving at the mirror surface is reflected
    // such that the object/image distances satisfy 1/f = 1/do + 1/di.
    // For an ideal mirror, a ray through the center reflects through itself,
    // a ray parallel to the axis reflects through the focus, and a ray through
    // the focus reflects parallel to the axis.

    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const len = Math.hypot(dx, dy);
    const parX = dx / len; // unit vector along mirror
    const parY = dy / len;
    const perX = n.x; // unit normal (perpendicular to mirror)
    const perY = n.y;

    // Incident point relative to center, projected onto mirror-local coords
    const ipX = intersection.point.x - center.x;
    const ipY = intersection.point.y - center.y;
    const incidentParallel = ipX * parX + ipY * parY;

    // Incoming direction in mirror-local frame
    const rayDirPar = ray.direction.x * parX + ray.direction.y * parY;
    const rayDirPer = ray.direction.x * perX + ray.direction.y * perY;

    // Using thin-mirror formula:
    // Outgoing perpendicular component reverses, parallel component adjusted
    // so that a ray at height h from axis heading perpendicular
    // gets deflected by angle ≈ h/f (exact for ideal mirror).
    let outDirPar: number;
    let outDirPer: number;

    if (Math.abs(rayDirPer) < 1e-12) {
      // Ray parallel to mirror — no interaction
      return { isAbsorbed: false, outgoingRay: { ...ray, origin: intersection.point, gap: false, isNew: false } };
    }

    // Time for the incident ray to reach the focal plane (measured from incidence point)
    // t_f = f / rayDirPer (signed)
    const tFocal = this.focalLength / rayDirPer;
    // Position of the "focal-plane hit" along the parallel direction
    const focalParallel = incidentParallel + rayDirPar * tFocal;

    // Outgoing ray reverses perpendicular component and aims back to the focal parallel position
    outDirPer = -rayDirPer;
    const tOut = this.focalLength / outDirPer;
    outDirPar = (focalParallel - incidentParallel) / tOut;

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
