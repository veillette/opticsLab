/**
 * BeamSplitterElement.ts
 *
 * A beam splitter modeled as a line segment. When a ray hits it, a fraction
 * (transRatio) is transmitted and the rest is reflected. The reflected ray
 * follows the law of reflection, while the transmitted ray continues
 * in the original direction.
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
} from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class BeamSplitterElement extends BaseElement {
  public readonly type = "BeamSplitter";
  public readonly category: ElementCategory = "mirror";

  public p1: Point;
  public p2: Point;
  /** Fraction of brightness transmitted (0..1). The rest is reflected. */
  public transRatio: number;

  public constructor(p1: Point, p2: Point, transRatio = 0.5) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.transRatio = transRatio;
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
