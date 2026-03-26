/**
 * MirrorEditControls.ts
 *
 * Edit-panel control builders for mirrors, gratings, detectors, segment
 * elements (SegmentMirror / LineBlocker / TrackElement), and BeamSplitter.
 */

import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { NumberControl } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../../i18n/StringManager.js";
import {
  APERTURED_MIRROR_APERTURE_MAX_M,
  APERTURED_MIRROR_APERTURE_MIN_M,
  ARC_MIRROR_CURVATURE_MAX,
  ARC_MIRROR_CURVATURE_MIN,
  ARC_MIRROR_RADIUS_MAX,
  ARC_MIRROR_RADIUS_MIN,
  DETECTOR_BINS_MAX,
  DETECTOR_BINS_MIN,
  FOCAL_LENGTH_MAX_M,
  FOCAL_LENGTH_MIN_M,
  LINES_DENSITY_CONTROL_DELTA,
} from "../../../OpticsLabConstants.js";
import type { ApertureElement } from "../../model/blockers/ApertureElement.js";
import type { LineBlocker } from "../../model/blockers/LineBlocker.js";
import type { DetectorElement } from "../../model/detectors/DetectorElement.js";
import type { ReflectionGrating } from "../../model/gratings/ReflectionGrating.js";
import type { TransmissionGrating } from "../../model/gratings/TransmissionGrating.js";
import type { TrackElement } from "../../model/guides/TrackElement.js";
import type { AperturedParabolicMirror } from "../../model/mirrors/AperturedParabolicMirror.js";
import type { ArcMirror } from "../../model/mirrors/ArcMirror.js";
import type { BeamSplitterElement } from "../../model/mirrors/BeamSplitterElement.js";
import type { IdealCurvedMirror } from "../../model/mirrors/IdealCurvedMirror.js";
import type { SegmentMirror } from "../../model/mirrors/SegmentMirror.js";
import {
  buildSegmentAngleControl,
  buildSegmentLengthControl,
  makeControl,
  numberControlOptions,
  rotateSegment,
  safeClamp,
  segmentAngleDeg,
} from "./EditControlHelpers.js";
import type { EditControlsResult } from "./EditControlsResult.js";

export function buildArcMirrorControls(
  element: ArcMirror,
  triggerRebuild: () => void,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();

  if (useCurvatureDisplay) {
    // Curvature mode: κ = 1/R (m⁻¹)
    const K_RANGE = new Range(ARC_MIRROR_CURVATURE_MIN, ARC_MIRROR_CURVATURE_MAX);
    const currentR = element.getRadius() ?? ARC_MIRROR_RADIUS_MAX;
    const kappaProp = new NumberProperty(safeClamp(1 / currentR, K_RANGE.min, K_RANGE.max, 1 / ARC_MIRROR_RADIUS_MAX), {
      range: K_RANGE,
      tandem: Tandem.OPTIONAL,
    });
    let sliderDriving = false;
    kappaProp.lazyLink((kappa) => {
      sliderDriving = true;
      element.setRadius(1 / kappa);
      triggerRebuild();
      sliderDriving = false;
    });
    const refreshCallback = (): void => {
      if (sliderDriving) {
        return;
      }
      const r = element.getRadius() ?? ARC_MIRROR_RADIUS_MAX;
      kappaProp.value = safeClamp(1 / r, K_RANGE.min, K_RANGE.max, 1 / ARC_MIRROR_RADIUS_MAX);
    };
    return {
      controls: [
        new NumberControl(
          controlStrings.curvatureStringProperty,
          kappaProp,
          K_RANGE,
          numberControlOptions(0.01, 2, Tandem.OPTIONAL),
        ),
      ],
      refreshCallback,
    };
  }

  // Radius mode (default)
  const R_RANGE = new Range(ARC_MIRROR_RADIUS_MIN, ARC_MIRROR_RADIUS_MAX);
  const currentRadius = safeClamp(
    element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
    R_RANGE.min,
    R_RANGE.max,
    ARC_MIRROR_RADIUS_MAX,
  );
  const radiusProp = new NumberProperty(currentRadius, { range: R_RANGE, tandem: Tandem.OPTIONAL });
  let sliderDriving = false;
  radiusProp.lazyLink((v) => {
    sliderDriving = true;
    element.setRadius(v);
    triggerRebuild();
    sliderDriving = false;
  });
  const refreshCallback = (): void => {
    if (sliderDriving) {
      return;
    }
    radiusProp.value = safeClamp(
      element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
      R_RANGE.min,
      R_RANGE.max,
      ARC_MIRROR_RADIUS_MAX,
    );
  };
  return {
    controls: [
      new NumberControl(
        controlStrings.radiusOfCurvatureStringProperty,
        radiusProp,
        R_RANGE,
        numberControlOptions(0.1, 1, Tandem.OPTIONAL),
      ),
    ],
    refreshCallback,
  };
}

export function buildIdealCurvedMirrorControls(
  element: IdealCurvedMirror,
  triggerRebuild: () => void,
): EditControlsResult {
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

export function buildAperturedMirrorControls(
  element: AperturedParabolicMirror,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        controlStrings.apertureSizeStringProperty,
        element.apertureHalfWidth,
        new Range(APERTURED_MIRROR_APERTURE_MIN_M, APERTURED_MIRROR_APERTURE_MAX_M),
        0.01,
        (v) => {
          element.apertureHalfWidth = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildDetectorControls(
  element: DetectorElement,
  triggerRebuild: () => void,
  useCurvatureDisplay = false,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: lenControl, refresh: refreshLength } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  const binsControl = makeControl(
    controlStrings.binsStringProperty,
    element.numBins,
    new Range(DETECTOR_BINS_MIN, DETECTOR_BINS_MAX),
    1,
    (v) => {
      element.numBins = Math.round(v);
      element.acquisitionComplete = false;
    },
    triggerRebuild,
    Tandem.OPTIONAL,
  );

  // ── Radius / curvature slider (same pattern as buildArcMirrorControls) ──
  let radiusControl: NumberControl;
  let refreshRadius: () => void;

  if (useCurvatureDisplay) {
    const K_RANGE = new Range(ARC_MIRROR_CURVATURE_MIN, ARC_MIRROR_CURVATURE_MAX);
    const currentR = element.getRadius() ?? ARC_MIRROR_RADIUS_MAX;
    const kappaProp = new NumberProperty(safeClamp(1 / currentR, K_RANGE.min, K_RANGE.max, 1 / ARC_MIRROR_RADIUS_MAX), {
      range: K_RANGE,
      tandem: Tandem.OPTIONAL,
    });
    let sliderDriving = false;
    kappaProp.lazyLink((kappa) => {
      sliderDriving = true;
      element.setRadius(1 / kappa);
      triggerRebuild();
      sliderDriving = false;
    });
    refreshRadius = (): void => {
      if (sliderDriving) {
        return;
      }
      const r = element.getRadius() ?? ARC_MIRROR_RADIUS_MAX;
      kappaProp.value = safeClamp(1 / r, K_RANGE.min, K_RANGE.max, 1 / ARC_MIRROR_RADIUS_MAX);
    };
    radiusControl = new NumberControl(
      controlStrings.curvatureStringProperty,
      kappaProp,
      K_RANGE,
      numberControlOptions(0.01, 2, Tandem.OPTIONAL),
    );
  } else {
    const R_RANGE = new Range(ARC_MIRROR_RADIUS_MIN, ARC_MIRROR_RADIUS_MAX);
    const currentRadius = safeClamp(
      element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
      R_RANGE.min,
      R_RANGE.max,
      ARC_MIRROR_RADIUS_MAX,
    );
    const radiusProp = new NumberProperty(currentRadius, { range: R_RANGE, tandem: Tandem.OPTIONAL });
    let sliderDriving = false;
    radiusProp.lazyLink((v) => {
      sliderDriving = true;
      element.setRadius(v);
      triggerRebuild();
      sliderDriving = false;
    });
    refreshRadius = (): void => {
      if (sliderDriving) {
        return;
      }
      radiusProp.value = safeClamp(
        element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
        R_RANGE.min,
        R_RANGE.max,
        ARC_MIRROR_RADIUS_MAX,
      );
    };
    radiusControl = new NumberControl(
      controlStrings.radiusOfCurvatureStringProperty,
      radiusProp,
      R_RANGE,
      numberControlOptions(0.1, 1, Tandem.OPTIONAL),
    );
  }

  const refreshCallback = (): void => {
    refreshLength?.();
    refreshRadius();
  };
  return { controls: [radiusControl, lenControl, binsControl], refreshCallback };
}

export function buildSegmentControls(
  element: SegmentMirror | LineBlocker | TrackElement,
  triggerRebuild: () => void,
): EditControlsResult {
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
    controls: [lenControl, angleControl],
    refreshCallback: () => {
      refreshLen();
      refreshAngle();
    },
  };
}

export function buildApertureControls(element: ApertureElement, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const A_RANGE = new Range(0, 360);

  // Build an angle control that rotates the aperture (p1/p2) while preserving
  // the fractional positions of the gap endpoints (p3/p4) along the line.
  let angleDriving = false;
  const angleProp = new NumberProperty(segmentAngleDeg(element.p1, element.p2), {
    range: A_RANGE,
    tandem: Tandem.OPTIONAL,
  });
  angleProp.lazyLink((deg) => {
    angleDriving = true;
    const p1 = element.p1;
    const p2 = element.p2;
    const p3 = element.p3;
    const p4 = element.p4;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    const t3 = lenSq > 1e-20 ? ((p3.x - p1.x) * dx + (p3.y - p1.y) * dy) / lenSq : 0.25;
    const t4 = lenSq > 1e-20 ? ((p4.x - p1.x) * dx + (p4.y - p1.y) * dy) / lenSq : 0.75;
    const rotated = rotateSegment(p1, p2, deg);
    const ndx = rotated.p2.x - rotated.p1.x;
    const ndy = rotated.p2.y - rotated.p1.y;
    element.p1 = rotated.p1;
    element.p2 = rotated.p2;
    element.p3 = { x: rotated.p1.x + t3 * ndx, y: rotated.p1.y + t3 * ndy };
    element.p4 = { x: rotated.p1.x + t4 * ndx, y: rotated.p1.y + t4 * ndy };
    triggerRebuild();
    angleDriving = false;
  });
  const angleControl = new NumberControl(
    controlStrings.angleStringProperty,
    angleProp,
    A_RANGE,
    numberControlOptions(1, 0, Tandem.OPTIONAL),
  );
  const refreshAngle = (): void => {
    if (angleDriving) {
      return;
    }
    angleProp.value = segmentAngleDeg(element.p1, element.p2);
  };

  return { controls: [angleControl], refreshCallback: refreshAngle };
}

export function buildGratingControls(
  element: TransmissionGrating | ReflectionGrating,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: lenControl, refresh } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.linesDensityStringProperty,
        element.linesDensity,
        new Range(1, 2500),
        LINES_DENSITY_CONTROL_DELTA,
        (v) => {
          element.linesDensity = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeControl(
        controlStrings.dutyCycleStringProperty,
        element.dutyCycle,
        new Range(0.01, 0.99),
        0.01,
        (v) => {
          element.dutyCycle = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      lenControl,
    ],
    refreshCallback: refresh,
  };
}

export function buildBeamSplitterControls(
  element: BeamSplitterElement,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        controlStrings.transmissionRatioStringProperty,
        element.transRatio,
        new Range(0, 1),
        0.05,
        (v) => {
          element.transRatio = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: null,
  };
}
