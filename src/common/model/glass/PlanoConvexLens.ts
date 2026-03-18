/**
 * PlanoConvexLens.ts
 *
 * A plano-convex lens with a flat left surface and a convex right surface.
 * Enforces r1 = Infinity (flat) and r2 = -|r| (convex).
 */

import { type Point } from "../optics/Geometry.js";
import { SphericalLens } from "./SphericalLens.js";

export class PlanoConvexLens extends SphericalLens {
  public override readonly type = "PlanoConvexLens";

  /**
   * @param p1 - First endpoint of the lens aperture (rim).
   * @param p2 - Second endpoint of the lens aperture (rim).
   * @param r - Radius of curvature of the convex surface (positive).
   * @param refIndex - Refractive index of the lens material.
   */
  public constructor(p1: Point, p2: Point, r: number, refIndex = 1.5) {
    super(p1, p2, Infinity, -Math.abs(r), refIndex);
  }
}
