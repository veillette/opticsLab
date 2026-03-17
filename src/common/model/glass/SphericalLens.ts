/**
 * SphericalLens.ts
 *
 * A spherical lens built from two circular arc surfaces joined by straight
 * edges at the aperture rim. Extends Glass using a 6-point path:
 *
 *   path[0]: top-left   (arc=false)
 *   path[1]: top-right  (arc=false)
 *   path[2]: right arc control (arc=true)  ← right refracting surface
 *   path[3]: bottom-right (arc=false)
 *   path[4]: bottom-left  (arc=false)
 *   path[5]: left arc control  (arc=true)  ← left refracting surface
 *
 * The edges are:
 *   0→1: line (top aperture edge)
 *   1→2→3: arc (right surface)
 *   3→4: line (bottom aperture edge)
 *   4→5→0: arc (left surface)
 *
 * This class follows optics-template/src/core/sceneObjs/glass/SphericalLens.js
 * for the path construction and parameter extraction logic.
 *
 * Sign convention for radii:
 *   R > 0 → center of curvature on the positive perpendicular side
 *   R < 0 → center of curvature on the negative perpendicular side
 *   R = ±Infinity → flat surface
 */

import {
  distance,
  distanceSquared,
  linesIntersection,
  midpoint,
  type Point,
  perpendicularBisector,
  point,
  segment,
} from "../optics/Geometry.js";
import { Glass, type GlassPathPoint } from "./Glass.js";

export class SphericalLens extends Glass {
  public override readonly type = "SphericalLens";

  /** Top aperture endpoint (used as construction reference). */
  public p1: Point;
  /** Bottom aperture endpoint (used as construction reference). */
  public p2: Point;

  /**
   * @param p1 - First endpoint of the lens aperture (rim).
   * @param p2 - Second endpoint of the lens aperture (rim).
   * @param r1 - Radius of curvature of the left surface.
   * @param r2 - Radius of curvature of the right surface.
   * @param refIndex - Refractive index of the lens material.
   */
  public constructor(p1: Point, p2: Point, r1: number, r2: number, refIndex = 1.5) {
    super([], refIndex);
    this.p1 = p1;
    this.p2 = p2;

    const aperture = distance(p1, p2);
    const defaultD = Math.max(aperture * 0.3, 0.2);
    if (!this.createLensWithDR1R2(defaultD, r1, r2)) {
      this.createDefaultLens();
    }
  }

  /**
   * Build the 6-point path from thickness (d) and radii of curvature.
   * Returns true if the lens was built successfully, false if invalid.
   */
  public createLensWithDR1R2(d: number, r1: number, r2: number): boolean {
    const p1 = this.p1;
    const p2 = this.p2;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (len < 1e-10) {
      return false;
    }

    const dx = (p2.x - p1.x) / len;
    const dy = (p2.y - p1.y) / len;
    const dpx = dy;
    const dpy = -dx;
    const cx = (p1.x + p2.x) * 0.5;
    const cy = (p1.y + p2.y) * 0.5;

    const curveShift1 = computeCurveShift(r1, len);
    const curveShift2 = computeCurveShift(r2, len);

    if (Number.isNaN(curveShift1) || Number.isNaN(curveShift2)) {
      return false;
    }

    const edgeShift1 = d / 2 - curveShift1;
    const edgeShift2 = d / 2 + curveShift2;

    const newPoints = [
      { x: p1.x - dpx * edgeShift1, y: p1.y - dpy * edgeShift1, arc: false },
      { x: p1.x + dpx * edgeShift2, y: p1.y + dpy * edgeShift2, arc: false },
      { x: cx + dpx * (d / 2), y: cy + dpy * (d / 2), arc: true },
      { x: p2.x + dpx * edgeShift2, y: p2.y + dpy * edgeShift2, arc: false },
      { x: p2.x - dpx * edgeShift1, y: p2.y - dpy * edgeShift1, arc: false },
      { x: cx - dpx * (d / 2), y: cy - dpy * (d / 2), arc: true },
    ] as const;

    // Mutate existing elements in-place so GlassView's captured references stay valid.
    // Replacing this.path with a new array would orphan the references held by
    // handleVerts and allVertPoints in GlassView, breaking drag and handle display.
    if (this.path.length === newPoints.length) {
      for (let i = 0; i < newPoints.length; i++) {
        const dest = this.path[i];
        if (dest) {
          Object.assign(dest, newPoints[i]);
        }
      }
    } else {
      this.path = newPoints.map((p) => ({ ...p }));
    }
    return true;
  }

  /** Create a default biconvex lens shape with reasonable thickness. */
  private createDefaultLens(): void {
    const p1 = this.p1;
    const p2 = this.p2;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (len < 1e-10) {
      this.path = [{ x: p1.x, y: p1.y }];
      return;
    }

    const dx = (p2.x - p1.x) / len;
    const dy = (p2.y - p1.y) / len;
    const dpx = dy;
    const dpy = -dx;
    const cx = (p1.x + p2.x) * 0.5;
    const cy = (p1.y + p2.y) * 0.5;
    const thick = 10;

    this.path = [
      { x: p1.x - dpx * thick, y: p1.y - dpy * thick, arc: false },
      { x: p1.x + dpx * thick, y: p1.y + dpy * thick, arc: false },
      { x: cx + dpx * thick * 2, y: cy + dpy * thick * 2, arc: true },
      { x: p2.x + dpx * thick, y: p2.y + dpy * thick, arc: false },
      { x: p2.x - dpx * thick, y: p2.y - dpy * thick, arc: false },
      { x: cx - dpx * thick * 2, y: cy - dpy * thick * 2, arc: true },
    ];
  }

  /**
   * Extract d, r1, r2 from the current 6-point path.
   */
  public getDR1R2(): { d: number; r1: number; r2: number } {
    if (this.path.length < 6) {
      return { d: 0, r1: Infinity, r2: Infinity };
    }

    // Safe: guarded by length check above
    const v0 = this.path[0] as GlassPathPoint;
    const v1 = this.path[1] as GlassPathPoint;
    const v2 = this.path[2] as GlassPathPoint;
    const v3 = this.path[3] as GlassPathPoint;
    const v4 = this.path[4] as GlassPathPoint;
    const v5 = this.path[5] as GlassPathPoint;

    const p0 = point(v0.x, v0.y);
    const p1pt = point(v1.x, v1.y);
    const p2pt = point(v2.x, v2.y);
    const p3pt = point(v3.x, v3.y);
    const p4pt = point(v4.x, v4.y);
    const p5pt = point(v5.x, v5.y);

    const center1 = linesIntersection(
      perpendicularBisector(segment(p1pt, p2pt)),
      perpendicularBisector(segment(p3pt, p2pt)),
    );
    let r2 = center1 ? distance(center1, p2pt) : Infinity;

    const center2 = linesIntersection(
      perpendicularBisector(segment(p4pt, p5pt)),
      perpendicularBisector(segment(p0, p5pt)),
    );
    let r1 = center2 ? distance(center2, p5pt) : Infinity;

    const ap1 = midpoint(p0, p1pt);
    const ap2 = midpoint(p3pt, p4pt);
    const len = Math.hypot(ap2.x - ap1.x, ap2.y - ap1.y);
    const dpx = len > 1e-10 ? (ap2.y - ap1.y) / len : 0;
    const dpy = len > 1e-10 ? -(ap2.x - ap1.x) / len : 0;

    if (center1) {
      if (dpx * (center1.x - v2.x) + dpy * (center1.y - v2.y) < 0) {
        r2 = -r2;
      }
    }
    if (center2) {
      if (dpx * (center2.x - v5.x) + dpy * (center2.y - v5.y) < 0) {
        r1 = -r1;
      }
    }

    if (Number.isNaN(r1)) {
      r1 = Infinity;
    }
    if (Number.isNaN(r2)) {
      r2 = Infinity;
    }

    const d = distanceSquared(p2pt, p5pt) > 0 ? distance(p2pt, p5pt) : 0;

    return { d, r1, r2 };
  }

  /**
   * Compute d, FFD (front focal distance), and BFD (back focal distance).
   */
  public getDFfdBfd(): { d: number; ffd: number; bfd: number } {
    const { d, r1, r2 } = this.getDR1R2();
    const n = this.refIndex;

    const r1Inv = Number.isFinite(r1) ? 1 / r1 : 0;
    const r2Inv = Number.isFinite(r2) ? 1 / r2 : 0;
    const r1r2Inv = Number.isFinite(r1) && Number.isFinite(r2) ? 1 / (r1 * r2) : 0;

    const f = 1 / ((n - 1) * (r1Inv - r2Inv + ((n - 1) * d * r1r2Inv) / n));
    const ffd = f * (1 + ((n - 1) * d * r2Inv) / n);
    const bfd = f * (1 - ((n - 1) * d * r1Inv) / n);

    return { d, ffd, bfd };
  }

  /**
   * Rotate the lens aperture endpoints (p1, p2) by `deltaAngle` radians
   * around the geometric centre of the four corner vertices.
   *
   * Using the corner average (rather than midpoint(p1,p2)) ensures the
   * rotation pivot stays at the visual centre even when R1 ≠ R2 causes
   * asymmetric edge shifts.
   */
  public rotate(deltaAngle: number): void {
    if (this.path.length < 6) {
      return;
    }
    const v0 = this.path[0];
    const v1 = this.path[1];
    const v3 = this.path[3];
    const v4 = this.path[4];
    if (v0 === undefined || v1 === undefined || v3 === undefined || v4 === undefined) {
      return;
    }
    const cx = (v0.x + v1.x + v3.x + v4.x) / 4;
    const cy = (v0.y + v1.y + v3.y + v4.y) / 4;

    const cos = Math.cos(deltaAngle);
    const sin = Math.sin(deltaAngle);

    const rotatePoint = (p: Point): Point => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
    };

    this.p1 = rotatePoint(this.p1);
    this.p2 = rotatePoint(this.p2);
  }

  /**
   * Move one arc apex so the surface has the given radius of curvature,
   * while leaving all four corner points (path[0], path[1], path[3], path[4])
   * completely unchanged.  This is the same transform used by the curvature
   * drag handles (blue dots).
   *
   * Formula: apex = midpoint(corner_A, corner_B) − dp · curveShift(r, aperture)
   *   where dp is the optical-axis unit vector derived from the stable corners
   *   and aperture = |corner_A − corner_B| (same as |p1−p2|).
   *
   * Returns false if the radius is geometrically impossible (|r| < aperture/2).
   */
  public applyRadiusKeepingCorners(surface: "r1" | "r2", r: number): boolean {
    if (this.path.length < 6) {
      return false;
    }
    const v0 = this.path[0] as GlassPathPoint;
    const v1 = this.path[1] as GlassPathPoint;
    const v3 = this.path[3] as GlassPathPoint;
    const v4 = this.path[4] as GlassPathPoint;

    // Stable aperture direction from the left-corner pair (identical to p2−p1).
    const aax = v4.x - v0.x;
    const aay = v4.y - v0.y;
    const aperture = Math.hypot(aax, aay);
    if (aperture < 1e-10) {
      return false;
    }
    // Optical-axis unit vector: perp(da), same convention as createLensWithDR1R2.
    const dpx = aay / aperture;
    const dpy = -aax / aperture;

    const cs = computeCurveShift(r, aperture);
    if (!Number.isFinite(cs)) {
      return false; // |r| too small for this aperture
    }

    if (surface === "r2") {
      // Right arc apex (path[2]): midpoint of path[1] and path[3].
      const midX = (v1.x + v3.x) / 2;
      const midY = (v1.y + v3.y) / 2;
      const v2 = this.path[2] as GlassPathPoint;
      v2.x = midX - cs * dpx;
      v2.y = midY - cs * dpy;
    } else {
      // Left arc apex (path[5]): midpoint of path[0] and path[4].
      const midX = (v0.x + v4.x) / 2;
      const midY = (v0.y + v4.y) / 2;
      const v5 = this.path[5] as GlassPathPoint;
      v5.x = midX - cs * dpx;
      v5.y = midY - cs * dpy;
    }
    return true;
  }

  public override serialize(): Record<string, unknown> {
    const { d, r1, r2 } = this.getDR1R2();
    return { type: this.type, p1: this.p1, p2: this.p2, d, r1, r2, refIndex: this.refIndex };
  }
}

function computeCurveShift(r: number, aperture: number): number {
  if (!Number.isFinite(r) || Math.abs(r) > 1e15) {
    return 0;
  }
  const h2 = (aperture * aperture) / 4;
  const r2 = r * r;
  if (r2 < h2) {
    return Number.NaN;
  }
  return r - Math.sqrt(r2 - h2) * Math.sign(r);
}
