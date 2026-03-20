/**
 * GlassEditControls.ts
 *
 * Edit-panel control builders for glass and lens element types:
 * SphericalLens, IdealLens, BaseGlass (generic refractive-index control),
 * and the typed fixed-shape prisms (EquilateralPrism, RightAnglePrism,
 * PorroPrism, SlabGlass, ParallelogramPrism, DovePrism).
 */

import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { NumberControl } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../../i18n/StringManager.js";
import {
  FOCAL_LENGTH_MAX_M,
  FOCAL_LENGTH_MIN_M,
  REFRACTIVE_INDEX_MAX,
  REFRACTIVE_INDEX_MIN,
  SEGMENT_LENGTH_MAX,
  SEGMENT_LENGTH_MIN,
  SPHERICAL_R1_FALLBACK,
  SPHERICAL_R2_FALLBACK,
  SPHERICAL_RADIUS_MAX,
  SPHERICAL_RADIUS_MIN,
} from "../../../OpticsLabConstants.js";
import type { SignConvention } from "../../../preferences/OpticsLabPreferencesModel.js";
import type { BaseGlass } from "../../model/glass/BaseGlass.js";
import type { DovePrism } from "../../model/glass/DovePrism.js";
import type { EquilateralPrism } from "../../model/glass/EquilateralPrism.js";
import type { IdealLens } from "../../model/glass/IdealLens.js";
import type { ParallelogramPrism } from "../../model/glass/ParallelogramPrism.js";
import type { PorroPrism } from "../../model/glass/PorroPrism.js";
import type { RightAnglePrism } from "../../model/glass/RightAnglePrism.js";
import type { SlabGlass } from "../../model/glass/SlabGlass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import {
  buildSegmentLengthControl,
  makeControl,
  numberControlOptions,
  resizeSegment,
  safeClamp,
  segmentLength,
} from "./EditControlHelpers.js";
import type { EditControlsResult } from "./EditControlsResult.js";

export function buildSphericalLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  signConvention: SignConvention,
): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  const { r1, r2 } = element.getDR1R2();
  const R_RANGE = new Range(SPHERICAL_RADIUS_MIN, SPHERICAL_RADIUS_MAX);
  const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);

  // In Real-is-Positive mode, R₂ is negated for display: a biconvex lens
  // has R₁ > 0, R₂ > 0 (instead of R₁ > 0, R₂ < 0 in New Cartesian).
  const isRIP = signConvention === "realIsPositive";
  const r2Display = isRIP ? -r2 : r2;

  const r1Prop = new NumberProperty(safeClamp(r1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK), {
    range: R_RANGE,
    tandem: Tandem.OPT_OUT,
  });
  const r2Prop = new NumberProperty(safeClamp(r2Display, R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK), {
    range: R_RANGE,
    tandem: Tandem.OPT_OUT,
  });
  const lenProp = new NumberProperty(safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0), {
    range: L_RANGE,
    tandem: Tandem.OPT_OUT,
  });

  // sliderDriving: slider is changing the model → suppress refreshCallback.
  // viewDriving:   view is updating the slider display → suppress lazyLinks.
  let sliderDriving = false;
  let viewDriving = false;
  r1Prop.lazyLink((v) => {
    if (viewDriving) {
      return;
    }
    sliderDriving = true;
    // Move only the left arc apex — same as the blue curvature drag handle.
    element.applyRadiusKeepingCorners("r1", v);
    triggerRebuild();
    sliderDriving = false;
  });
  r2Prop.lazyLink((v) => {
    if (viewDriving) {
      return;
    }
    sliderDriving = true;
    // In RIP mode the slider holds −R₂_model; invert before storing.
    const modelR2 = isRIP ? -v : v;
    // Move only the right arc apex — same as the blue curvature drag handle.
    element.applyRadiusKeepingCorners("r2", modelR2);
    triggerRebuild();
    sliderDriving = false;
  });
  lenProp.lazyLink((v) => {
    if (viewDriving) {
      return;
    }
    sliderDriving = true;
    const resized = resizeSegment(element.p1, element.p2, v);
    element.p1 = resized.p1;
    element.p2 = resized.p2;
    const { d, r1: cr1, r2: cr2 } = element.getDR1R2();
    element.createLensWithDR1R2(d, cr1, cr2);
    triggerRebuild();
    sliderDriving = false;
  });

  const refreshCallback = (): void => {
    if (sliderDriving) {
      return;
    }
    viewDriving = true;
    const { r1: newR1, r2: newR2 } = element.getDR1R2();
    r1Prop.value = safeClamp(newR1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK);
    r2Prop.value = safeClamp(isRIP ? -newR2 : newR2, R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK);
    lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
    viewDriving = false;
  };

  const r2Label = isRIP ? ctrl.r2RightRIPStringProperty : ctrl.r2RightSurfaceStringProperty;

  return {
    controls: [
      new NumberControl(ctrl.r1LeftSurfaceStringProperty, r1Prop, R_RANGE, numberControlOptions(0.1, 1)),
      new NumberControl(r2Label, r2Prop, R_RANGE, numberControlOptions(0.1, 1)),
      new NumberControl(ctrl.lengthStringProperty, lenProp, L_RANGE, numberControlOptions(0.05, 2)),
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback,
  };
}

export function buildIdealLensControls(element: IdealLens, triggerRebuild: () => void): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  const { control: lenControl, refresh } = buildSegmentLengthControl(
    element,
    ctrl.lengthStringProperty,
    triggerRebuild,
  );
  return {
    controls: [
      makeControl(
        ctrl.focalLengthStringProperty,
        element.focalLength,
        new Range(FOCAL_LENGTH_MIN_M, FOCAL_LENGTH_MAX_M),
        0.1,
        (v) => {
          element.focalLength = v;
        },
        triggerRebuild,
      ),
      lenControl,
    ],
    refreshCallback: refresh,
  };
}

/** Generic refractive-index-only control for plain Glass / CircleGlass / HalfPlaneGlass. */
export function buildRefractiveIndexControls(element: BaseGlass, triggerRebuild: () => void): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildEquilateralPrismControls(
  element: EquilateralPrism,
  triggerRebuild: () => void,
): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        ctrl.sizeStringProperty,
        element.size,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setSize(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildRightAnglePrismControls(element: RightAnglePrism, triggerRebuild: () => void): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        ctrl.legLengthStringProperty,
        element.legLength,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setLegLength(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildPorroPrismControls(element: PorroPrism, triggerRebuild: () => void): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        ctrl.legLengthStringProperty,
        element.legLength,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setLegLength(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildSlabGlassControls(element: SlabGlass, triggerRebuild: () => void): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        ctrl.widthStringProperty,
        element.width,
        new Range(0.1, 3.0),
        0.05,
        (v) => {
          element.setWidth(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.heightStringProperty,
        element.height,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setHeight(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildParallelogramPrismControls(
  element: ParallelogramPrism,
  triggerRebuild: () => void,
): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        ctrl.widthStringProperty,
        element.width,
        new Range(0.1, 3.0),
        0.05,
        (v) => {
          element.setWidth(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.heightStringProperty,
        element.height,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setHeight(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildDovePrismControls(element: DovePrism, triggerRebuild: () => void): EditControlsResult {
  const ctrl = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        ctrl.widthStringProperty,
        element.width,
        new Range(0.1, 3.0),
        0.05,
        (v) => {
          element.setWidth(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.heightStringProperty,
        element.height,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setHeight(v);
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
      ),
    ],
    refreshCallback: null,
  };
}
