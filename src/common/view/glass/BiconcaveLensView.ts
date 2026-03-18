/**
 * BiconcaveLensView.ts
 *
 * View for a BiconcaveLens. Extends SphericalLensView and enforces the symmetric
 * curvature constraint (r1 = -r2) after each curvature drag: when one surface is
 * adjusted, the other is mirrored to maintain equal-magnitude radii.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BiconcaveLens } from "../../model/glass/BiconcaveLens.js";
import { SphericalLensView } from "./SphericalLensView.js";

export class BiconcaveLensView extends SphericalLensView {
  public constructor(lens: BiconcaveLens, modelViewTransform: ModelViewTransform2) {
    super(lens, modelViewTransform);
  }

  /**
   * After either curvature handle is dragged, mirror the change to the other
   * surface so the lens stays symmetric (r1 = -r2).
   */
  protected override onCurvatureDragged(surface: "r1" | "r2"): void {
    const { r1, r2 } = this.lens.getDR1R2();
    if (surface === "r1") {
      this.lens.applyRadiusKeepingCorners("r2", -r1);
    } else {
      this.lens.applyRadiusKeepingCorners("r1", -r2);
    }
    this.rebuild();
  }
}

opticsLab.register("BiconcaveLensView", BiconcaveLensView);
