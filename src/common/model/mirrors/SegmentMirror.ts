/**
 * SegmentMirror.ts
 *
 * A flat mirror defined by a line segment. Reflects rays according to the
 * law of reflection: angle of incidence = angle of reflection.
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  dot,
  normalize,
  type Point,
  point,
  raySegmentIntersection,
  segment,
  segmentNormal,
  subtract,
} from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class SegmentMirror extends BaseElement {
  public readonly type = "Mirror";
  public readonly category: ElementCategory = "mirror";

  public p1: Point;
  public p2: Point;

  public constructor(p1: Point, p2: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
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
