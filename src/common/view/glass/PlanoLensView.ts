/**
 * PlanoLensView.ts
 *
 * View for plano lenses (PlanoConvexLens, PlanoConcaveLens). Extends
 * SphericalLensView with the r1 curvature handle hidden and non-interactive,
 * since the left surface is always flat (r1 = Infinity) and cannot be
 * adjusted by the user.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import { SphericalLensView } from "./SphericalLensView.js";

export class PlanoLensView extends SphericalLensView {
  public constructor(lens: SphericalLens, modelViewTransform: ModelViewTransform2) {
    super(lens, modelViewTransform);

    // The left surface is always flat — hide its curvature handle (UX decision:
    // a non-interactive handle that snaps back would be confusing).
    this.curvatureHandleR1.visible = false;
    this.curvatureHandleR1.pickable = false;
  }

  /**
   * Safety net: if the flat surface apex is ever moved by a direct path
   * mutation (not via the hidden handle, but e.g. programmatic misuse),
   * restore r1 = Infinity so the flat constraint is never visually broken.
   */
  protected override onCurvatureDragged(surface: "r1" | "r2"): void {
    if (surface === "r1") {
      this.lens.applyRadiusKeepingCorners("r1", Infinity);
      this.rebuild();
    }
  }
}

opticsLab.register("PlanoLensView", PlanoLensView);
