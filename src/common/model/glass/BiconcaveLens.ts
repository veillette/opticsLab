/**
 * BiconcaveLens.ts
 *
 * A symmetric biconcave lens where both surfaces share the same radius magnitude.
 * Enforces r1 = -|r| and r2 = +|r| (both surfaces curve inward).
 */

import { type Point } from "../optics/Geometry.js";
import { SphericalLens } from "./SphericalLens.js";

export class BiconcaveLens extends SphericalLens {
  public override readonly type = "BiconcaveLens";

  /**
   * @param p1 - First endpoint of the lens aperture (rim).
   * @param p2 - Second endpoint of the lens aperture (rim).
   * @param r - Radius of curvature (positive). Both surfaces use this magnitude.
   * @param refIndex - Refractive index of the lens material.
   */
  public constructor(p1: Point, p2: Point, r: number, refIndex = 1.5) {
    const rAbs = Math.abs(r);
    super(p1, p2, -rAbs, rAbs, refIndex);
  }
}
