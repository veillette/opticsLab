/**
 * EditControlFactory.ts
 *
 * Factory that builds the type-specific UI controls shown in the edit panel.
 * This is the single location that maps model element types to their edit
 * controls — it mirrors the structure of OpticalElementViewFactory and is the
 * intentional coupling point between model classes and the edit UI.
 *
 * Keeping this logic here means EditContainerNode itself has zero direct
 * model-class imports.
 */

import { NumberProperty, type ReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import { Node } from "scenerystack/scenery";
import { NumberControl, WavelengthNumberControl } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  ARC_MIRROR_RADIUS_MAX,
  ARC_MIRROR_RADIUS_MIN,
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  DIVERGENCE_MAX_DEG,
  DIVERGENCE_MIN_DEG,
  EMISSION_ANGLE_MAX_DEG,
  EMISSION_ANGLE_MIN_DEG,
  FOCAL_LENGTH_MAX_M,
  FOCAL_LENGTH_MIN_M,
  REFRACTIVE_INDEX_MAX,
  REFRACTIVE_INDEX_MIN,
  SEGMENT_LENGTH_MAX,
  SEGMENT_LENGTH_MIN,
  SLIDER_THUMB_HEIGHT,
  SLIDER_THUMB_WIDTH,
  SLIDER_TRACK_HEIGHT,
  SLIDER_TRACK_WIDTH,
  SPHERICAL_R1_FALLBACK,
  SPHERICAL_R2_FALLBACK,
  SPHERICAL_RADIUS_MAX,
  SPHERICAL_RADIUS_MIN,
  WAVELENGTH_MAX_NM,
  WAVELENGTH_MIN_NM,
} from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { SignConvention } from "../../preferences/OpticsLabPreferencesModel.js";
import { LineBlocker } from "../model/blockers/LineBlocker.js";
import { BaseGlass } from "../model/glass/BaseGlass.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { SphericalLens } from "../model/glass/SphericalLens.js";
import { ReflectionGrating } from "../model/gratings/ReflectionGrating.js";
import { TransmissionGrating } from "../model/gratings/TransmissionGrating.js";
import { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import { BeamSource } from "../model/light-sources/BeamSource.js";
import { PointSourceElement } from "../model/light-sources/PointSourceElement.js";
import { SingleRaySource } from "../model/light-sources/SingleRaySource.js";
import { ArcMirror } from "../model/mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import { SegmentMirror } from "../model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";

// ── Module-level constants ────────────────────────────────────────────────────

const SLIDER_TRACK_SIZE = new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT);
const SLIDER_THUMB_SIZE = new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT);

const LABEL_FONT = "11px sans-serif";

// ── Private helpers ───────────────────────────────────────────────────────────

/** Clamp a number to a range, replacing non-finite values with a fallback. */
function safeClamp(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

/** Number of decimal places to show for a given step size. */
function decimalPlacesForDelta(delta: number): number {
  const abs = Math.abs(delta);
  if (abs >= 1) {
    return 0;
  }
  if (abs >= 0.1) {
    return 1;
  }
  return 2;
}

/**
 * Build a NumberControl: a labeled slider that also displays the current value.
 */
function makeControl(
  label: string | ReadOnlyProperty<string>,
  initValue: number,
  range: Range,
  delta: number,
  onSet: (v: number) => void,
  onAfterSet: () => void,
): Node {
  const clampedInit = Math.max(range.min, Math.min(range.max, initValue));
  const prop = new NumberProperty(clampedInit, { range, tandem: Tandem.OPT_OUT });
  prop.lazyLink((v) => {
    onSet(v);
    onAfterSet();
  });
  return new NumberControl(label, prop, range, {
    delta,
    includeArrowButtons: false,
    soundGenerator: null,
    layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
    titleNodeOptions: {
      fill: OpticsLabColors.overlayLabelFillProperty,
      font: LABEL_FONT,
    },
    numberDisplayOptions: {
      decimalPlaces: decimalPlacesForDelta(delta),
      textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: LABEL_FONT },
      backgroundFill: "rgba(0,0,0,0.35)",
      backgroundStroke: "rgba(100,100,120,0.6)",
    },
    sliderOptions: {
      trackSize: SLIDER_TRACK_SIZE,
      thumbSize: SLIDER_THUMB_SIZE,
      tandem: Tandem.OPT_OUT,
    },
    tandem: Tandem.OPT_OUT,
  });
}

/**
 * Build a WavelengthNumberControl with a spectrum-coloured slider track.
 */
function makeWavelengthControl(
  initValue: number,
  range: Range,
  onSet: (v: number) => void,
  onAfterSet: () => void,
): Node {
  const clampedInit = Math.max(range.min, Math.min(range.max, initValue));
  const prop = new NumberProperty(clampedInit, { range, tandem: Tandem.OPT_OUT });
  prop.lazyLink((v) => {
    onSet(v);
    onAfterSet();
  });
  return new WavelengthNumberControl(prop, {
    range,
    tandem: Tandem.OPT_OUT,
    includeArrowButtons: false,
    soundGenerator: null,
    layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
    titleNodeOptions: {
      fill: OpticsLabColors.overlayLabelFillProperty,
      font: LABEL_FONT,
    },
    numberDisplayOptions: {
      textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: LABEL_FONT },
      backgroundFill: "rgba(0,0,0,0.35)",
      backgroundStroke: "rgba(100,100,120,0.6)",
    },
    spectrumSliderTrackOptions: { size: SLIDER_TRACK_SIZE },
    spectrumSliderThumbOptions: { width: SLIDER_THUMB_SIZE.width, height: SLIDER_THUMB_SIZE.height },
  });
}

/**
 * Shared NumberControl options used throughout the panel.
 */
function numberControlOptions(delta: number, decimalPlaces: number) {
  return {
    delta,
    includeArrowButtons: false,
    soundGenerator: null,
    layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
    titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
    numberDisplayOptions: {
      decimalPlaces,
      textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: LABEL_FONT },
      backgroundFill: "rgba(0,0,0,0.35)",
      backgroundStroke: "rgba(100,100,120,0.6)",
    },
    sliderOptions: {
      trackSize: SLIDER_TRACK_SIZE,
      thumbSize: SLIDER_THUMB_SIZE,
      tandem: Tandem.OPT_OUT,
    },
    tandem: Tandem.OPT_OUT,
  };
}

/** Euclidean length of a two-point segment in model space. */
function segmentLength(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/** Resize a segment to newLength while keeping its centre and orientation fixed. */
function resizeSegment(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  newLength: number,
): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  const ux = len > 1e-10 ? dx / len : 1;
  const uy = len > 1e-10 ? dy / len : 0;
  const half = newLength / 2;
  return {
    p1: { x: cx - ux * half, y: cy - uy * half },
    p2: { x: cx + ux * half, y: cy + uy * half },
  };
}

/**
 * Build the standard segment-length NumberControl for any element with p1/p2
 * endpoints. Returns the control node and a refresh function that syncs the
 * displayed value after an external drag changes the geometry.
 */
function buildSegmentLengthControl(
  element: { p1: { x: number; y: number }; p2: { x: number; y: number } },
  label: string | ReadOnlyProperty<string>,
  triggerRebuild: () => void,
): { control: Node; refresh: () => void } {
  const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
  const lenProp = new NumberProperty(safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0), {
    range: L_RANGE,
    tandem: Tandem.OPT_OUT,
  });
  let lenDriving = false;
  lenProp.lazyLink((v) => {
    lenDriving = true;
    const resized = resizeSegment(element.p1, element.p2, v);
    element.p1 = resized.p1;
    element.p2 = resized.p2;
    triggerRebuild();
    lenDriving = false;
  });
  const control = new NumberControl(label, lenProp, L_RANGE, numberControlOptions(0.05, 2));
  const refresh = (): void => {
    if (lenDriving) {
      return;
    }
    lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
  };
  return { control, refresh };
}

// ── Public API ────────────────────────────────────────────────────────────────

export type EditControlsResult = {
  controls: Node[];
  /** Called by EditContainerNode.refresh() to sync controls after a geometry drag. */
  refreshCallback: (() => void) | null;
};

/**
 * Build the property controls appropriate for the given optical element.
 * Returns the control nodes to display and an optional refresh callback
 * that can be invoked to sync control values after a geometry drag.
 */
export function buildEditControls(
  element: OpticalElement,
  triggerRebuild: () => void,
  signConvention: SignConvention,
): EditControlsResult {
  const controls: Node[] = [];
  let refreshCallback: (() => void) | null = null;
  const ctrl = StringManager.getInstance().getControlStrings();

  // ── Light Sources ─────────────────────────────────────────────────────
  if (element instanceof ArcLightSource) {
    controls.push(
      makeControl(
        ctrl.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
      ),
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.emissionAngleStringProperty,
        element.emissionAngle * (180 / Math.PI),
        new Range(EMISSION_ANGLE_MIN_DEG, EMISSION_ANGLE_MAX_DEG),
        1,
        (v) => {
          element.emissionAngle = v * (Math.PI / 180);
        },
        triggerRebuild,
      ),
    );
  } else if (element instanceof PointSourceElement) {
    controls.push(
      makeControl(
        ctrl.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
      ),
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
      ),
    );
  } else if (element instanceof BeamSource) {
    const { control: heightControl, refresh } = buildSegmentLengthControl(
      element,
      ctrl.heightStringProperty,
      triggerRebuild,
    );
    refreshCallback = refresh;
    controls.push(
      makeControl(
        ctrl.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
      ),
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.divergenceStringProperty,
        element.emisAngle,
        new Range(DIVERGENCE_MIN_DEG, DIVERGENCE_MAX_DEG),
        1,
        (v) => {
          element.emisAngle = v;
        },
        triggerRebuild,
      ),
      heightControl,
    );
  } else if (element instanceof SingleRaySource) {
    controls.push(
      makeControl(
        ctrl.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
      ),
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
      ),
    );

    // ── Glass / Lenses ────────────────────────────────────────────────────
  } else if (element instanceof SphericalLens) {
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
    const lenProp = new NumberProperty(
      safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0),
      {
        range: L_RANGE,
        tandem: Tandem.OPT_OUT,
      },
    );

    let sliderDriving = false;
    r1Prop.lazyLink((v) => {
      sliderDriving = true;
      const { d, r2: cr2 } = element.getDR1R2();
      element.createLensWithDR1R2(d, v, cr2);
      triggerRebuild();
      sliderDriving = false;
    });
    r2Prop.lazyLink((v) => {
      sliderDriving = true;
      const { d, r1: cr1 } = element.getDR1R2();
      // In RIP mode the slider holds −R₂_model; invert before storing.
      const modelR2 = isRIP ? -v : v;
      element.createLensWithDR1R2(d, cr1, modelR2);
      triggerRebuild();
      sliderDriving = false;
    });
    lenProp.lazyLink((v) => {
      sliderDriving = true;
      const resized = resizeSegment(element.p1, element.p2, v);
      element.p1 = resized.p1;
      element.p2 = resized.p2;
      const { d, r1: cr1, r2: cr2 } = element.getDR1R2();
      element.createLensWithDR1R2(d, cr1, cr2);
      triggerRebuild();
      sliderDriving = false;
    });

    refreshCallback = () => {
      if (sliderDriving) {
        return;
      }
      const { r1: newR1, r2: newR2 } = element.getDR1R2();
      r1Prop.value = safeClamp(newR1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK);
      r2Prop.value = safeClamp(isRIP ? -newR2 : newR2, R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK);
      lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
    };

    const r2Label = isRIP ? ctrl.r2RightRIPStringProperty : ctrl.r2RightSurfaceStringProperty;

    controls.push(
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
    );
  } else if (element instanceof IdealLens) {
    const { control: lenControl, refresh } = buildSegmentLengthControl(
      element,
      ctrl.lengthStringProperty,
      triggerRebuild,
    );
    refreshCallback = refresh;
    controls.push(
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
    );
  } else if (element instanceof CircleGlass) {
    controls.push(
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
    );
  } else if (element instanceof HalfPlaneGlass || element instanceof BaseGlass) {
    // Covers HalfPlaneGlass, Glass (prism), and other BaseGlass subclasses
    controls.push(
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
    );

    // ── Mirrors ───────────────────────────────────────────────────────────
  } else if (element instanceof ArcMirror) {
    const R_RANGE = new Range(ARC_MIRROR_RADIUS_MIN, ARC_MIRROR_RADIUS_MAX);
    const currentRadius = safeClamp(
      element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
      R_RANGE.min,
      R_RANGE.max,
      ARC_MIRROR_RADIUS_MAX,
    );
    const radiusProp = new NumberProperty(currentRadius, { range: R_RANGE, tandem: Tandem.OPT_OUT });
    let sliderDriving = false;
    radiusProp.lazyLink((v) => {
      sliderDriving = true;
      element.setRadius(v);
      triggerRebuild();
      sliderDriving = false;
    });
    refreshCallback = () => {
      if (sliderDriving) {
        return;
      }
      const r = safeClamp(
        element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
        R_RANGE.min,
        R_RANGE.max,
        ARC_MIRROR_RADIUS_MAX,
      );
      radiusProp.value = r;
    };
    controls.push(
      new NumberControl(ctrl.radiusOfCurvatureStringProperty, radiusProp, R_RANGE, numberControlOptions(0.1, 1)),
    );
  } else if (element instanceof IdealCurvedMirror) {
    const { control: lenControl, refresh } = buildSegmentLengthControl(
      element,
      ctrl.lengthStringProperty,
      triggerRebuild,
    );
    refreshCallback = refresh;
    controls.push(
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
    );
  } else if (element instanceof SegmentMirror || element instanceof LineBlocker) {
    const { control: lenControl, refresh } = buildSegmentLengthControl(
      element,
      ctrl.lengthStringProperty,
      triggerRebuild,
    );
    refreshCallback = refresh;
    controls.push(lenControl);
  } else if (element instanceof TransmissionGrating || element instanceof ReflectionGrating) {
    const { control: lenControl, refresh } = buildSegmentLengthControl(
      element,
      ctrl.lengthStringProperty,
      triggerRebuild,
    );
    refreshCallback = refresh;
    controls.push(
      makeControl(
        ctrl.linesDensityStringProperty,
        element.linesDensity,
        new Range(1, 2500),
        10,
        (v) => {
          element.linesDensity = v;
        },
        triggerRebuild,
      ),
      makeControl(
        ctrl.dutyCycleStringProperty,
        element.dutyCycle,
        new Range(0.01, 0.99),
        0.01,
        (v) => {
          element.dutyCycle = v;
        },
        triggerRebuild,
      ),
      lenControl,
    );
  } else if (element instanceof BeamSplitterElement) {
    controls.push(
      makeControl(
        ctrl.transmissionRatioStringProperty,
        element.transRatio,
        new Range(0, 1),
        0.05,
        (v) => {
          element.transRatio = v;
        },
        triggerRebuild,
      ),
    );
  }

  return { controls, refreshCallback };
}

opticsLab.register("buildEditControls", buildEditControls);
