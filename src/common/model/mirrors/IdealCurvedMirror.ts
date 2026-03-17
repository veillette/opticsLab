/**
 * IdealCurvedMirror.ts
 *
 * An ideal curved mirror that obeys the mirror equation 1/f = 1/do + 1/di
 * exactly for all rays, not just paraxial ones. Represented as a line
 * segment (p1, p2) with an associated focal length.
 */

import { DEFAULT_FOCAL_LENGTH } from "../../../OpticsLabConstants.js";
import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import {
  distanceSquared,
  line,
  linesIntersection,
  normalize,
  type Point,
  point,
  segment,
  segmentMidpoint,
} from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class IdealCurvedMirror extends BaseSegmentElement {
  public readonly type = "IdealMirror";
  public readonly category: ElementCategory = "mirror";

  public focalLength: number;

  public constructor(p1: Point, p2: Point, focalLength = DEFAULT_FOCAL_LENGTH) {
    super(p1, p2);
    this.focalLength = focalLength;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const ip = intersection.point;
    const center = segmentMidpoint(segment(this.p1, this.p2));

    // Mirror segment direction (unnormalized — magnitude cancels in reflection formula)
    const mx = this.p2.x - this.p1.x;
    const my = this.p2.y - this.p1.y;

    // Optical axis = normal to mirror at center (same convention as reference)
    const mirLen = Math.hypot(mx, my);
    const axisX = -my / mirLen; // (-dy, dx) / len  →  same as segmentNormal
    const axisY = mx / mirLen;

    // Two points at 2f along the optical axis from the center
    const twoF1 = point(center.x + axisX * 2 * this.focalLength, center.y + axisY * 2 * this.focalLength);
    const twoF2 = point(center.x - axisX * 2 * this.focalLength, center.y - axisY * 2 * this.focalLength);

    // Near = same side as ray origin, Far = opposite side
    const nearIsF1 = distanceSquared(ray.origin, twoF1) < distanceSquared(ray.origin, twoF2);
    const twoFNear = nearIsF1 ? twoF1 : twoF2;
    const twoFFar = nearIsF1 ? twoF2 : twoF1;

    // Lines parallel to the mirror through each 2f point
    const lineNear = line(twoFNear, point(twoFNear.x + mx, twoFNear.y + my));
    const lineFar = line(twoFFar, point(twoFFar.x + mx, twoFFar.y + my));

    // Incoming ray as an infinite line
    const incidentLine = line(ray.origin, point(ray.origin.x + ray.direction.x, ray.origin.y + ray.direction.y));

    // Geometric 2f construction — mirrors the reference implementation exactly.
    // For f > 0 (converging): trace ray → near-2f plane, connect to center, intersect far-2f plane.
    // For f < 0 (diverging):  trace ray → far-2f plane, connect to center, intersect near-2f plane,
    //                          connect to ip, intersect far-2f plane.
    let lensTarget: Point | null;
    const passThrough: RayInteractionResult = {
      isAbsorbed: false,
      outgoingRay: { ...ray, origin: ip, gap: false, isNew: false },
    };
    if (this.focalLength > 0) {
      const nearHit = linesIntersection(lineNear, incidentLine);
      if (!nearHit) {
        return passThrough;
      }
      lensTarget = linesIntersection(lineFar, line(center, nearHit));
    } else {
      const farHit = linesIntersection(lineFar, incidentLine);
      if (!farHit) {
        return passThrough;
      }
      const nearHit = linesIntersection(lineNear, line(center, farHit));
      if (!nearHit) {
        return passThrough;
      }
      lensTarget = linesIntersection(lineFar, line(ip, nearHit));
    }

    if (!lensTarget) {
      return passThrough;
    }

    // Reflect the reversed lens direction (ip − lensTarget) across the mirror surface.
    // This formula reflects (rx,ry) across the line with direction (mx,my):
    //   outX = rx*(my²−mx²) − 2*ry*mx*my   (equivalent to: reflect -(lensDir) across mirror normal)
    //   outY = ry*(mx²−my²) − 2*rx*mx*my
    // The unnormalized (mx,my) only affects magnitude, which we discard via normalize().
    const rx = ip.x - lensTarget.x;
    const ry = ip.y - lensTarget.y;
    const outX = rx * (my * my - mx * mx) - 2 * ry * mx * my;
    const outY = ry * (mx * mx - my * my) - 2 * rx * mx * my;

    return {
      isAbsorbed: false,
      outgoingRay: {
        origin: ip,
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
