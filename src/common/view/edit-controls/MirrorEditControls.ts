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
  ARC_MIRROR_RADIUS_MAX,
  ARC_MIRROR_RADIUS_MIN,
  FOCAL_LENGTH_MAX_M,
  FOCAL_LENGTH_MIN_M,
  LINES_DENSITY_CONTROL_DELTA,
} from "../../../OpticsLabConstants.js";
import type { LineBlocker } from "../../model/blockers/LineBlocker.js";
import type { DetectorElement } from "../../model/detectors/DetectorElement.js";
import type { ReflectionGrating } from "../../model/gratings/ReflectionGrating.js";
import type { TransmissionGrating } from "../../model/gratings/TransmissionGrating.js";
import type { TrackElement } from "../../model/guides/TrackElement.js";
import type { ArcMirror } from "../../model/mirrors/ArcMirror.js";
import type { BeamSplitterElement } from "../../model/mirrors/BeamSplitterElement.js";
import type { IdealCurvedMirror } from "../../model/mirrors/IdealCurvedMirror.js";
import type { SegmentMirror } from "../../model/mirrors/SegmentMirror.js";
import { buildSegmentLengthControl, makeControl, numberControlOptions, safeClamp } from "./EditControlHelpers.js";
import type { EditControlsResult } from "./EditControlsResult.js";

export function buildArcMirrorControls(element: ArcMirror, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
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
        numberControlOptions(0.1, 1),
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
  const { control: lenControl, refresh } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
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
      ),
      lenControl,
    ],
    refreshCallback: refresh,
  };
}

export function buildDetectorControls(element: DetectorElement, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: lenControl, refresh } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
  );
  return { controls: [lenControl], refreshCallback: refresh };
}

export function buildSegmentControls(
  element: SegmentMirror | LineBlocker | TrackElement,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: lenControl, refresh } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
  );
  return { controls: [lenControl], refreshCallback: refresh };
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
      ),
    ],
    refreshCallback: null,
  };
}
