/**
 * LightSourceEditControls.ts
 *
 * Edit-panel control builders for light-source element types:
 * ArcLightSource, PointSourceElement, BeamSource, SingleRaySource.
 */

import { Range } from "scenerystack/dot";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../../i18n/StringManager.js";
import {
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  DIVERGENCE_MAX_DEG,
  DIVERGENCE_MIN_DEG,
  EMISSION_ANGLE_MAX_DEG,
  EMISSION_ANGLE_MIN_DEG,
  WAVELENGTH_MAX_NM,
  WAVELENGTH_MIN_NM,
} from "../../../OpticsLabConstants.js";
import type { ArcLightSource } from "../../model/light-sources/ArcLightSource.js";
import type { BeamSource } from "../../model/light-sources/BeamSource.js";
import type { ContinuousSpectrumSource } from "../../model/light-sources/ContinuousSpectrumSource.js";
import type { PointSourceElement } from "../../model/light-sources/PointSourceElement.js";
import type { SingleRaySource } from "../../model/light-sources/SingleRaySource.js";
import {
  buildDirectionAngleAboutP1Control,
  buildDirectionAngleControl,
  buildSegmentLengthControl,
  makeControl,
  makeWavelengthControl,
} from "./EditControlHelpers.js";
import type { EditControlsResult } from "./EditControlsResult.js";

export function buildArcLightSourceControls(element: ArcLightSource, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: directionAngleControl, refresh: refreshDirectionAngle } = buildDirectionAngleControl(
    () => element.direction,
    (rad) => {
      element.direction = rad;
    },
    controlStrings.angleStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      directionAngleControl,
      makeControl(
        controlStrings.emissionAngleStringProperty,
        element.emissionAngle * (180 / Math.PI),
        new Range(EMISSION_ANGLE_MIN_DEG, EMISSION_ANGLE_MAX_DEG),
        1,
        (v) => {
          element.emissionAngle = v * (Math.PI / 180);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshDirectionAngle,
  };
}

export function buildPointSourceControls(element: PointSourceElement, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  return {
    controls: [
      makeControl(
        controlStrings.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: null,
  };
}

export function buildBeamSourceControls(element: BeamSource, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: heightControl, refresh } = buildSegmentLengthControl(
    element,
    controlStrings.heightStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeControl(
        controlStrings.divergenceStringProperty,
        element.emisAngle,
        new Range(DIVERGENCE_MIN_DEG, DIVERGENCE_MAX_DEG),
        1,
        (v) => {
          element.emisAngle = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      heightControl,
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refresh,
  };
}

export function buildSingleRaySourceControls(element: SingleRaySource, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildDirectionAngleAboutP1Control(
    element,
    controlStrings.angleStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      makeWavelengthControl(
        element.wavelength,
        new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
        (v) => {
          element.wavelength = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildContinuousSpectrumSourceControls(
  element: ContinuousSpectrumSource,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildDirectionAngleAboutP1Control(
    element,
    controlStrings.angleStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.brightnessStringProperty,
        element.brightness,
        new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
        0.05,
        (v) => {
          element.brightness = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
    ],
    refreshCallback: refreshAngle,
  };
}
