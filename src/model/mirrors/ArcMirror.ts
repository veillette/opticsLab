/**
 * ArcMirror.ts
 *
 * A mirror shaped as a circular arc, defined by three points:
 * two endpoints (p1, p2) and a control point on the arc (p3).
 * Reflects rays off the curved surface using the local normal
 * (radial direction from the circle center).
 */

import { BaseElement } from "../optics/BaseElement.js";
import {
  circle,
  distance,
  distanceSquared,
  dot,
  linesIntersection,
  normalize,
  type Point,
  perpendicularBisector,
  point,
  rayCircleIntersections,
  segment,
  subtract,
} from "../optics/Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

const MIN_RAY_LENGTH_SQ = 1e-6;

export class ArcMirror extends BaseElement {
  public readonly type = "ArcMirror";
  public readonly category: ElementCategory = "mirror";

  public p1: Point;
  public p2: Point;
  /** Control point on the arc. */
  public p3: Point;

  public constructor(p1: Point, p2: Point, p3: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  private getArcGeometry(): { center: Point; radius: number } | null {
    const center = linesIntersection(
      perpendicularBisector(segment(this.p1, this.p3)),
      perpendicularBisector(segment(this.p2, this.p3)),
    );
    if (!(center && isFinite(center.x) && isFinite(center.y))) {
      return null;
    }
    return { center, radius: distance(center, this.p3) };
  }

  /**
   * Whether a point on the full circle is within the arc span from p1 to p2
   * passing through p3.
   */
  private isOnArc(p: Point, center: Point): boolean {
    const a1 = Math.atan2(this.p1.y - center.y, this.p1.x - center.x);
    const a2 = Math.atan2(this.p2.y - center.y, this.p2.x - center.x);
    const a3 = Math.atan2(this.p3.y - center.y, this.p3.x - center.x);
    const ap = Math.atan2(p.y - center.y, p.x - center.x);
    const ccw = (a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2);
    const onArc = (a2 < ap && ap < a1) || (a1 < a2 && a2 < ap) || (ap < a1 && a1 < a2);
    return ccw === onArc;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const geo = this.getArcGeometry();
    if (!geo) {
      return null; // degenerate collinear arc — not handled here
    }

    const hits = rayCircleIntersections(ray.origin, ray.direction, circle(geo.center, geo.radius));
    let best: { t: number; point: Point } | null = null;
    for (const hit of hits) {
      if (distanceSquared(hit.point, ray.origin) < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      if (!this.isOnArc(hit.point, geo.center)) {
        continue;
      }
      if (!best || hit.t < best.t) {
        best = hit;
      }
    }
    if (!best) {
      return null;
    }
    const normal = normalize(subtract(best.point, geo.center));
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: best.point, t: best.t, element: this, normal: facingRay };
  }

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
    return { type: this.type, p1: this.p1, p2: this.p2, p3: this.p3 };
  }
}
