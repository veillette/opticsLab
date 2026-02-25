/**
 * OpticsLabConstants.ts
 *
 * Central repository for numeric constants shared across the application.
 * Component-specific constants that are only used within a single file live
 * at the top of that file instead.
 */

import opticsLab from "./OpticsLabNamespace.js";

// ── Panel styling ─────────────────────────────────────────────────────────────
export const PANEL_CORNER_RADIUS = 8;

// ── Screen layout ─────────────────────────────────────────────────────────────
export const RESET_BUTTON_MARGIN = 10;

// ── Button sizing ──────────────────────────────────────────────────────────────
export const BUTTON_X_MARGIN = 8;
export const BUTTON_Y_MARGIN = 6;
export const BUTTON_MIN_CONTENT_SIZE = 18;
export const TOUCH_AREA_DILATION = 5;
export const MOUSE_AREA_DILATION = 2;

// ── Control panel ─────────────────────────────────────────────────────────────
export const CONTROL_ICON_SIZE = 20;
export const CONTROL_PANEL_ROWS_SPACING = 12;
export const CONTROL_PANEL_X_MARGIN = 12;
export const CONTROL_PANEL_Y_MARGIN = 12;

const OpticsLabConstants = {
  panelCornerRadius: PANEL_CORNER_RADIUS,
  resetButtonMargin: RESET_BUTTON_MARGIN,
  buttonXMargin: BUTTON_X_MARGIN,
  buttonYMargin: BUTTON_Y_MARGIN,
  buttonMinContentSize: BUTTON_MIN_CONTENT_SIZE,
  touchAreaDilation: TOUCH_AREA_DILATION,
  mouseAreaDilation: MOUSE_AREA_DILATION,
  controlIconSize: CONTROL_ICON_SIZE,
  controlPanelRowsSpacing: CONTROL_PANEL_ROWS_SPACING,
  controlPanelXMargin: CONTROL_PANEL_X_MARGIN,
  controlPanelYMargin: CONTROL_PANEL_Y_MARGIN,
};

opticsLab.register("OpticsLabConstants", OpticsLabConstants);
