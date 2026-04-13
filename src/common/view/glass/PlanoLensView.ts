/**
 * PlanoLensView.ts
 *
 * View for plano lenses (PlanoConvexLens, PlanoConcaveLens). Extends
 * SphericalLensView with:
 *  - The r1 curvature handle hidden and non-interactive (flat surface is immutable).
 *  - The r2 apex position clamped on every drag so it never crosses to the wrong
 *    side of the corner midpoint (the geometric sign-flip boundary).
 *
 * See SymmetricLensView for an explanation of why position-based clamping is used
 * instead of reactive radius correction.
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

export class PlanoLensView extends SphericalLensView {
  /**
   * Required sign of the r2 apex's displacement from the corner midpoint
   * along the optical axis:
   *   −1 for PlanoConvexLens  (r2 < 0, apex on +dp side → relProj > 0, reqSign = −r2Sign = +1)
   *   +1 for PlanoConcaveLens (r2 > 0, apex on −dp side → relProj < 0, reqSign = −r2Sign = −1)
   * Stored as −r2Sign so the clamp condition is simply relProj * apexReqSign >= APEX_MIN_OFFSET.
   */
  private readonly apexReqSign: 1 | -1;

  public constructor(
    lens: SphericalLens,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem = Tandem.OPT_OUT,
    viewOptions?: ViewOptionsModel,
  ) {
    super(lens, modelViewTransform, tandem, viewOptions);

    // The left surface is always flat — hide its curvature handle.
    this.curvatureHandleR1.visible = false;
    this.curvatureHandleR1.pickable = false;

    // For PlanoConvex: r2 < 0 → apex on +dp side → required relProj sign = +1.
    // For PlanoConcave: r2 > 0 → apex on −dp side → required relProj sign = −1.
    // Both equal −r2Sign (negate r2's sign).
    const { r2 } = lens.getDR1R2();
    this.apexReqSign = r2 < 0 ? 1 : -1;
  }

  protected override onCurvatureDragged(surface: "r1" | "r2"): void {
    if (surface === "r1") {
      // Safety net: restore flat left surface if ever disturbed programmatically.
      this.lens.applyRadiusKeepingCorners("r1", Infinity);
      this.rebuild();
      return;
    }

    // r2 surface: clamp apex (path[2]) position so it stays on the correct side
    // of the corner midpoint (midpoint of path[1] and path[3]).

    // Stable optical-axis unit vector from the left corner pair (v0→v4).
    const v0 = this.lens.path[0] as GlassPathPoint | undefined;
    const v1 = this.lens.path[1] as GlassPathPoint | undefined;
    const v2 = this.lens.path[2] as GlassPathPoint | undefined;
    const v3 = this.lens.path[3] as GlassPathPoint | undefined;
    const v4 = this.lens.path[4] as GlassPathPoint | undefined;
    if (!(v0 && v1 && v2 && v3 && v4)) {
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

    // Projection of apex relative to the corner midpoint along the optical axis.
    const midX = (v1.x + v3.x) / 2;
    const midY = (v1.y + v3.y) / 2;
    const relProj = (v2.x - midX) * dpx + (v2.y - midY) * dpy;

    if (relProj * this.apexReqSign < APEX_MIN_OFFSET) {
      // Apex has crossed to the wrong side (or is too close to flat) — snap back.
      v2.x = midX + APEX_MIN_OFFSET * this.apexReqSign * dpx;
      v2.y = midY + APEX_MIN_OFFSET * this.apexReqSign * dpy;
    }

    this.rebuild();
  }
}

opticsLab.register("PlanoLensView", PlanoLensView);
