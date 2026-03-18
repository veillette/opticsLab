/**
 * PlanoConcaveLensView.ts
 *
 * View for a PlanoConcaveLens. Extends SphericalLensView with the r1 curvature
 * handle hidden and non-interactive, since the left surface is always flat
 * (r1 = Infinity) and cannot be adjusted by the user.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PlanoConcaveLens } from "../../model/glass/PlanoConcaveLens.js";
import { SphericalLensView } from "./SphericalLensView.js";

export class PlanoConcaveLensView extends SphericalLensView {
  public constructor(lens: PlanoConcaveLens, modelViewTransform: ModelViewTransform2) {
    super(lens, modelViewTransform);

    // The left surface is always flat — hide its curvature handle.
    this.curvatureHandleR1.visible = false;
    this.curvatureHandleR1.pickable = false;
  }
}

opticsLab.register("PlanoConcaveLensView", PlanoConcaveLensView);
