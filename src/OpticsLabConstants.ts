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

/** Default spacing between grid lines, in model metres. */
export const GRID_SPACING_M = 1;

/** Minimum allowed grid spacing (model metres). */
export const GRID_SPACING_MIN_M = 0.1;

/** Maximum allowed grid spacing (model metres). */
export const GRID_SPACING_MAX_M = 2.0;

/**
 * Fraction of a grid cell within which a dragged element snaps to the
 * nearest grid line.  0.35 means snap triggers within ±35 % of spacing.
 */
export const GRID_SNAP_THRESHOLD_FRACTION = 0.35;

/** Snap threshold in model metres (derived from spacing × fraction). */
export const GRID_SNAP_THRESHOLD_M = GRID_SPACING_M * GRID_SNAP_THRESHOLD_FRACTION;

// ── 2b. Track snap ───────────────────────────────────────────────────────────

/** Perpendicular distance (model metres) within which an element snaps to a track. */
export const TRACK_SNAP_DISTANCE_M = 0.15;
/** Perpendicular distance (model metres) beyond which a snapped element breaks free. */
export const TRACK_BREAK_DISTANCE_M = 0.3;

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
export const RAY_DENSITY_MAX = 2.0;
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
/** Dash pattern for extension (virtual) rays: [dash, gap] in px. */
export const EXT_LINE_DASH = [4, 4];
/** brightness → alpha multiplier for forward rays. */
export const RAY_ALPHA_SCALE = 1.2;
/** brightness → alpha multiplier for extension rays. */
export const EXT_ALPHA_SCALE = 0.35;
/** Alpha below which a segment is skipped entirely. */
export const RAY_ALPHA_SKIP = 0.005;
/** Margin (px) around canvas bounds for clipping — avoids visible pop-in at edges. */
export const RAY_CLIP_MARGIN_PX = 50;
/** Number of alpha buckets for batching draw calls (→ alpha granularity = 1/n). */
export const RAY_ALPHA_BUCKETS = 20;
/** Distance threshold (pixels) for image-convergence grid quantization. */
export const RAY_CONVERGENCE_THRESHOLD = 5;

// ── 5. Edit-panel UI ──────────────────────────────────────────────────────────

export const PANEL_BOTTOM_MARGIN = 10;
export const PANEL_X_MARGIN = 12;
export const PANEL_Y_MARGIN = 8;

export const SLIDER_TRACK_WIDTH = 75;
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
/** Minimum radius-of-curvature magnitude for constrained (symmetric/plano) lens sliders. */
export const CONSTRAINED_LENS_RADIUS_MIN = 0.5;

export const REFRACTIVE_INDEX_MIN = 1;
export const REFRACTIVE_INDEX_MAX = 3;

export const ARC_MIRROR_RADIUS_MIN = 0.1;
export const ARC_MIRROR_RADIUS_MAX = 20;

/** Curvature display (κ = 1/R) slider ranges, in m⁻¹. */
export const ARC_MIRROR_CURVATURE_MIN = 0.05; // = 1/ARC_MIRROR_RADIUS_MAX
export const ARC_MIRROR_CURVATURE_MAX = 10; // = 1/ARC_MIRROR_RADIUS_MIN
/** Curvature range for symmetric/plano lenses whose magnitude is constrained ≥ 0.5 m. */
export const CONSTRAINED_CURVATURE_MIN = 0.05; // = 1/SPHERICAL_RADIUS_MAX
export const CONSTRAINED_CURVATURE_MAX = 2; // = 1/CONSTRAINED_LENS_RADIUS_MIN
/** Curvature range for the general SphericalLens (signed). */
export const SPHERICAL_CURVATURE_MIN = -10; // m⁻¹
export const SPHERICAL_CURVATURE_MAX = 10; // m⁻¹

/** Focal-length slider bounds in metres (displayed; stored as ×100 in model). */
export const FOCAL_LENGTH_MIN_M = -3;
export const FOCAL_LENGTH_MAX_M = 3;

/** Length slider bounds for line-segment elements (blocker, flat mirror, ideal lens/mirror). */
export const SEGMENT_LENGTH_MIN = 0.1;
export const SEGMENT_LENGTH_MAX = 5.0;

// ── 7. Drag handles ───────────────────────────────────────────────────────────

export const HANDLE_RADIUS = 6; // px – fixed visual size
export const HANDLE_LINE_WIDTH = 1.5;
/** Half-width (px) of the invisible filled rectangle used as the drag target for line-segment elements. */
export const LINE_HIT_HALF_WIDTH_PX = 10;

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

/** Size of the focal-point diamond marker on mirrors (model metres, half-side). */
export const MIRROR_FOCAL_MARKER_SIZE_M = 0.04;

/** Half-length of the alignment dash line drawn at the midpoint of ideal lens/mirror (model metres). */
export const ALIGNMENT_MARK_HALF_LENGTH_M = 0.12;
/** Line width for the alignment dash mark. */
export const ALIGNMENT_MARK_LINE_WIDTH = 1;
/** Dash pattern [dash, gap] in view pixels for the alignment mark. */
export const ALIGNMENT_MARK_LINE_DASH = [4, 3];

// ── 9. Glass / lens rendering ─────────────────────────────────────────────────

export const IDEAL_LENS_LINE_WIDTH = 3;
export const IDEAL_LENS_ARROW_SIZE_M = 0.2;
/** arrowPath lineWidth = IDEAL_LENS_LINE_WIDTH * this factor. */
export const IDEAL_LENS_ARROW_WIDTH_FACTOR = 1.5;
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
/** Distance (px) the boundary line extends beyond the handles on each end. */
export const HALF_PLANE_LINE_EXTEND_PX = 5000;
/** Distance (px) the glass-side fill extends from the boundary. */
export const HALF_PLANE_GLASS_DEPTH_PX = 5000;
export const HATCH_SPACING_M = 0.2;
export const HATCH_DEPTH_M = 0.18;
export const HATCH_COUNT = 8;

export const SPHERICAL_FOCAL_MARKER_SIZE_M = 0.03;
/** Minimum path.length for a fully-built spherical lens. */
export const SPHERICAL_MIN_VERTEX_COUNT = 6;
/** Minimum lens thickness in metres. */
export const SPHERICAL_MIN_THICKNESS_M = 0.02;
/** Minimum optical-axis separation between arc apices (m); prevents curvature handle crossing. */
export const SPHERICAL_CURVATURE_D_MIN = 0.005;
/** Half-extent used when searching for aperture boundary points (model units). */
export const SPHERICAL_LENS_APERTURE_SEARCH_HALF_EXTENT = 10;

// Rotation handle (spherical lens) ────────────────────────────────────────────
export const ROTATION_HANDLE_RADIUS = 8; // px – slightly larger than standard handle
export const ROTATION_INDICATOR_RADIUS = 14; // px – curved-arrow orbit radius
export const ROTATION_INDICATOR_LINE_WIDTH = 1.5;
export const ROTATION_INDICATOR_ARROW_SIZE = 4; // px – arrowhead arm length
/** Start angle (rad) of the curved rotation-indicator arc (−135°). */
export const ROTATION_INDICATOR_START_ANGLE = -Math.PI * 0.75;
/** End angle (rad) of the curved rotation-indicator arc (+135°). */
export const ROTATION_INDICATOR_END_ANGLE = Math.PI * 0.75;
/** Half-spread angle (rad) between the two arrowhead arms. */
export const ROTATION_INDICATOR_ARROW_SPREAD = 0.5;

// Typed prism drag constraints ─────────────────────────────────────────────────
/** Minimum allowed distance from centroid to any vertex (model metres). */
export const PRISM_MIN_VERTEX_DIST_M = 0.05;
/** Minimum top-face width of a Dove prism (width − height, model metres). */
export const DOVE_MIN_TOP_FACE_M = 0.05;
/** Distance threshold below which a vertex position is considered degenerate (model metres). */
export const PRISM_DEGENERATE_DIST = 1e-10;
/** Drag-delta magnitude below which a rotation drag move is ignored (model metres). */
export const ROTATION_DRAG_DELTA_MIN = 1e-12;

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

// ── 12. Grating rendering ────────────────────────────────────────────────────

export const GRATING_LINES_DENSITY_MIN = 1;
export const GRATING_LINES_DENSITY_MAX = 2500;
export const GRATING_DUTY_CYCLE_MIN = 0.01;
export const GRATING_DUTY_CYCLE_MAX = 0.99;

/** Number of groove ticks drawn on the transmission grating visual. */
export const TRANSMISSION_GRATING_TICK_COUNT = 12;
/** Half-length of each tick mark in pixels. */
export const TRANSMISSION_GRATING_TICK_HALF_PX = 4;
/** Number of groove hatch marks drawn on the reflection grating visual. */
export const REFLECTION_GRATING_GROOVE_COUNT = 14;
/** Length of each groove hatch mark in pixels. */
export const REFLECTION_GRATING_GROOVE_LENGTH_PX = 6;

/** Default groove density for new gratings (lines / mm). */
export const GRATING_DEFAULT_LINES_DENSITY = 600;
/** Default wavelength (nm) used when a grating ray carries no wavelength. */
export const GRATING_DEFAULT_WAVELENGTH_NM = 532;
/** Maximum diffraction order to compute. */
export const GRATING_MAX_DIFFRACTION_ORDER = 10;

// ── 13. Apertured Parabolic Mirror ───────────────────────────────────────────

/** Default half-width (m) of the central aperture for new AperturedParabolicMirror instances. */
export const APERTURED_MIRROR_APERTURE_DEFAULT_M = 0.15;
/** Minimum aperture half-width (m) for the slider. */
export const APERTURED_MIRROR_APERTURE_MIN_M = 0.0;
/** Maximum aperture half-width (m) for the slider. */
export const APERTURED_MIRROR_APERTURE_MAX_M = 0.5;

// ── 14. Detector ─────────────────────────────────────────────────────────────

export const DETECTOR_CHART_WIDTH = 200;
export const DETECTOR_CHART_HEIGHT = 120;
/** Default number of histogram bins for the detector irradiance chart. */
export const DETECTOR_NUM_BINS = 50;
/** Minimum allowed bin count for the detector histogram slider. */
export const DETECTOR_BINS_MIN = 5;
/** Maximum allowed bin count for the detector histogram slider. */
export const DETECTOR_BINS_MAX = 200;
/** Duration (seconds) of a single acquisition pass. */
export const ACQUISITION_DURATION_S = 2.0;
/** Number of extra model-only simulation passes per animation frame during acquisition. */
export const ACQUISITION_PASSES_PER_FRAME = 100;
/** Initial horizontal offset (px) of the floating chart from the detector midpoint. */
export const DETECTOR_INITIAL_CHART_OFFSET_X = 200;
/** Controls the Bézier bulge of the wire connecting detector to chart. */
export const DETECTOR_WIRE_NORMAL_MAGNITUDE = 40;

// ── 14. Glass model defaults ─────────────────────────────────────────────────

export const SLAB_GLASS_DEFAULT_WIDTH_M = 0.84;
export const SLAB_GLASS_DEFAULT_HEIGHT_M = 0.3;
export const DOVE_PRISM_DEFAULT_WIDTH_M = 0.78;
export const DOVE_PRISM_DEFAULT_HEIGHT_M = 0.36;
export const EQUILATERAL_PRISM_DEFAULT_SIZE_M = 0.5;

// ── 15. ContinuousSpectrumSource defaults ────────────────────────────────────

export const CONT_SPECTRUM_DEFAULT_WL_MIN_NM = 380;
export const CONT_SPECTRUM_DEFAULT_WL_STEP_NM = 10;
export const CONT_SPECTRUM_DEFAULT_WL_MAX_NM = 700;
export const CONT_SPECTRUM_DEFAULT_BRIGHTNESS = 0.5;
/**
 * Scales per-ray alpha when drawing continuous-spectrum rays with additive
 * blending (`lighter`); keeps individual rays faint while overlaps read white.
 */
export const CONT_SPECTRUM_RAY_ALPHA_MULTIPLIER = 0.055;

// ── 16. Carousel ─────────────────────────────────────────────────────────────

/** Icon bounding box size (px) for carousel item icons. */
export const CAROUSEL_ICON_SIZE_PX = 40;
export const CAROUSEL_ITEMS_PER_PAGE = 6;
export const CAROUSEL_ITEM_SPACING = 10;
export const CAROUSEL_ITEM_MARGIN = 8;
export const CAROUSEL_CORNER_RADIUS = 8;
export const CAROUSEL_PAGE_CONTROL_DOT_RADIUS = 4;
export const CAROUSEL_PAGE_CONTROL_DOT_SPACING = 8;
/** Gap (px) between the left edge of the visible area and the page control. */
export const CAROUSEL_PAGE_CONTROL_MARGIN = 8;
/** Gap (px) between the page control right edge and the carousel left edge. */
export const CAROUSEL_OFFSET_FROM_PAGE_CONTROL = 6;
/** Default half-size (m) of newly created elements. */
export const CAROUSEL_DEFAULT_HALF_SIZE_M = 0.6;

// ── 17. SimScreenView / UI layout ────────────────────────────────────────────

export const PROTRACTOR_SCALE = 0.5;
export const RAY_DENSITY_DELTA = 0.05;
/** AccordionBox expand/collapse button x-margin. */
export const ACCORDION_BUTTON_X_MARGIN = 8;
/** AccordionBox expand/collapse button y-margin. */
export const ACCORDION_BUTTON_Y_MARGIN = 6;
/** AccordionBox spacing between title and content. */
export const ACCORDION_CONTENT_Y_SPACING = 6;
/** VBox spacing inside the accordion content. */
export const ACCORDION_CONTENT_SPACING = 8;

// ── 18. Keyboard shortcuts overlay ───────────────────────────────────────────

export const KEYBOARD_HELP_TEXT_MAX_WIDTH = 1000;
export const KEYBOARD_HELP_CORNER_RADIUS = 10;
/** Background panel dilation beyond content bounds (px). */
export const KEYBOARD_HELP_PANEL_DILATION = 20;

// ── 19. SymmetricWavelengthThumb ─────────────────────────────────────────────

/** Outline stroke width of the bowtie thumb shape. */
export const WAVELENGTH_THUMB_OUTLINE_WIDTH = 0.75;
/** Touch/mouse area dilation (px) on each axis for the wavelength thumb. */
export const WAVELENGTH_THUMB_HIT_AREA_DILATION = 4;

// ── 20. EditControlFactory ───────────────────────────────────────────────────

/** Step size for the wavelength (λ) number control. */
export const WAVELENGTH_CONTROL_DELTA = 1;
/** Step size for the grating lines-density number control. */
export const LINES_DENSITY_CONTROL_DELTA = 10;

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
