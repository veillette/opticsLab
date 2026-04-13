/**
 * SymmetricLensView.ts
 *
 * View for symmetric double-surface lenses (BiconvexLens, BiconcaveLens).
 * Extends SphericalLensView and enforces two constraints after each curvature drag:
 *  1. Sign: the dragged apex is clamped so it never crosses to the wrong side of
 *     the corner midpoint (the geometric sign-flip boundary).  This is done via
 *     direct position clamping, which is robust against repeated drag events.
 *  2. Symmetry: after clamping, applyRadiusKeepingCorners is called on the dragged
 *     surface so the model re-derives the radius and mirrors it to the other surface.
 *
 * Why position clamping instead of radius clamping:
 *   onCurvatureDragged fires after every drag frame.  If we only correct the radius
 *   reactively, the next frame's mouse-delta pushes the apex past the boundary again.
 *   Clamping the apex position directly prevents any further motion in the forbidden
 *   direction and avoids the applyRadiusKeepingCorners failure mode that occurs when
 *   |r| < aperture/2.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Tandem } from "scenerystack/tandem";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { GlassPathPoint } from "../../model/glass/Glass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";
import { SphericalLensView } from "./SphericalLensView.js";

/** Minimum distance (model units) the apex must sit past the corner midpoint. */
const APEX_MIN_OFFSET = 0.02;

export class SymmetricLensView extends SphericalLensView {
  /** +1 for BiconvexLens (r1 > 0), −1 for BiconcaveLens (r1 < 0). */
  private readonly rSign: 1 | -1;

  public constructor(
    lens: SphericalLens,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem = Tandem.OPT_OUT,
    viewOptions?: ViewOptionsModel,
  ) {
    super(lens, modelViewTransform, tandem, viewOptions);
    const { r1 } = lens.getDR1R2();
    this.rSign = r1 >= 0 ? 1 : -1;
  }

  /**
   * After a curvature handle is dragged:
   *  - Clamp the apex so it stays on the correct side of its corner midpoint.
   *  - Call applyRadiusKeepingCorners on the dragged surface so the model
   *    re-derives r and mirrors it to the other surface (symmetry constraint).
   */
  protected override onCurvatureDragged(surface: "r1" | "r2"): void {
    // Stable optical-axis unit vector from the left corner pair (v0→v4).
    const v0 = this.lens.path[0] as GlassPathPoint | undefined;
    const v4 = this.lens.path[4] as GlassPathPoint | undefined;
    if (!(v0 && v4)) {
      return;
    }
    const aax = v4.x - v0.x;
    const aay = v4.y - v0.y;
    const aalen = Math.hypot(aax, aay);
    if (aalen < 1e-10) {
      return;
    }
    const dpx = aay / aalen;
    const dpy = -aax / aalen;

    if (surface === "r1") {
      // r1 surface: apex = path[5], corner midpoint = midpoint(path[0], path[4]).
      // For BiConvex (rSign=+1): r1 > 0 → apex must be on the −dp side (relProj < 0).
      // For BiConcave (rSign=−1): r1 < 0 → apex must be on the +dp side (relProj > 0).
      // Required relProj sign = −rSign.
      const v5 = this.lens.path[5] as GlassPathPoint | undefined;
      if (!v5) {
        return;
      }
      const midX = (v0.x + v4.x) / 2;
      const midY = (v0.y + v4.y) / 2;
      const relProj = (v5.x - midX) * dpx + (v5.y - midY) * dpy;
      const reqSign = (this.rSign === 1 ? -1 : 1) as 1 | -1; // −rSign
      if (relProj * reqSign < APEX_MIN_OFFSET) {
        v5.x = midX + APEX_MIN_OFFSET * reqSign * dpx;
        v5.y = midY + APEX_MIN_OFFSET * reqSign * dpy;
      }
      // Re-derive r1 from the (now-clamped) apex and mirror to r2.
      const { r1 } = this.lens.getDR1R2();
      this.lens.applyRadiusKeepingCorners("r1", r1);
    } else {
      // r2 surface: apex = path[2], corner midpoint = midpoint(path[1], path[3]).
      // For BiConvex (rSign=+1): r2 < 0 → apex must be on the +dp side (relProj > 0).
      // For BiConcave (rSign=−1): r2 > 0 → apex must be on the −dp side (relProj < 0).
      // Required relProj sign = +rSign.
      const v1 = this.lens.path[1] as GlassPathPoint | undefined;
      const v2 = this.lens.path[2] as GlassPathPoint | undefined;
      const v3 = this.lens.path[3] as GlassPathPoint | undefined;
      if (!(v1 && v2 && v3)) {
        return;
      }
      const midX = (v1.x + v3.x) / 2;
      const midY = (v1.y + v3.y) / 2;
      const relProj = (v2.x - midX) * dpx + (v2.y - midY) * dpy;
      const reqSign = this.rSign; // +rSign
      if (relProj * reqSign < APEX_MIN_OFFSET) {
        v2.x = midX + APEX_MIN_OFFSET * reqSign * dpx;
        v2.y = midY + APEX_MIN_OFFSET * reqSign * dpy;
      }
      // Re-derive r2 from the (now-clamped) apex and mirror to r1.
      const { r2 } = this.lens.getDR1R2();
      this.lens.applyRadiusKeepingCorners("r2", r2);
    }
    this.rebuild();
  }
}

opticsLab.register("SymmetricLensView", SymmetricLensView);
