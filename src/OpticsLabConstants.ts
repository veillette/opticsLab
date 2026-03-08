/**
 * OpticsLabConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * OpticsLab simulation.  Colour strings and computed expressions (e.g.
 * `2 * Math.PI`) remain inline where they appear, but every bare number
 * that carries semantic meaning lives here.
 *
 * Sections
 * ────────
 *  1. App chrome (existing)
 *  2. Coordinate / scale
 *  3. Physics / simulation defaults
 *  4. Ray canvas rendering
 *  5. Edit-panel UI
 *  6. Slider ranges
 *  7. Drag handles
 *  8. Mirror & blocker rendering
 *  9. Glass / lens rendering
 * 10. Light-source rendering
 */

import opticsLab from "./OpticsLabNamespace.js";

// ── 1. App chrome ─────────────────────────────────────────────────────────────

export const PANEL_CORNER_RADIUS = 8;
export const RESET_BUTTON_MARGIN = 10;

export const BUTTON_X_MARGIN = 8;
export const BUTTON_Y_MARGIN = 6;
export const BUTTON_MIN_CONTENT_SIZE = 18;
export const TOUCH_AREA_DILATION = 5;
export const MOUSE_AREA_DILATION = 2;

export const CONTROL_ICON_SIZE = 20;
export const CONTROL_PANEL_ROWS_SPACING = 12;
export const CONTROL_PANEL_X_MARGIN = 12;
export const CONTROL_PANEL_Y_MARGIN = 12;

// ── 2. Coordinate / scale ─────────────────────────────────────────────────────

/** Screen pixels per model metre. */
export const PIXELS_PER_METER = 100;

// ── 11. Grid ──────────────────────────────────────────────────────────────────

/** Spacing between grid lines, in model metres. */
export const GRID_SPACING_M = 1;

/**
 * Fraction of a grid cell within which a dragged element snaps to the
 * nearest grid line.  0.35 means snap triggers within ±35 % of spacing.
 */
export const GRID_SNAP_THRESHOLD_FRACTION = 0.35;

/** Snap threshold in model metres (derived from spacing × fraction). */
export const GRID_SNAP_THRESHOLD_M = GRID_SPACING_M * GRID_SNAP_THRESHOLD_FRACTION;

// ── 3. Physics / simulation defaults ─────────────────────────────────────────

export const DEFAULT_REFRACTIVE_INDEX = 1.5;
/** Cauchy B dispersion coefficient (µm²). */
export const DEFAULT_CAUCHY_B = 0.004;
/** Converts nm² → µm² in the Cauchy dispersion equation. */
export const CAUCHY_WAVELENGTH_FACTOR = 1e-6;
/** Default focal length for ideal optics (metres). */
export const DEFAULT_FOCAL_LENGTH = 1.0;

export const DEFAULT_MAX_RAY_DEPTH = 200;
export const DEFAULT_MIN_BRIGHTNESS = 0.01;
export const DEFAULT_RAY_DENSITY = 0.5;
export const RAY_DENSITY_MIN = 0.2;
export const RAY_DENSITY_MAX = 1.0;
/** Distance used as "optical infinity" in ray-tracer geometry (model units). */
export const FAR_DISTANCE = 10000;
export const MAX_RAY_PAIRS = 500;

// ── 4. Ray canvas rendering ───────────────────────────────────────────────────

/** Forward-ray base colour components (R, G, B). */
export const RAY_R = 0;
export const RAY_G = 210;
export const RAY_B = 0;
/** Extension / virtual-ray colour components. */
export const EXT_R = 140;
export const EXT_G = 140;
export const EXT_B = 140;
/** Observed-ray highlight colour components. */
export const OBS_R = 60;
export const OBS_G = 255;
export const OBS_B = 60;

export const RAY_LINE_WIDTH = 1.5;
export const EXT_LINE_WIDTH = 0.8;
/** brightness → alpha multiplier for forward rays. */
export const RAY_ALPHA_SCALE = 1.2;
/** brightness → alpha multiplier for extension rays. */
export const EXT_ALPHA_SCALE = 0.35;
/** Alpha below which a segment is skipped entirely. */
export const RAY_ALPHA_SKIP = 0.005;

// ── 5. Edit-panel UI ──────────────────────────────────────────────────────────

export const PANEL_BOTTOM_MARGIN = 10;
export const PANEL_X_MARGIN = 12;
export const PANEL_Y_MARGIN = 8;

export const SLIDER_TRACK_WIDTH = 130;
export const SLIDER_TRACK_HEIGHT = 4;
export const SLIDER_THUMB_WIDTH = 10;
export const SLIDER_THUMB_HEIGHT = 20;

export const TITLE_ROW_SPACING = 12;
export const PANEL_CONTENT_SPACING = 8;
export const SLIDER_LABEL_SPACING = 2;

// ── 6. Slider ranges ──────────────────────────────────────────────────────────

export const BRIGHTNESS_MIN = 0.05;
export const BRIGHTNESS_MAX = 2;

export const WAVELENGTH_MIN_NM = 380;
export const WAVELENGTH_MAX_NM = 780;

export const EMISSION_ANGLE_MIN_DEG = 5;
export const EMISSION_ANGLE_MAX_DEG = 360;

export const DIVERGENCE_MIN_DEG = 0;
export const DIVERGENCE_MAX_DEG = 90;

export const SPHERICAL_RADIUS_MIN = -20;
export const SPHERICAL_RADIUS_MAX = 20;
export const SPHERICAL_R1_FALLBACK = 5;
export const SPHERICAL_R2_FALLBACK = -5;

export const REFRACTIVE_INDEX_MIN = 1;
export const REFRACTIVE_INDEX_MAX = 3;

export const ARC_MIRROR_RADIUS_MIN = 0.1;
export const ARC_MIRROR_RADIUS_MAX = 20;

/** Focal-length slider bounds in metres (displayed; stored as ×100 in model). */
export const FOCAL_LENGTH_MIN_M = -3;
export const FOCAL_LENGTH_MAX_M = 3;

/** Length slider bounds for line-segment elements (blocker, flat mirror, ideal lens/mirror). */
export const SEGMENT_LENGTH_MIN = 0.1;
export const SEGMENT_LENGTH_MAX = 5.0;

// ── 7. Drag handles ───────────────────────────────────────────────────────────

export const HANDLE_RADIUS = 6; // px – fixed visual size
export const HANDLE_LINE_WIDTH = 1.5;

// ── 8. Mirror & blocker rendering ────────────────────────────────────────────

/** Shared back-face stroke width for mirrors and blockers. */
export const MIRROR_BACK_WIDTH = 5;
/** Shared front-face stroke width for mirrors and blockers. */
export const MIRROR_FRONT_WIDTH = 2.5;

export const ARC_MIRROR_SAMPLE_COUNT = 60;
export const PARABOLIC_MIRROR_SEGMENT_COUNT = 80;
/** Offset (model m) to place parabolic mirror handles on the reflective side of the curve. */
export const PARABOLIC_MIRROR_HANDLE_OFFSET_M = 0.02;

export const IDEAL_MIRROR_LINE_WIDTH = 3;
export const IDEAL_MIRROR_TICK_LINE_WIDTH = 1.5;
export const IDEAL_MIRROR_TICK_LENGTH_M = 0.06;
export const IDEAL_MIRROR_TICK_COUNT = 5;

// ── 9. Glass / lens rendering ─────────────────────────────────────────────────

export const IDEAL_LENS_LINE_WIDTH = 3;
export const IDEAL_LENS_ARROW_SIZE_M = 0.1;
/** arrowPath lineWidth = IDEAL_LENS_LINE_WIDTH * this factor. */
export const IDEAL_LENS_ARROW_WIDTH_FACTOR = 0.75;
/** Arrowhead arm cross-width = IDEAL_LENS_ARROW_SIZE_M * this factor. */
export const IDEAL_LENS_ARROW_ARM_FACTOR = 0.5;

/** Stroke width for circle-glass and polygon-glass outlines. */
export const GLASS_STROKE_WIDTH = 1.5;

/** Radius (px) of add-vertex button on prism edges. */
export const PRISM_EDGE_ADD_RADIUS = 5;
/** Radius (px) of remove-vertex button on prism handles. */
export const PRISM_VERTEX_REMOVE_RADIUS = 4;

export const HALF_PLANE_BORDER_WIDTH = 2;
export const HALF_PLANE_HATCH_WIDTH = 1;
export const HATCH_SPACING_M = 0.2;
export const HATCH_DEPTH_M = 0.18;
export const HATCH_COUNT = 8;

export const SPHERICAL_FOCAL_MARKER_SIZE_M = 0.03;
/** Minimum path.length for a fully-built spherical lens. */
export const SPHERICAL_MIN_VERTEX_COUNT = 6;
/** Minimum lens thickness in metres. */
export const SPHERICAL_MIN_THICKNESS_M = 0.02;

// Rotation handle (spherical lens) ────────────────────────────────────────────
export const ROTATION_HANDLE_RADIUS = 8; // px – slightly larger than standard handle
export const ROTATION_INDICATOR_RADIUS = 14; // px – curved-arrow orbit radius
export const ROTATION_INDICATOR_LINE_WIDTH = 1.5;
export const ROTATION_INDICATOR_ARROW_SIZE = 4; // px – arrowhead arm length

// ── 10. Light-source rendering ────────────────────────────────────────────────

/** Brightness clamping bounds used by all light-source arm drag interactions. */
export const BRIGHTNESS_CLAMP_MIN = 0.01;
export const BRIGHTNESS_CLAMP_MAX = 1.0;

/** Line width for brightness/direction indicator arms (shared). */
export const SOURCE_ARM_LINE_WIDTH = 1;
/** Stroke width for the central glow disc circle (point & arc sources). */
export const SOURCE_GLOW_STROKE_WIDTH = 2;

// Point source ────────────────────────────────────────────────────────────────
export const POINT_SOURCE_GLOW_RADIUS_PX = 14;
export const POINT_SOURCE_SPOKE_LINE_WIDTH = 1.2;
export const POINT_SOURCE_SPOKE_COUNT = 12;
export const POINT_SOURCE_SPOKE_OUTER_PX = 26;
/** Fixed direction (NE diagonal) for the brightness drag arm. */
export const POINT_SOURCE_BRIGHTNESS_ANGLE = -Math.PI / 4;
export const POINT_SOURCE_BRIGHTNESS_ARM_MIN_M = 0.32;
export const POINT_SOURCE_BRIGHTNESS_ARM_MAX_M = 0.82;

// Beam source ─────────────────────────────────────────────────────────────────
export const BEAM_SOURCE_SHIELD_WIDTH = 6;
export const BEAM_SOURCE_BEAM_WIDTH = 3;
export const BEAM_SOURCE_DIV_LINE_WIDTH = 1.2;
export const BEAM_SOURCE_DIV_ARM_LENGTH_M = 0.8;
export const BEAM_SOURCE_BRIGHTNESS_ARM_MIN_M = 0.2;
export const BEAM_SOURCE_BRIGHTNESS_ARM_MAX_M = 0.72;
export const BEAM_SOURCE_EMIS_HANDLE_DIST_M = 0.55;
/** Minimum projected distance before computing emission-angle from drag. */
export const BEAM_SOURCE_MIN_REF_DIST = 1e-6;
export const BEAM_SOURCE_MAX_EMISSION_DEG = 90;
/** emisAngle below this threshold suppresses the divergence-indicator lines. */
export const BEAM_SOURCE_MIN_EMISSION_THRESHOLD = 1e-4;

// Arc light source ────────────────────────────────────────────────────────────
export const ARC_SOURCE_RIM_RADIUS_M = 0.4;
export const ARC_SOURCE_GLOW_RADIUS_PX = 12;
export const ARC_SOURCE_SECTOR_LINE_WIDTH = 1.5;
export const ARC_SOURCE_RIM_LINE_WIDTH = 1;
export const ARC_SOURCE_BOUNDARY_LINE_WIDTH = 1.2;
export const ARC_SOURCE_SPOKE_LINE_WIDTH = 1.1;
export const ARC_SOURCE_SPOKE_COUNT = 12;
export const ARC_SOURCE_SECTOR_SAMPLE_N = 48;
/** emissionAngle gap below 2π that still counts as a full circle. */
export const ARC_SOURCE_FULL_CIRCLE_GAP = 1e-4;
/** Pixel inset from view-rim to spoke outer endpoint. */
export const ARC_SOURCE_SPOKE_OUTER_OFFSET_PX = 4;
export const ARC_SOURCE_MIN_SPOKE_COUNT = 2;
export const ARC_SOURCE_MIN_EMISSION_ANGLE = 0.01;

// Continuous-spectrum source ──────────────────────────────────────────────────
export const CONT_SPECTRUM_RADIUS_PX = 9;
export const CONT_SPECTRUM_STROKE_WIDTH = 2.5;
export const CONT_SPECTRUM_DIR_LINE_WIDTH = 1.5;
export const CONT_SPECTRUM_ARROW_LINE_WIDTH = 1.5;
export const CONT_SPECTRUM_ARROW_ARM_M = 0.1;
/** Arrowhead cross-width = CONT_SPECTRUM_ARROW_ARM_M * this factor. */
export const CONT_SPECTRUM_ARROW_ARM_FACTOR = 0.4;
/** Wavelengths sampled for the rainbow disc and icon (nm). */
export const CONT_SPECTRUM_SAMPLE_WL = [380, 440, 490, 530, 580, 625, 700] as const;

// Single-ray source ───────────────────────────────────────────────────────────
export const SINGLE_RAY_ORIGIN_RADIUS_PX = 9;
export const SINGLE_RAY_ORIGIN_STROKE_WIDTH = 2;
export const SINGLE_RAY_DIR_LINE_WIDTH = 1.5;
export const SINGLE_RAY_ARROW_LINE_WIDTH = 1.5;
export const SINGLE_RAY_ARROW_ARM_M = 0.1;
export const SINGLE_RAY_BRIGHTNESS_ARM_MIN_M = 0.22;
export const SINGLE_RAY_BRIGHTNESS_ARM_MAX_M = 0.66;
/** Arrowhead cross-width = SINGLE_RAY_ARROW_ARM_M * this factor. */
export const SINGLE_RAY_ARROW_ARM_FACTOR = 0.4;

// ─────────────────────────────────────────────────────────────────────────────

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
