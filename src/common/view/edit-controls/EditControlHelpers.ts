/**
 * EditControlHelpers.ts
 *
 * Shared utilities for building edit-panel controls: widget factories,
 * a wavelength control, and segment-resize helpers.  All symbols are
 * re-used across the per-element-family control builders.
 */

import { NumberProperty, type ReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import type { Node } from "scenerystack/scenery";
import { NumberControl, SpectrumSliderTrack, VisibleColor } from "scenerystack/scenery-phet";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../../i18n/StringManager.js";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  SEGMENT_LENGTH_MAX,
  SEGMENT_LENGTH_MIN,
  SLIDER_THUMB_HEIGHT,
  SLIDER_THUMB_WIDTH,
  SLIDER_TRACK_HEIGHT,
  SLIDER_TRACK_WIDTH,
  WAVELENGTH_CONTROL_DELTA,
} from "../../../OpticsLabConstants.js";
import { sceneHistoryRegistry } from "../SceneHistoryRegistry.js";
import { SymmetricWavelengthThumb } from "../SymmetricWavelengthThumb.js";

export type { EditControlsResult } from "./EditControlsResult.js";

// ── Module-level constants ────────────────────────────────────────────────────

export const SLIDER_TRACK_SIZE = new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT);
export const SLIDER_THUMB_SIZE = new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT);
export const LABEL_FONT = "11px sans-serif";

// ── Private widget helpers ────────────────────────────────────────────────────

/** Clamp a number to a range, replacing non-finite values with a fallback. */
export function safeClamp(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

/** Number of decimal places to show for a given step size. */
export function decimalPlacesForDelta(delta: number): number {
  const absoluteDelta = Math.abs(delta);
  if (absoluteDelta >= 1) {
    return 0;
  }
  if (absoluteDelta >= 0.1) {
    return 1;
  }
  return 2;
}

/**
 * Build a NumberControl: a labeled slider that also displays the current value.
 */
export function makeControl(
  label: string | ReadOnlyProperty<string>,
  initValue: number,
  range: Range,
  delta: number,
  onSet: (v: number) => void,
  onAfterSet: () => void,
  tandem: Tandem,
): Node {
  const clampedInit = Math.max(range.min, Math.min(range.max, initValue));
  const numberProperty = new NumberProperty(clampedInit, { range, tandem: tandem.createTandem("numberProperty") });
  numberProperty.lazyLink((v) => {
    onSet(v);
    onAfterSet();
  });
  let beforeValue = clampedInit;
  return new NumberControl(label, numberProperty, range, {
    delta,
    startCallback: () => {
      beforeValue = numberProperty.value;
    },
    endCallback: () => {
      const history = sceneHistoryRegistry.history;
      if (!history) {
        return;
      }
      const after = numberProperty.value;
      if (beforeValue === after) {
        return;
      }
      const before = beforeValue;
      history.execute({
        description: "Edit property",
        execute: () => {
          numberProperty.value = after;
        },
        undo: () => {
          numberProperty.value = before;
        },
      });
    },
    includeArrowButtons: true,
    soundGenerator: null,
    layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
    titleNodeOptions: {
      fill: OpticsLabColors.overlayLabelFillProperty,
      font: LABEL_FONT,
    },
    numberDisplayOptions: {
      decimalPlaces: decimalPlacesForDelta(delta),
      textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: LABEL_FONT },
      backgroundFill: OpticsLabColors.overlayInputBackgroundProperty,
      backgroundStroke: OpticsLabColors.overlayInputBorderProperty,
    },
    sliderOptions: {
      trackSize: SLIDER_TRACK_SIZE,
      thumbSize: SLIDER_THUMB_SIZE,
      tandem: tandem.createTandem("slider"),
    },
    tandem,
  });
}

/**
 * Build a wavelength control with a spectrum-coloured track and a custom
 * symmetric thumb (centred on the track, not hanging below it).
 */
export function makeWavelengthControl(
  initValue: number,
  range: Range,
  onSet: (v: number) => void,
  onAfterSet: () => void,
  tandem: Tandem,
): Node {
  const clampedInit = Math.max(range.min, Math.min(range.max, initValue));
  const numberProperty = new NumberProperty(clampedInit, { range, tandem: tandem.createTandem("numberProperty") });
  numberProperty.lazyLink((v) => {
    onSet(v);
    onAfterSet();
  });
  let beforeValue = clampedInit;

  const trackNode = new SpectrumSliderTrack(numberProperty, range, {
    valueToColor: VisibleColor.wavelengthToColor,
    size: SLIDER_TRACK_SIZE,
    tandem: tandem.createTandem("spectrumTrack"),
  });

  const thumbNode = new SymmetricWavelengthThumb(numberProperty);

  return new NumberControl(
    StringManager.getInstance().getControlStrings().wavelengthStringProperty,
    numberProperty,
    range,
    {
      delta: WAVELENGTH_CONTROL_DELTA,
      startCallback: () => {
        beforeValue = numberProperty.value;
      },
      endCallback: () => {
        const history = sceneHistoryRegistry.history;
        if (!history) {
          return;
        }
        const after = numberProperty.value;
        if (beforeValue === after) {
          return;
        }
        const before = beforeValue;
        history.execute({
          description: "Edit wavelength",
          execute: () => {
            numberProperty.value = after;
          },
          undo: () => {
            numberProperty.value = before;
          },
        });
      },
      includeArrowButtons: true,
      soundGenerator: null,
      layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
      titleNodeOptions: {
        fill: OpticsLabColors.overlayLabelFillProperty,
        font: LABEL_FONT,
      },
      numberDisplayOptions: {
        decimalPlaces: 0,
        valuePattern: "{0} nm",
        textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: LABEL_FONT },
        backgroundFill: OpticsLabColors.overlayInputBackgroundProperty,
        backgroundStroke: OpticsLabColors.overlayInputBorderProperty,
      },
      sliderOptions: {
        trackNode,
        thumbNode,
        tandem: tandem.createTandem("slider"),
      },
      tandem,
    },
  );
}

/**
 * Shared NumberControl options used throughout the panel.
 */
export function numberControlOptions(delta: number, decimalPlaces: number, tandem: Tandem) {
  return {
    delta,
    includeArrowButtons: true,
    soundGenerator: null,
    layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
    titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
    numberDisplayOptions: {
      decimalPlaces,
      textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: LABEL_FONT },
      backgroundFill: OpticsLabColors.overlayInputBackgroundProperty,
      backgroundStroke: OpticsLabColors.overlayInputBorderProperty,
    },
    sliderOptions: {
      trackSize: SLIDER_TRACK_SIZE,
      thumbSize: SLIDER_THUMB_SIZE,
      tandem: tandem.createTandem("slider"),
    },
    tandem,
  };
}

// ── Shared segment helpers ────────────────────────────────────────────────────

/** Euclidean length of a two-point segment in model space. */
export function segmentLength(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/** Angle of a segment in degrees, normalised to [0, 360). */
export function segmentAngleDeg(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const deg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  return ((deg % 360) + 360) % 360;
}

/** Rotate a segment to newAngleDeg while keeping its centre and length fixed. */
export function rotateSegment(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  newAngleDeg: number,
): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  const half = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2;
  const rad = newAngleDeg * (Math.PI / 180);
  return {
    p1: { x: cx - Math.cos(rad) * half, y: cy - Math.sin(rad) * half },
    p2: { x: cx + Math.cos(rad) * half, y: cy + Math.sin(rad) * half },
  };
}

/**
 * Rotate the direction segment about p1 (origin): p1 fixed, p2 moves on a circle
 * of radius |p2−p1|. Matches arc-source-style rotation around the source centre.
 */
export function rotateSegmentAboutP1(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  newAngleDeg: number,
): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
  let len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (len < 1e-10) {
    len = SEGMENT_LENGTH_MIN;
  }
  const rad = newAngleDeg * (Math.PI / 180);
  return {
    p1: { x: p1.x, y: p1.y },
    p2: { x: p1.x + Math.cos(rad) * len, y: p1.y + Math.sin(rad) * len },
  };
}

/**
 * Build a 0–360° angle NumberControl that rotates a p1/p2 segment around
 * its centre while keeping the length fixed.
 */
export function buildSegmentAngleControl(
  element: { p1: { x: number; y: number }; p2: { x: number; y: number } },
  label: string | ReadOnlyProperty<string>,
  triggerRebuild: () => void,
  tandem: Tandem,
): { control: Node; refresh: () => void } {
  const A_RANGE = new Range(0, 360);
  const angleProp = new NumberProperty(segmentAngleDeg(element.p1, element.p2), {
    range: A_RANGE,
    tandem: tandem.createTandem("numberProperty"),
  });
  let angleDriving = false;
  angleProp.lazyLink((deg) => {
    angleDriving = true;
    const rotated = rotateSegment(element.p1, element.p2, deg);
    element.p1 = rotated.p1;
    element.p2 = rotated.p2;
    triggerRebuild();
    angleDriving = false;
  });
  let beforeAngle = angleProp.value;
  const control = new NumberControl(label, angleProp, A_RANGE, {
    ...numberControlOptions(1, 0, tandem),
    startCallback: () => {
      beforeAngle = angleProp.value;
    },
    endCallback: () => {
      const history = sceneHistoryRegistry.history;
      if (!history) {
        return;
      }
      const after = angleProp.value;
      if (beforeAngle === after) {
        return;
      }
      const before = beforeAngle;
      history.execute({
        description: "Rotate element",
        execute: () => {
          angleProp.value = after;
        },
        undo: () => {
          angleProp.value = before;
        },
      });
    },
  });
  const refresh = (): void => {
    if (angleDriving) {
      return;
    }
    angleProp.value = segmentAngleDeg(element.p1, element.p2);
  };
  return { control, refresh };
}

/**
 * Build a 0–360° angle NumberControl that rotates p2 around p1 while keeping
 * |p2−p1| fixed (single-ray / continuous-spectrum style, like arc source).
 */
export function buildDirectionAngleAboutP1Control(
  element: { p1: { x: number; y: number }; p2: { x: number; y: number } },
  label: string | ReadOnlyProperty<string>,
  triggerRebuild: () => void,
  tandem: Tandem,
): { control: Node; refresh: () => void } {
  const A_RANGE = new Range(0, 360);
  const angleProp = new NumberProperty(segmentAngleDeg(element.p1, element.p2), {
    range: A_RANGE,
    tandem: tandem.createTandem("numberProperty"),
  });
  let angleDriving = false;
  angleProp.lazyLink((deg) => {
    angleDriving = true;
    const rotated = rotateSegmentAboutP1(element.p1, element.p2, deg);
    element.p1 = rotated.p1;
    element.p2 = rotated.p2;
    triggerRebuild();
    angleDriving = false;
  });
  let beforeAngle = angleProp.value;
  const control = new NumberControl(label, angleProp, A_RANGE, {
    ...numberControlOptions(1, 0, tandem),
    startCallback: () => {
      beforeAngle = angleProp.value;
    },
    endCallback: () => {
      const history = sceneHistoryRegistry.history;
      if (!history) {
        return;
      }
      const after = angleProp.value;
      if (beforeAngle === after) {
        return;
      }
      const before = beforeAngle;
      history.execute({
        description: "Rotate direction",
        execute: () => {
          angleProp.value = after;
        },
        undo: () => {
          angleProp.value = before;
        },
      });
    },
  });
  const refresh = (): void => {
    if (angleDriving) {
      return;
    }
    angleProp.value = segmentAngleDeg(element.p1, element.p2);
  };
  return { control, refresh };
}

/**
 * Angle in degrees [0, 360) for a direction stored in radians (same convention as
 * Math.atan2 / ArcLightSource.direction).
 */
export function radiansToDisplayDeg(rad: number): number {
  const deg = rad * (180 / Math.PI);
  return ((deg % 360) + 360) % 360;
}

/**
 * Build a 0–360° NumberControl for a direction given in radians (e.g. ArcLightSource.direction).
 */
export function buildDirectionAngleControl(
  getDirectionRadians: () => number,
  setDirectionRadians: (rad: number) => void,
  label: string | ReadOnlyProperty<string>,
  triggerRebuild: () => void,
  tandem: Tandem,
): { control: Node; refresh: () => void } {
  const A_RANGE = new Range(0, 360);
  const angleProp = new NumberProperty(radiansToDisplayDeg(getDirectionRadians()), {
    range: A_RANGE,
    tandem: tandem.createTandem("numberProperty"),
  });
  let angleDriving = false;
  angleProp.lazyLink((deg) => {
    angleDriving = true;
    setDirectionRadians(deg * (Math.PI / 180));
    triggerRebuild();
    angleDriving = false;
  });
  let beforeAngle = angleProp.value;
  const control = new NumberControl(label, angleProp, A_RANGE, {
    ...numberControlOptions(1, 0, tandem),
    startCallback: () => {
      beforeAngle = angleProp.value;
    },
    endCallback: () => {
      const history = sceneHistoryRegistry.history;
      if (!history) {
        return;
      }
      const after = angleProp.value;
      if (beforeAngle === after) {
        return;
      }
      const before = beforeAngle;
      history.execute({
        description: "Rotate direction",
        execute: () => {
          angleProp.value = after;
        },
        undo: () => {
          angleProp.value = before;
        },
      });
    },
  });
  const refresh = (): void => {
    if (angleDriving) {
      return;
    }
    angleProp.value = radiansToDisplayDeg(getDirectionRadians());
  };
  return { control, refresh };
}

/** Resize a segment to newLength while keeping its centre and orientation fixed. */
export function resizeSegment(
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
export function buildSegmentLengthControl(
  element: { p1: { x: number; y: number }; p2: { x: number; y: number } },
  label: string | ReadOnlyProperty<string>,
  triggerRebuild: () => void,
  tandem: Tandem,
): { control: Node; refresh: () => void } {
  const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
  const lenProp = new NumberProperty(safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0), {
    range: L_RANGE,
    tandem: tandem.createTandem("numberProperty"),
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
  let beforeLen = lenProp.value;
  const control = new NumberControl(label, lenProp, L_RANGE, {
    ...numberControlOptions(0.05, 2, tandem),
    startCallback: () => {
      beforeLen = lenProp.value;
    },
    endCallback: () => {
      const history = sceneHistoryRegistry.history;
      if (!history) {
        return;
      }
      const after = lenProp.value;
      if (beforeLen === after) {
        return;
      }
      const before = beforeLen;
      history.execute({
        description: "Resize element",
        execute: () => {
          lenProp.value = after;
        },
        undo: () => {
          lenProp.value = before;
        },
      });
    },
  });
  const refresh = (): void => {
    if (lenDriving) {
      return;
    }
    lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
  };
  return { control, refresh };
}
