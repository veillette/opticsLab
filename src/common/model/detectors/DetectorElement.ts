/**
 * DetectorElement.ts
 *
 * A line-segment detector that absorbs all incident rays and records
 * each hit as an exact normalized position along its length together
 * with the ray brightness. Precision is limited only by the number of
 * simulated rays, not by a bin count.
 */

import { ACQUISITION_DURATION_S, DETECTOR_NUM_BINS } from "../../../OpticsLabConstants.js";
import { BaseSegmentElement } from "../optics/BaseSegmentElement.js";
import {
  circle,
  circumcenter,
  distance,
  distanceSquared,
  dot,
  normalize,
  type Point,
  point,
  rayCircleIntersections,
  subtract,
} from "../optics/Geometry.js";
import { MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

/** Maximum number of hits stored; older hits are replaced via reservoir sampling. */
export const DETECTOR_MAX_HITS = 2000;

export type DetectorHit = { t: number; brightness: number };

export class DetectorElement extends BaseSegmentElement {
  public readonly type = "Detector";
  public readonly category: ElementCategory = "blocker";

  /** Control point on the arc (determines curvature; kept on perpendicular bisector of p1–p2). */
  public p3: Point;

  public constructor(p1: Point, p2: Point, p3?: Point) {
    super(p1, p2);
    // Default p3 to the midpoint (degenerate/flat arc) when not provided.
    this.p3 = p3 ?? { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  /** Returns the radius of curvature, or null if the arc is degenerate (flat). */
  public getRadius(): number | null {
    return circumcenter(this.p1, this.p2, this.p3)?.radius ?? null;
  }

  /**
   * Adjusts p3 so the radius of curvature becomes R, keeping p1 and p2 fixed
   * and preserving the current side (which side of the chord p3 is on).
   * Does nothing if R is too small to span the current chord.
   */
  public setRadius(R: number): void {
    const mx = (this.p1.x + this.p2.x) / 2;
    const my = (this.p1.y + this.p2.y) / 2;
    const h = distance(this.p1, this.p2) / 2;
    if (R < h) {
      return;
    }
    const dx = this.p3.x - mx;
    const dy = this.p3.y - my;
    const mag = Math.sqrt(dx * dx + dy * dy);
    let perpX: number;
    let perpY: number;
    if (mag < 1e-10) {
      const cx = this.p2.x - this.p1.x;
      const cy = this.p2.y - this.p1.y;
      const clen = Math.sqrt(cx * cx + cy * cy);
      perpX = -cy / clen;
      perpY = cx / clen;
    } else {
      perpX = dx / mag;
      perpY = dy / mag;
    }
    const sagitta = R - Math.sqrt(R * R - h * h);
    this.p3 = point(mx + sagitta * perpX, my + sagitta * perpY);
  }

  /** Raw hit records — normalized position t ∈ [0, 1] along the segment. */
  public hits: DetectorHit[] = [];

  /** Total number of rays that have hit the detector (including those dropped by the cap). */
  public totalHitCount = 0;

  /** Total absorbed optical power. */
  public totalPower = 0;

  /** Number of bins used for histogram display and acquisition accumulation. */
  public numBins: number = DETECTOR_NUM_BINS;

  /** Accumulated irradiance bins from an acquisition pass (sized to numBins at acquisition start). */
  public acquiredBins: number[] = [];

  /** True while an acquisition is in progress. */
  public isAcquiring = false;

  /** True after an acquisition has completed (cleared on next startAcquisition). */
  public acquisitionComplete = false;

  private acquisitionElapsed = 0;

  public startAcquisition(): void {
    this.acquiredBins = new Array(this.numBins).fill(0);
    this.isAcquiring = true;
    this.acquisitionComplete = false;
    this.acquisitionElapsed = 0;
  }

  /** Advance the acquisition timer by dt seconds. Returns true when acquisition finishes. */
  public stepAcquisition(dt: number): boolean {
    if (!this.isAcquiring) {
      return false;
    }
    this.acquisitionElapsed += dt;
    if (this.acquisitionElapsed >= ACQUISITION_DURATION_S) {
      this.isAcquiring = false;
      this.acquisitionComplete = true;
      return true;
    }
    return false;
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const arcGeometry = circumcenter(this.p1, this.p2, this.p3);

    if (!arcGeometry) {
      // Collinear (flat): fall back to segment intersection from base class.
      return super.checkRayIntersection(ray);
    }

    const hits = rayCircleIntersections(ray.origin, ray.direction, circle(arcGeometry.center, arcGeometry.radius));
    let best: { t: number; point: Point } | null = null;
    for (const hit of hits) {
      if (distanceSquared(hit.point, ray.origin) < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      if (!this.isOnArc(hit.point, arcGeometry.center)) {
        continue;
      }
      if (!best || hit.t < best.t) {
        best = hit;
      }
    }
    if (!best) {
      return null;
    }
    const normal = normalize(subtract(best.point, arcGeometry.center));
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: best.point, t: best.t, element: this, normal: facingRay };
  }

  /** Returns true when a circle point lies within the arc span from p1 to p2 through p3. */
  private isOnArc(p: Point, center: Point): boolean {
    const a1 = Math.atan2(this.p1.y - center.y, this.p1.x - center.x);
    const a2 = Math.atan2(this.p2.y - center.y, this.p2.x - center.x);
    const a3 = Math.atan2(this.p3.y - center.y, this.p3.x - center.x);
    const ap = Math.atan2(p.y - center.y, p.x - center.x);
    const ccw = (a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2);
    const onArc = (a2 < ap && ap < a1) || (a1 < a2 && a2 < ap) || (ap < a1 && a1 < a2);
    return ccw === onArc;
  }

  public override onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult {
    const t = this.computeArcT(intersection.point);
    const brightness = ray.brightnessS + ray.brightnessP;

    this.totalHitCount++;
    this.totalPower += brightness;

    // Reservoir sampling: keep a uniform random sample of up to DETECTOR_MAX_HITS
    if (this.hits.length < DETECTOR_MAX_HITS) {
      this.hits.push({ t, brightness });
    } else {
      const idx = Math.floor(Math.random() * this.totalHitCount);
      if (idx < DETECTOR_MAX_HITS) {
        this.hits[idx] = { t, brightness };
      }
    }

    // Accumulate into acquisition bins when an acquisition pass is running
    if (this.isAcquiring) {
      const bin = Math.min(this.numBins - 1, Math.floor(t * this.numBins));
      this.acquiredBins[bin] = (this.acquiredBins[bin] ?? 0) + brightness;
    }

    return { isAbsorbed: true };
  }

  /** Normalized arc position t ∈ [0, 1] from p1 to p2 through p3 for the given hit point. */
  private computeArcT(hitPoint: Point): number {
    const arcGeometry = circumcenter(this.p1, this.p2, this.p3);

    if (!arcGeometry) {
      // Collinear fallback: project onto segment.
      const segDir = subtract(this.p2, this.p1);
      const len2 = segDir.x * segDir.x + segDir.y * segDir.y;
      if (len2 === 0) {
        return 0;
      }
      const toHit = subtract(hitPoint, this.p1);
      return Math.min(1, Math.max(0, (toHit.x * segDir.x + toHit.y * segDir.y) / len2));
    }

    const { center } = arcGeometry;
    const norm2pi = (a: number): number => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const a1 = norm2pi(Math.atan2(this.p1.y - center.y, this.p1.x - center.x));
    const a2 = norm2pi(Math.atan2(this.p2.y - center.y, this.p2.x - center.x));
    const a3 = norm2pi(Math.atan2(this.p3.y - center.y, this.p3.x - center.x));
    const ah = norm2pi(Math.atan2(hitPoint.y - center.y, hitPoint.x - center.x));

    const ccwSweep12 = norm2pi(a2 - a1);
    const ccwDist13 = norm2pi(a3 - a1);
    // CCW if p3 lies within the CCW arc from p1 to p2; otherwise CW.
    const sweepAngle = ccwDist13 < ccwSweep12 ? ccwSweep12 : -(2 * Math.PI - ccwSweep12);

    let t: number;
    if (sweepAngle >= 0) {
      t = norm2pi(ah - a1) / sweepAngle;
    } else {
      t = norm2pi(a1 - ah) / -sweepAngle;
    }
    return Math.min(1, Math.max(0, t));
  }

  /** Reset all hit data before a new simulation pass. */
  public clearHits(): void {
    this.hits = [];
    this.totalHitCount = 0;
    this.totalPower = 0;
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, p3: this.p3 };
  }
}
