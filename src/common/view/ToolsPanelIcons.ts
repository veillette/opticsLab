/**
 * ToolsPanelIcons.ts
 *
 * Small icon nodes for the Tools-panel checkboxes, and a `makeCheckboxContent`
 * factory that pairs an icon with a Text label in an HBox.
 *
 * All icons are drawn in an ICON_SIZE × ICON_SIZE pixel canvas (pure view
 * space — no model coordinates involved).
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, HBox, Line, Node, Path, Text, type TextOptions } from "scenerystack/scenery";
import { MeasuringTapeNode, ProtractorNode } from "scenerystack/scenery-phet";
import OpticsLabColors from "../../OpticsLabColors.js";
import { HANDLE_LINE_WIDTH, HANDLE_RADIUS } from "../../OpticsLabConstants.js";
import { buildDiamondShape } from "./ViewHelpers.js";

/** Edge length of each icon's bounding square, in pixels. */
const ICON_SIZE = 14;
const cx = ICON_SIZE / 2;
const cy = ICON_SIZE / 2;

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates the content node for a tools-panel Checkbox that shows both a small
 * icon and a text label side-by-side.
 *
 * Usage:
 *   new Checkbox(property, makeCheckboxContent(myIcon(), strings.myLabel, labelOptions), checkboxOptions)
 */
export function makeCheckboxContent(
  icon: Node,
  textProperty: TReadOnlyProperty<string>,
  labelOptions: TextOptions,
  iconTextSpacing = 5,
): HBox {
  return new HBox({
    children: [icon, new Text(textProperty, labelOptions)],
    spacing: iconTextSpacing,
    align: "center",
  });
}

// ── Icons ─────────────────────────────────────────────────────────────────────

/**
 * Horizontal ruler with end ticks and a midpoint tick — measuring tape.
 * Uses MeasuringTapeNode.createIcon() scaled to ICON_SIZE.
 */
export function measuringTapeIcon(): Node {
  const icon = MeasuringTapeNode.createIcon({ tapeLength: ICON_SIZE });
  const b = icon.bounds;
  if (b.width > 0 && b.height > 0) {
    icon.scale(ICON_SIZE / Math.max(b.width, b.height));
  }
  return icon;
}

/**
 * Semicircular protractor — uses ProtractorNode.createIcon() scaled to ICON_SIZE.
 */
export function protractorIcon(): Node {
  const icon = ProtractorNode.createIcon({});
  const b = icon.bounds;
  if (b.width > 0 && b.height > 0) {
    icon.scale(ICON_SIZE / Math.max(b.width, b.height));
  }
  return icon;
}

/**
 * Dashed rays diverging from a point — indicates extended-rays mode.
 */
export function extendedRaysIcon(): Node {
  const c = OpticsLabColors.idealLensStrokeProperty;
  const dash: number[] = [3, 2];
  const startX = 1;
  const midX = ICON_SIZE * 0.42;
  const endX = ICON_SIZE - 1;
  const spreadY = 4;
  return new Node({
    children: [
      new Line(startX, cy, endX, cy, { stroke: c, lineWidth: 1.5, lineDash: dash }),
      new Line(midX, cy, endX, cy - spreadY, { stroke: c, lineWidth: 1, lineDash: dash }),
      new Line(midX, cy, endX, cy + spreadY, { stroke: c, lineWidth: 1, lineDash: dash }),
    ],
  });
}

/**
 * Small filled circle matching the endpoint drag-handle appearance.
 */
export function dragHandleIcon(): Node {
  const r = Math.min(HANDLE_RADIUS * 0.75, ICON_SIZE * 0.38);
  return new Circle(r, {
    fill: OpticsLabColors.handleFillProperty,
    stroke: OpticsLabColors.handleStrokeProperty,
    lineWidth: HANDLE_LINE_WIDTH * 0.75,
    x: cx,
    y: cy,
  });
}

/**
 * Diamond (rhombus) matching the focal-point markers on lenses and mirrors.
 */
export function focalPointIcon(): Node {
  const size = ICON_SIZE * 0.38;
  return new Path(buildDiamondShape(cx, cy, size), {
    fill: OpticsLabColors.focalMarkerFillProperty,
    lineWidth: 1,
  });
}

/**
 * Ray segment with a mid-point arrowhead — ray direction arrows.
 */
export function rayArrowsIcon(): Node {
  const c = OpticsLabColors.iconRayStrokeProperty;
  const left = 1;
  const right = ICON_SIZE - 1;
  const headH = 4;
  const headW = 2.5;
  const tipX = cx + headH / 2;
  const headShape = new Shape()
    .moveTo(tipX - headH, cy - headW)
    .lineTo(tipX, cy)
    .lineTo(tipX - headH, cy + headW)
    .close();
  return new Node({
    children: [new Line(left, cy, right, cy, { stroke: c, lineWidth: 1.5 }), new Path(headShape, { fill: c })],
  });
}

/**
 * Two short dashes representing ray stubs on either side of an element.
 */
export function rayStubsIcon(): Node {
  const c = OpticsLabColors.iconRayStrokeProperty;
  const stubLen = ICON_SIZE * 0.3;
  const gap = 2;
  return new Node({
    children: [
      new Line(cx - gap / 2 - stubLen, cy, cx - gap / 2, cy, { stroke: c, lineWidth: 1.5 }),
      new Line(cx + gap / 2, cy, cx + gap / 2 + stubLen, cy, { stroke: c, lineWidth: 1.5 }),
    ],
  });
}

/**
 * 2 × 2 cell mini-grid — grid visibility.
 */
export function gridIcon(): Node {
  const gray = OpticsLabColors.gridLineStrokeProperty;
  const m = 1;
  const s = ICON_SIZE;
  return new Node({
    children: [
      new Line(m, s * 0.35, s - m, s * 0.35, { stroke: gray, lineWidth: 0.75 }),
      new Line(m, s * 0.65, s - m, s * 0.65, { stroke: gray, lineWidth: 0.75 }),
      new Line(s * 0.35, m, s * 0.35, s - m, { stroke: gray, lineWidth: 0.75 }),
      new Line(s * 0.65, m, s * 0.65, s - m, { stroke: gray, lineWidth: 0.75 }),
    ],
  });
}

/**
 * Small star/diamond with converging rays — indicates image detection mode.
 */
export function showImagesIcon(): Node {
  const c = OpticsLabColors.focalMarkerFillProperty;
  const r = ICON_SIZE * 0.28;
  // Diamond shape centred in the icon
  const diamond = new Path(
    new Shape()
      .moveTo(cx, cy - r)
      .lineTo(cx + r * 0.65, cy)
      .lineTo(cx, cy + r)
      .lineTo(cx - r * 0.65, cy)
      .close(),
    { fill: c },
  );
  // Two short converging lines
  const left = new Line(1, cy - r * 0.8, cx - r * 0.75, cy, { stroke: c, lineWidth: 1 });
  const right = new Line(ICON_SIZE - 1, cy - r * 0.8, cx + r * 0.75, cy, { stroke: c, lineWidth: 1 });
  return new Node({ children: [left, right, diamond] });
}

/**
 * Small circle with a dot — observer position marker.
 */
export function observerIcon(): Node {
  const outer = new Circle(ICON_SIZE * 0.38, {
    stroke: OpticsLabColors.idealLensArrowStrokeProperty,
    lineWidth: 1.2,
    lineDash: [3, 2],
    x: cx,
    y: cy,
  });
  const inner = new Circle(ICON_SIZE * 0.13, {
    fill: OpticsLabColors.idealLensArrowStrokeProperty,
    x: cx,
    y: cy,
  });
  return new Node({ children: [outer, inner] });
}

/**
 * Cross-hair grid lines with a dot at the centre — snap-to-grid mode.
 */
export function snapToGridIcon(): Node {
  const gray = OpticsLabColors.gridLineStrokeProperty;
  const accent = OpticsLabColors.overlayLabelFillProperty;
  const m = 1;
  const s = ICON_SIZE;
  return new Node({
    children: [
      new Line(m, cy, s - m, cy, { stroke: gray, lineWidth: 0.75 }),
      new Line(cx, m, cx, s - m, { stroke: gray, lineWidth: 0.75 }),
      new Circle(2, { fill: accent, x: cx, y: cy }),
    ],
  });
}
