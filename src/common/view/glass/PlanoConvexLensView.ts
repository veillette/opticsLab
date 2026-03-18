/**
 * PlanoConvexLensView.ts
 *
 * View for a PlanoConvexLens. Extends SphericalLensView with the r1 curvature
 * handle hidden and non-interactive, since the left surface is always flat
 * (r1 = Infinity) and cannot be adjusted by the user.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PlanoConvexLens } from "../../model/glass/PlanoConvexLens.js";
import { SphericalLensView } from "./SphericalLensView.js";

export class PlanoConvexLensView extends SphericalLensView {
  public constructor(lens: PlanoConvexLens, modelViewTransform: ModelViewTransform2) {
    super(lens, modelViewTransform);

    // The left surface is always flat — hide its curvature handle.
    this.curvatureHandleR1.visible = false;
    this.curvatureHandleR1.pickable = false;
  }
}

opticsLab.register("PlanoConvexLensView", PlanoConvexLensView);
