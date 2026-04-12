/**
 * PlanoConcaveLens.ts
 *
 * A plano-concave lens with a flat left surface and a concave right surface.
 * Enforces r1 = Infinity (flat) and r2 = +|r| (concave).
 */

import { DEFAULT_REFRACTIVE_INDEX } from "../../../OpticsLabConstants.js";
import { ELEMENT_TYPE_PLANO_CONCAVE_LENS } from "../../../OpticsLabStrings.js";
import type { Point } from "../optics/Geometry.js";
import { SphericalLens } from "./SphericalLens.js";

export class PlanoConcaveLens extends SphericalLens {
  public override readonly type = ELEMENT_TYPE_PLANO_CONCAVE_LENS;

  /**
   * @param p1 - First endpoint of the lens aperture (rim).
   * @param p2 - Second endpoint of the lens aperture (rim).
   * @param r - Radius of curvature of the concave surface (positive).
   * @param refIndex - Refractive index of the lens material.
   */
  public constructor(p1: Point, p2: Point, r: number, refIndex = DEFAULT_REFRACTIVE_INDEX) {
    super(p1, p2, Infinity, Math.abs(r), refIndex);
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
   * Only the right (concave) surface can be changed.
   */
  public override applyRadiusKeepingCorners(surface: "r1" | "r2", r: number): boolean {
    if (surface === "r1") {
      return false; // flat surface cannot be curved
    }
    return super.applyRadiusKeepingCorners("r2", r);
  }
}
