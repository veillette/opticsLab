/**
 * PlanoConvexLens.ts
 *
 * A plano-convex lens with a flat left surface and a convex right surface.
 * Enforces r1 = Infinity (flat) and r2 = -|r| (convex).
 */

import { DEFAULT_REFRACTIVE_INDEX } from "../../../OpticsLabConstants.js";
import { ELEMENT_TYPE_PLANO_CONVEX_LENS } from "../../../OpticsLabStrings.js";
import type { Point } from "../optics/Geometry.js";
import { SphericalLens } from "./SphericalLens.js";

export class PlanoConvexLens extends SphericalLens {
  public override readonly type = ELEMENT_TYPE_PLANO_CONVEX_LENS;

  /**
   * @param p1 - First endpoint of the lens aperture (rim).
   * @param p2 - Second endpoint of the lens aperture (rim).
   * @param r - Radius of curvature of the convex surface (positive).
   * @param refIndex - Refractive index of the lens material.
   */
  public constructor(p1: Point, p2: Point, r: number, refIndex = DEFAULT_REFRACTIVE_INDEX) {
    super(p1, p2, Infinity, -Math.abs(r), refIndex);
  }

  /**
   * Enforces the flat-left constraint: r1 is always Infinity regardless
   * of what is passed, so the r1 argument is ignored.
   */
  public override createLensWithDR1R2(d: number, _r1: number, r2: number): boolean {
    return super.createLensWithDR1R2(d, Infinity, r2);
  }

  /**
   * The left (flat) surface is immutable — returns false if r1 is requested.
   * Only the right (convex) surface can be changed.
   */
  public override applyRadiusKeepingCorners(surface: "r1" | "r2", r: number): boolean {
    if (surface === "r1") {
      return false; // flat surface cannot be curved
    }
    return super.applyRadiusKeepingCorners("r2", r);
  }
}
