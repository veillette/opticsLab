/**
 * BiconvexLens.ts
 *
 * A symmetric biconvex lens where both surfaces share the same radius magnitude.
 * Enforces r1 = +|r| and r2 = -|r| (both surfaces curve outward).
 */

import type { Point } from "../optics/Geometry.js";
import { SphericalLens } from "./SphericalLens.js";

export class BiconvexLens extends SphericalLens {
  public override readonly type = "BiconvexLens";

  /**
   * @param p1 - First endpoint of the lens aperture (rim).
   * @param p2 - Second endpoint of the lens aperture (rim).
   * @param r - Radius of curvature (positive). Both surfaces use this magnitude.
   * @param refIndex - Refractive index of the lens material.
   */
  public constructor(p1: Point, p2: Point, r: number, refIndex = 1.5) {
    const rAbs = Math.abs(r);
    super(p1, p2, rAbs, -rAbs, refIndex);
  }

  /**
   * Enforces the symmetric constraint: r2 is always derived as -r1,
   * so the r2 argument is ignored.
   */
  public override createLensWithDR1R2(d: number, r1: number, _r2: number): boolean {
    return super.createLensWithDR1R2(d, r1, -r1);
  }

  /**
   * Applies the curvature change to the requested surface and mirrors it
   * to the other surface (r_other = -r) to maintain symmetry.
   */
  public override applyRadiusKeepingCorners(surface: "r1" | "r2", r: number): boolean {
    const okDragged = super.applyRadiusKeepingCorners(surface, r);
    const other = surface === "r1" ? "r2" : "r1";
    const okOther = super.applyRadiusKeepingCorners(other, -r);
    return okDragged && okOther;
  }
}
