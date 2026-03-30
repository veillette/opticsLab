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
  CONSTRAINED_CURVATURE_MAX,
  CONSTRAINED_CURVATURE_MIN,
  CONSTRAINED_LENS_RADIUS_MIN,
  FOCAL_LENGTH_MAX_M,
  FOCAL_LENGTH_MIN_M,
  REFRACTIVE_INDEX_MAX,
  REFRACTIVE_INDEX_MIN,
  SEGMENT_LENGTH_MAX,
  SEGMENT_LENGTH_MIN,
  SPHERICAL_CURVATURE_MAX,
  SPHERICAL_CURVATURE_MIN,
  SPHERICAL_R1_FALLBACK,
  SPHERICAL_R2_FALLBACK,
  SPHERICAL_RADIUS_MAX,
  SPHERICAL_RADIUS_MIN,
} from "../../../OpticsLabConstants.js";
import type { SignConvention } from "../../../preferences/OpticsLabPreferencesModel.js";
import type { BaseGlass } from "../../model/glass/BaseGlass.js";
import type { DovePrism } from "../../model/glass/DovePrism.js";
import type { EquilateralPrism } from "../../model/glass/EquilateralPrism.js";
import type { GlassPathPoint } from "../../model/glass/Glass.js";
import type { HalfPlaneGlass } from "../../model/glass/HalfPlaneGlass.js";
import type { IdealLens } from "../../model/glass/IdealLens.js";
import type { ParallelogramPrism } from "../../model/glass/ParallelogramPrism.js";
import type { PorroPrism } from "../../model/glass/PorroPrism.js";
import type { RightAnglePrism } from "../../model/glass/RightAnglePrism.js";
import type { SlabGlass } from "../../model/glass/SlabGlass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import {
  buildSegmentAngleControl,
  buildSegmentLengthControl,
  makeControl,
  numberControlOptions,
  resizeSegment,
  safeClamp,
  segmentAngleDeg,
  segmentLength,
} from "./EditControlHelpers.js";
import type { EditControlsResult } from "./EditControlsResult.js";

// ── Private helpers ───────────────────────────────────────────────────────────

/** Angle in degrees [0,360) of path[0] relative to the path centroid. */
function prismPathAngleDeg(path: GlassPathPoint[]): number {
  const n = path.length;
  if (n < 1) {
    return 0;
  }
  let cx = 0;
  let cy = 0;
  for (const p of path) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;
  const p0 = path[0] as GlassPathPoint;
  const deg = Math.atan2(p0.y - cy, p0.x - cx) * (180 / Math.PI);
  return ((deg % 360) + 360) % 360;
}

/** Rotate all path vertices about their centroid by deltaRad radians. */
function rotatePrismPath(path: GlassPathPoint[], deltaRad: number): void {
  const n = path.length;
  if (n < 3) {
    return;
  }
  let cx = 0;
  let cy = 0;
  for (const p of path) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;
  const cos = Math.cos(deltaRad);
  const sin = Math.sin(deltaRad);
  for (const p of path) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    p.x = cx + dx * cos - dy * sin;
    p.y = cy + dx * sin + dy * cos;
  }
}

/**
 * Build a 0–360° angle slider for a SphericalLens.
 * Uses a delta-based approach so it stays in sync with the rotation drag handle.
 * Calls createLensWithDR1R2 after rotate() to rebuild the arc path.
 */
function buildSphericalLensAngleControl(
  element: SphericalLens,
  triggerRebuild: () => void,
): { control: NumberControl; refresh: () => void } {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const A_RANGE = new Range(0, 360);
  let prevAngleDeg = segmentAngleDeg(element.p1, element.p2);
  const angleProp = new NumberProperty(prevAngleDeg, { range: A_RANGE, tandem: Tandem.OPTIONAL });
  let angleDriving = false;
  angleProp.lazyLink((deg) => {
    angleDriving = true;
    const deltaRad = (deg - prevAngleDeg) * (Math.PI / 180);
    prevAngleDeg = deg;
    element.rotate(deltaRad);
    const { d, r1, r2 } = element.getDR1R2();
    element.createLensWithDR1R2(d, r1, r2);
    triggerRebuild();
    angleDriving = false;
  });
  const control = new NumberControl(
    controlStrings.angleStringProperty,
    angleProp,
    A_RANGE,
    numberControlOptions(1, 0, Tandem.OPTIONAL),
  );
  const refresh = (): void => {
    if (angleDriving) {
      return;
    }
    const newAngle = segmentAngleDeg(element.p1, element.p2);
    prevAngleDeg = newAngle;
    angleProp.value = newAngle;
  };
  return { control, refresh };
}

/**
 * Build a 0–360° angle slider for a plain Glass prism.
 * Rotates all path vertices about the centroid.
 * Uses a delta-based approach so the slider stays consistent with vertex drags.
 */
function buildGlassPrismAngleControl(
  path: GlassPathPoint[],
  triggerRebuild: () => void,
): { control: NumberControl; refresh: () => void } {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const A_RANGE = new Range(0, 360);
  let prevAngleDeg = prismPathAngleDeg(path);
  const angleProp = new NumberProperty(prevAngleDeg, { range: A_RANGE, tandem: Tandem.OPTIONAL });
  let angleDriving = false;
  angleProp.lazyLink((deg) => {
    angleDriving = true;
    const deltaRad = (deg - prevAngleDeg) * (Math.PI / 180);
    prevAngleDeg = deg;
    rotatePrismPath(path, deltaRad);
    triggerRebuild();
    angleDriving = false;
  });
  const control = new NumberControl(
    controlStrings.angleStringProperty,
    angleProp,
    A_RANGE,
    numberControlOptions(1, 0, Tandem.OPTIONAL),
  );
  const refresh = (): void => {
    if (angleDriving) {
      return;
    }
    const newAngle = prismPathAngleDeg(path);
    prevAngleDeg = newAngle;
    angleProp.value = newAngle;
  };
  return { control, refresh };
}

/**
 * Build a 0–360° angle slider for a DimensionalGlass element.
 * Reads/writes element.rotation (radians) via setRotation().
 */
function buildDimensionalGlassAngleControl(
  element: { rotation: number; setRotation: (angle: number) => void },
  triggerRebuild: () => void,
): { control: NumberControl; refresh: () => void } {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const A_RANGE = new Range(0, 360);
  const initDeg = (((element.rotation * (180 / Math.PI)) % 360) + 360) % 360;
  const angleProp = new NumberProperty(initDeg, { range: A_RANGE, tandem: Tandem.OPTIONAL });
  let angleDriving = false;
  angleProp.lazyLink((deg) => {
    angleDriving = true;
    element.setRotation(deg * (Math.PI / 180));
    triggerRebuild();
    angleDriving = false;
  });
  const control = new NumberControl(
    controlStrings.angleStringProperty,
    angleProp,
    A_RANGE,
    numberControlOptions(1, 0, Tandem.OPTIONAL),
  );
  const refresh = (): void => {
    if (angleDriving) {
      return;
    }
    angleProp.value = (((element.rotation * (180 / Math.PI)) % 360) + 360) % 360;
  };
  return { control, refresh };
}

// ── Exported builders ─────────────────────────────────────────────────────────

export function buildSphericalLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  signConvention: SignConvention,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { r1, r2 } = element.getDR1R2();
  const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);

  // In Real-is-Positive mode, R₂ is negated for display.
  const isRIP = signConvention === "realIsPositive";

  const lenProp = new NumberProperty(safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0), {
    range: L_RANGE,
    tandem: Tandem.OPTIONAL,
  });

  let sliderDriving = false;
  let viewDriving = false;

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

  const { control: angleControl, refresh: refreshAngle } = buildSphericalLensAngleControl(element, triggerRebuild);

  if (useCurvatureDisplay) {
    // Curvature mode: κ = 1/R (m⁻¹). κ = 0 represents a flat surface (R = ∞).
    const K_RANGE = new Range(SPHERICAL_CURVATURE_MIN, SPHERICAL_CURVATURE_MAX);
    const r2Display = isRIP ? -r2 : r2;
    const toKappa = (r: number): number => (Number.isFinite(r) && r !== 0 ? 1 / r : 0);
    const toRadius = (k: number): number => (k === 0 ? Infinity : 1 / k);

    const k1Init = safeClamp(toKappa(r1), K_RANGE.min, K_RANGE.max, toKappa(SPHERICAL_R1_FALLBACK));
    const k2Init = safeClamp(toKappa(r2Display), K_RANGE.min, K_RANGE.max, toKappa(SPHERICAL_R2_FALLBACK));

    const k1Prop = new NumberProperty(k1Init, { range: K_RANGE, tandem: Tandem.OPTIONAL });
    const k2Prop = new NumberProperty(k2Init, { range: K_RANGE, tandem: Tandem.OPTIONAL });

    k1Prop.lazyLink((kappa) => {
      if (viewDriving) {
        return;
      }
      sliderDriving = true;
      element.applyRadiusKeepingCorners("r1", toRadius(kappa));
      triggerRebuild();
      sliderDriving = false;
    });
    k2Prop.lazyLink((kappa) => {
      if (viewDriving) {
        return;
      }
      sliderDriving = true;
      // In RIP mode the slider holds κ(-R₂_model); apply sign inversion.
      const modelR2 = toRadius(isRIP ? -kappa : kappa);
      element.applyRadiusKeepingCorners("r2", modelR2);
      triggerRebuild();
      sliderDriving = false;
    });

    const refreshCallback = (): void => {
      if (sliderDriving) {
        return;
      }
      viewDriving = true;
      const { r1: newR1, r2: newR2 } = element.getDR1R2();
      k1Prop.value = safeClamp(toKappa(newR1), K_RANGE.min, K_RANGE.max, toKappa(SPHERICAL_R1_FALLBACK));
      k2Prop.value = safeClamp(
        toKappa(isRIP ? -newR2 : newR2),
        K_RANGE.min,
        K_RANGE.max,
        toKappa(SPHERICAL_R2_FALLBACK),
      );
      lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      viewDriving = false;
      refreshAngle();
    };

    const k2Label = isRIP
      ? controlStrings.kappa2RightRIPStringProperty
      : controlStrings.kappa2RightSurfaceStringProperty;

    return {
      controls: [
        new NumberControl(
          controlStrings.kappa1LeftSurfaceStringProperty,
          k1Prop,
          K_RANGE,
          numberControlOptions(0.05, 2, Tandem.OPTIONAL),
        ),
        new NumberControl(k2Label, k2Prop, K_RANGE, numberControlOptions(0.05, 2, Tandem.OPTIONAL)),
        new NumberControl(
          controlStrings.lengthStringProperty,
          lenProp,
          L_RANGE,
          numberControlOptions(0.05, 2, Tandem.OPTIONAL),
        ),
        angleControl,
        makeControl(
          controlStrings.refractiveIndexStringProperty,
          element.refIndex,
          new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
          0.05,
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
          Tandem.OPTIONAL,
        ),
      ],
      refreshCallback,
    };
  }

  // Radius mode (default)
  const R_RANGE = new Range(SPHERICAL_RADIUS_MIN, SPHERICAL_RADIUS_MAX);
  const r2Display = isRIP ? -r2 : r2;

  const r1Prop = new NumberProperty(safeClamp(r1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK), {
    range: R_RANGE,
    tandem: Tandem.OPTIONAL,
  });
  const r2Prop = new NumberProperty(safeClamp(r2Display, R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK), {
    range: R_RANGE,
    tandem: Tandem.OPTIONAL,
  });

  // sliderDriving: slider is changing the model → suppress refreshCallback.
  // viewDriving:   view is updating the slider display → suppress lazyLinks.
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
    refreshAngle();
  };

  const r2Label = isRIP ? controlStrings.r2RightRIPStringProperty : controlStrings.r2RightSurfaceStringProperty;

  return {
    controls: [
      new NumberControl(
        controlStrings.r1LeftSurfaceStringProperty,
        r1Prop,
        R_RANGE,
        numberControlOptions(0.1, 1, Tandem.OPTIONAL),
      ),
      new NumberControl(r2Label, r2Prop, R_RANGE, numberControlOptions(0.1, 1, Tandem.OPTIONAL)),
      new NumberControl(
        controlStrings.lengthStringProperty,
        lenProp,
        L_RANGE,
        numberControlOptions(0.05, 2, Tandem.OPTIONAL),
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback,
  };
}

/**
 * Controls for symmetric lenses (BiconvexLens, BiconcaveLens).
 * Shows a single "Radius of Curvature" slider (positive magnitude) instead of
 * separate R₁ / R₂ sliders, since both surfaces are always equal-magnitude.
 * The sign is fixed by lens type and cannot be changed through the UI.
 */
export function buildSymmetricLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  _signConvention: SignConvention,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { r1 } = element.getDR1R2();
  // BiconvexLens has r1 > 0; BiconcaveLens has r1 < 0. Sign is fixed.
  const rSign: 1 | -1 = r1 >= 0 ? 1 : -1;

  const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
  const lenProp = new NumberProperty(safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0), {
    range: L_RANGE,
    tandem: Tandem.OPTIONAL,
  });

  let sliderDriving = false;
  let viewDriving = false;

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

  const { control: angleControl, refresh: refreshAngle } = buildSphericalLensAngleControl(element, triggerRebuild);

  if (useCurvatureDisplay) {
    // Curvature mode: κ = 1/|R| (always positive for symmetric lenses).
    const K_RANGE = new Range(CONSTRAINED_CURVATURE_MIN, CONSTRAINED_CURVATURE_MAX);
    const kappaProp = new NumberProperty(
      safeClamp(1 / (rSign * r1), K_RANGE.min, K_RANGE.max, 1 / Math.abs(SPHERICAL_R1_FALLBACK)),
      { range: K_RANGE, tandem: Tandem.OPTIONAL },
    );

    kappaProp.lazyLink((kappa) => {
      if (viewDriving) {
        return;
      }
      sliderDriving = true;
      element.applyRadiusKeepingCorners("r1", rSign / kappa);
      triggerRebuild();
      sliderDriving = false;
    });

    const refreshCallback = (): void => {
      if (sliderDriving) {
        return;
      }
      viewDriving = true;
      const { r1: newR1 } = element.getDR1R2();
      kappaProp.value = safeClamp(1 / (rSign * newR1), K_RANGE.min, K_RANGE.max, 1 / Math.abs(SPHERICAL_R1_FALLBACK));
      lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      viewDriving = false;
      refreshAngle();
    };

    return {
      controls: [
        new NumberControl(
          controlStrings.curvatureStringProperty,
          kappaProp,
          K_RANGE,
          numberControlOptions(0.01, 2, Tandem.OPTIONAL),
        ),
        new NumberControl(
          controlStrings.lengthStringProperty,
          lenProp,
          L_RANGE,
          numberControlOptions(0.05, 2, Tandem.OPTIONAL),
        ),
        angleControl,
        makeControl(
          controlStrings.refractiveIndexStringProperty,
          element.refIndex,
          new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
          0.05,
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
          Tandem.OPTIONAL,
        ),
      ],
      refreshCallback,
    };
  }

  // Radius mode (default)
  const R_RANGE = new Range(CONSTRAINED_LENS_RADIUS_MIN, SPHERICAL_RADIUS_MAX);

  // Slider always displays the positive magnitude of r1.
  const rProp = new NumberProperty(safeClamp(rSign * r1, R_RANGE.min, R_RANGE.max, Math.abs(SPHERICAL_R1_FALLBACK)), {
    range: R_RANGE,
    tandem: Tandem.OPTIONAL,
  });

  rProp.lazyLink((v) => {
    if (viewDriving) {
      return;
    }
    sliderDriving = true;
    // Apply with the fixed sign: positive for BiconvexLens, negative for BiconcaveLens.
    element.applyRadiusKeepingCorners("r1", rSign * v);
    triggerRebuild();
    sliderDriving = false;
  });

  const refreshCallback = (): void => {
    if (sliderDriving) {
      return;
    }
    viewDriving = true;
    const { r1: newR1 } = element.getDR1R2();
    rProp.value = safeClamp(rSign * newR1, R_RANGE.min, R_RANGE.max, Math.abs(SPHERICAL_R1_FALLBACK));
    lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
    viewDriving = false;
    refreshAngle();
  };

  return {
    controls: [
      new NumberControl(
        controlStrings.radiusOfCurvatureStringProperty,
        rProp,
        R_RANGE,
        numberControlOptions(0.1, 1, Tandem.OPTIONAL),
      ),
      new NumberControl(
        controlStrings.lengthStringProperty,
        lenProp,
        L_RANGE,
        numberControlOptions(0.05, 2, Tandem.OPTIONAL),
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback,
  };
}

/**
 * Controls for plano lenses (PlanoConvexLens, PlanoConcaveLens).
 * Shows only the R₂ (curved surface) slider — the R₁ surface is always flat
 * (Infinity) and is not user-adjustable. The curved-surface slider shows the
 * positive radius magnitude; the sign is fixed by the lens type.
 */
export function buildPlanoLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  _signConvention: SignConvention,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { r2 } = element.getDR1R2();
  // PlanoConvexLens has r2 < 0; PlanoConcaveLens has r2 > 0. Sign is fixed.
  const r2Sign: 1 | -1 = r2 >= 0 ? 1 : -1;

  const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
  const lenProp = new NumberProperty(safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0), {
    range: L_RANGE,
    tandem: Tandem.OPTIONAL,
  });

  let sliderDriving = false;
  let viewDriving = false;

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

  const { control: angleControl, refresh: refreshAngle } = buildSphericalLensAngleControl(element, triggerRebuild);

  if (useCurvatureDisplay) {
    // Curvature mode: κ = 1/|R₂| (always positive for plano lenses).
    const K_RANGE = new Range(CONSTRAINED_CURVATURE_MIN, CONSTRAINED_CURVATURE_MAX);
    const kappaProp = new NumberProperty(
      safeClamp(1 / (r2Sign * r2), K_RANGE.min, K_RANGE.max, 1 / Math.abs(SPHERICAL_R2_FALLBACK)),
      { range: K_RANGE, tandem: Tandem.OPTIONAL },
    );

    kappaProp.lazyLink((kappa) => {
      if (viewDriving) {
        return;
      }
      sliderDriving = true;
      element.applyRadiusKeepingCorners("r2", r2Sign / kappa);
      triggerRebuild();
      sliderDriving = false;
    });

    const refreshCallback = (): void => {
      if (sliderDriving) {
        return;
      }
      viewDriving = true;
      const { r2: newR2 } = element.getDR1R2();
      kappaProp.value = safeClamp(1 / (r2Sign * newR2), K_RANGE.min, K_RANGE.max, 1 / Math.abs(SPHERICAL_R2_FALLBACK));
      lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      viewDriving = false;
      refreshAngle();
    };

    return {
      controls: [
        new NumberControl(
          controlStrings.curvatureStringProperty,
          kappaProp,
          K_RANGE,
          numberControlOptions(0.01, 2, Tandem.OPTIONAL),
        ),
        new NumberControl(
          controlStrings.lengthStringProperty,
          lenProp,
          L_RANGE,
          numberControlOptions(0.05, 2, Tandem.OPTIONAL),
        ),
        angleControl,
        makeControl(
          controlStrings.refractiveIndexStringProperty,
          element.refIndex,
          new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
          0.05,
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
          Tandem.OPTIONAL,
        ),
      ],
      refreshCallback,
    };
  }

  // Radius mode (default)
  const R_RANGE = new Range(CONSTRAINED_LENS_RADIUS_MIN, SPHERICAL_RADIUS_MAX);

  // Slider always displays the positive magnitude of r2.
  const r2Prop = new NumberProperty(safeClamp(r2Sign * r2, R_RANGE.min, R_RANGE.max, Math.abs(SPHERICAL_R2_FALLBACK)), {
    range: R_RANGE,
    tandem: Tandem.OPTIONAL,
  });

  r2Prop.lazyLink((v) => {
    if (viewDriving) {
      return;
    }
    sliderDriving = true;
    // Apply with the fixed sign (negative for PlanoConvex, positive for PlanoConcave).
    element.applyRadiusKeepingCorners("r2", r2Sign * v);
    triggerRebuild();
    sliderDriving = false;
  });

  const refreshCallback = (): void => {
    if (sliderDriving) {
      return;
    }
    viewDriving = true;
    const { r2: newR2 } = element.getDR1R2();
    r2Prop.value = safeClamp(r2Sign * newR2, R_RANGE.min, R_RANGE.max, Math.abs(SPHERICAL_R2_FALLBACK));
    lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
    viewDriving = false;
    refreshAngle();
  };

  return {
    controls: [
      new NumberControl(
        controlStrings.radiusOfCurvatureStringProperty,
        r2Prop,
        R_RANGE,
        numberControlOptions(0.1, 1, Tandem.OPTIONAL),
      ),
      new NumberControl(
        controlStrings.lengthStringProperty,
        lenProp,
        L_RANGE,
        numberControlOptions(0.05, 2, Tandem.OPTIONAL),
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback,
  };
}

export function buildIdealLensControls(element: IdealLens, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: lenControl, refresh: refreshLen } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  const { control: angleControl, refresh: refreshAngle } = buildSegmentAngleControl(
    element,
    controlStrings.angleStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.focalLengthStringProperty,
        element.focalLength,
        new Range(FOCAL_LENGTH_MIN_M, FOCAL_LENGTH_MAX_M),
        0.1,
        (v) => {
          element.focalLength = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      lenControl,
      angleControl,
    ],
    refreshCallback: () => {
      refreshLen?.();
      refreshAngle();
    },
  };
}

/** Refractive index + angle + length for HalfPlaneGlass (boundary segment p1–p2). */
export function buildHalfPlaneGlassControls(element: HalfPlaneGlass, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildSegmentAngleControl(
    element,
    controlStrings.angleStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  const { control: lenControl, refresh: refreshLength } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      lenControl,
    ],
    refreshCallback: () => {
      refreshAngle();
      refreshLength();
    },
  };
}

/** Generic refractive-index-only control for plain Glass / CircleGlass / HalfPlaneGlass. */
export function buildRefractiveIndexControls(element: BaseGlass, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildEquilateralPrismControls(
  element: EquilateralPrism,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildGlassPrismAngleControl(element.path, triggerRebuild);
  return {
    controls: [
      makeControl(
        controlStrings.sizeStringProperty,
        element.size,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setSize(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildRightAnglePrismControls(element: RightAnglePrism, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildGlassPrismAngleControl(element.path, triggerRebuild);
  return {
    controls: [
      makeControl(
        controlStrings.legLengthStringProperty,
        element.legLength,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setLegLength(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildPorroPrismControls(element: PorroPrism, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildGlassPrismAngleControl(element.path, triggerRebuild);
  return {
    controls: [
      makeControl(
        controlStrings.legLengthStringProperty,
        element.legLength,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setLegLength(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildSlabGlassControls(element: SlabGlass, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildDimensionalGlassAngleControl(element, triggerRebuild);
  return {
    controls: [
      makeControl(
        controlStrings.widthStringProperty,
        element.width,
        new Range(0.1, 3.0),
        0.05,
        (v) => {
          element.setWidth(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeControl(
        controlStrings.heightStringProperty,
        element.height,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setHeight(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildParallelogramPrismControls(
  element: ParallelogramPrism,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildDimensionalGlassAngleControl(element, triggerRebuild);
  return {
    controls: [
      makeControl(
        controlStrings.widthStringProperty,
        element.width,
        new Range(0.1, 3.0),
        0.05,
        (v) => {
          element.setWidth(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeControl(
        controlStrings.heightStringProperty,
        element.height,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setHeight(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildDovePrismControls(element: DovePrism, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildDimensionalGlassAngleControl(element, triggerRebuild);
  return {
    controls: [
      makeControl(
        controlStrings.widthStringProperty,
        element.width,
        new Range(0.1, 3.0),
        0.05,
        (v) => {
          element.setWidth(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeControl(
        controlStrings.heightStringProperty,
        element.height,
        new Range(0.1, 2.0),
        0.05,
        (v) => {
          element.setHeight(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      makeControl(
        controlStrings.refractiveIndexStringProperty,
        element.refIndex,
        new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
        0.05,
        (v) => {
          element.refIndex = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshAngle,
  };
}
