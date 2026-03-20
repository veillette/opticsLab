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
import { Tandem } from "scenerystack/tandem";
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
export function makeControl(
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
 * Build a wavelength control with a spectrum-coloured track and a custom
 * symmetric thumb (centred on the track, not hanging below it).
 */
export function makeWavelengthControl(
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

  const trackNode = new SpectrumSliderTrack(prop, range, {
    valueToColor: VisibleColor.wavelengthToColor,
    size: SLIDER_TRACK_SIZE,
    tandem: Tandem.OPT_OUT,
  });

  const thumbNode = new SymmetricWavelengthThumb(prop);

  return new NumberControl("λ", prop, range, {
    delta: WAVELENGTH_CONTROL_DELTA,
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
      backgroundFill: "rgba(0,0,0,0.35)",
      backgroundStroke: "rgba(100,100,120,0.6)",
    },
    sliderOptions: {
      trackNode,
      thumbNode,
      tandem: Tandem.OPT_OUT,
    },
    tandem: Tandem.OPT_OUT,
  });
}

/**
 * Shared NumberControl options used throughout the panel.
 */
export function numberControlOptions(delta: number, decimalPlaces: number) {
  return {
    delta,
    includeArrowButtons: true,
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

// ── Shared segment helpers ────────────────────────────────────────────────────

/** Euclidean length of a two-point segment in model space. */
export function segmentLength(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
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
