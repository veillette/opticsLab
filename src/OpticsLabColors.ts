/**
 * OpticsLabColors.ts
 *
 * Central location for all colors used in the OpticsLab simulation, providing
 * support for different color profiles (default and projector mode).
 */

import { Color, ProfileColorProperty } from "scenerystack";
import opticsLab from "./OpticsLabNamespace.js";

// ── Base colors ───────────────────────────────────────────────────────────
const BLACK = new Color(0, 0, 0);
const WHITE = new Color(255, 255, 255);

// ── ProfileColorProperty factory ──────────────────────────────────────────
function profileColor(
  name: string,
  defaultColor: Color | string,
  projectorColor: Color | string,
): ProfileColorProperty {
  return new ProfileColorProperty(opticsLab, name, {
    default: defaultColor,
    projector: projectorColor,
  });
}

const OpticsLabColors = {
  // Background
  backgroundColorProperty: profileColor("backgroundColor", BLACK, WHITE),

  // Panels
  panelFillProperty: profileColor("panelFill", new Color(25, 25, 45, 0.95), new Color(245, 245, 250, 0.98)),
  panelStrokeProperty: profileColor("panelStroke", new Color(120, 120, 140), new Color(180, 180, 200)),

  // Preferences checkboxes
  checkboxPreferencesColorProperty: profileColor(
    "checkboxPreferencesColor",
    new Color(40, 40, 40),
    new Color(40, 40, 40),
  ),
  checkboxPreferencesColorBackgroundProperty: profileColor(
    "checkboxPreferencesColorBackground",
    new Color(200, 200, 220, 0.5),
    new Color(200, 200, 220, 0.5),
  ),
  controlPanelBackgroundColorProperty: profileColor(
    "controlPanelBackgroundColor",
    new Color(255, 255, 255, 0.9),
    new Color(255, 255, 255, 0.9),
  ),
  controlPanelBorderColorProperty: profileColor(
    "controlPanelBorderColor",
    new Color(150, 150, 150),
    new Color(150, 150, 150),
  ),
  controlPanelTextColorProperty: profileColor("controlPanelTextColor", new Color(30, 30, 30), new Color(30, 30, 30)),

  // Preferences dialog
  preferencesTextProperty: profileColor("preferencesText", BLACK, BLACK),
  preferencesTextSecondaryProperty: profileColor(
    "preferencesTextSecondary",
    new Color(102, 102, 102),
    new Color(80, 80, 80),
  ),

  // ── Drag handles ───────────────────────────────────────────────────────────
  handleFillProperty: profileColor("handleFill", "rgba(255, 255, 255, 0.88)", "rgba(0, 0, 0, 0.65)"),
  handleStrokeProperty: profileColor("handleStroke", "#333", "#333"),

  // ── Mirror rendering ───────────────────────────────────────────────────────
  mirrorBackStrokeProperty: profileColor("mirrorBackStroke", "#666", "#444"),
  mirrorFrontStrokeProperty: profileColor("mirrorFrontStroke", "#d8d8d8", "#d8d8d8"),
  beamSplitterBackStrokeProperty: profileColor(
    "beamSplitterBackStroke",
    "rgba(100, 90, 0, 0.5)",
    "rgba(100, 90, 0, 0.5)",
  ),
  beamSplitterFrontStrokeProperty: profileColor(
    "beamSplitterFrontStroke",
    "rgba(220, 200, 60, 0.85)",
    "rgba(220, 200, 60, 0.85)",
  ),
  beamSplitterIconBodyStrokeProperty: profileColor("beamSplitterIconBodyStroke", "#999", "#666"),

  // ── Blocker rendering ──────────────────────────────────────────────────────
  blockerBackStrokeProperty: profileColor("blockerBackStroke", "#555", "#333"),
  blockerFrontStrokeProperty: profileColor("blockerFrontStroke", "#222", "#111"),

  // ── Detector rendering ────────────────────────────────────────────────────
  detectorBackStrokeProperty: profileColor("detectorBackStroke", "#00696B", "#004D4F"),
  detectorFrontStrokeProperty: profileColor("detectorFrontStroke", "#00BCD4", "#008C9E"),
  detectorChartBackgroundProperty: profileColor(
    "detectorChartBackground",
    "rgba(0,30,40,0.85)",
    "rgba(230,240,245,0.9)",
  ),
  detectorChartBarFillProperty: profileColor("detectorChartBarFill", "#00E5FF", "#0097A7"),
  detectorTickStrokeProperty: profileColor("detectorTickStroke", "rgba(255,255,255,0.75)", "rgba(0,70,80,0.8)"),

  // ── Ideal optical elements ─────────────────────────────────────────────────
  idealMirrorStrokeProperty: profileColor("idealMirrorStroke", "#e8c000", "#c8a000"),
  idealMirrorTickStrokeProperty: profileColor("idealMirrorTickStroke", "#b89000", "#987000"),
  idealLensStrokeProperty: profileColor("idealLensStroke", "#44cc88", "#22aa66"),
  idealLensArrowStrokeProperty: profileColor("idealLensArrowStroke", "#ffee44", "#ddcc00"),
  alignmentMarkStrokeProperty: profileColor("alignmentMarkStroke", "rgba(255,255,255,0.55)", "rgba(0,0,0,0.40)"),

  // ── Glass / lens rendering ─────────────────────────────────────────────────
  glassFillProperty: profileColor("glassFill", "rgba(100, 180, 255, 0.22)", "rgba(60, 130, 210, 0.25)"),
  glassStrokeProperty: profileColor("glassStroke", "rgba(60, 130, 210, 0.8)", "rgba(60, 130, 210, 0.8)"),

  // ── Fiber optic rendering ──────────────────────────────────────────────────
  /** Warm amber fill for the inner core, suggesting guided light. */
  fiberCoreFillProperty: profileColor("fiberCoreFill", "rgba(255, 190, 50, 0.75)", "rgba(220, 150, 30, 0.80)"),
  fiberCoreStrokeProperty: profileColor("fiberCoreStroke", "rgba(200, 140, 20, 0.6)", "rgba(160, 100, 10, 0.6)"),
  glassHatchStrokeProperty: profileColor("glassHatchStroke", "rgba(60, 130, 210, 0.5)", "rgba(60, 130, 210, 0.5)"),
  prismAddFillProperty: profileColor("prismAddFill", "rgba(100, 220, 100, 0.9)", "rgba(100, 220, 100, 0.9)"),
  prismAddStrokeProperty: profileColor("prismAddStroke", "#2a7a2a", "#2a7a2a"),
  prismRemoveFillProperty: profileColor("prismRemoveFill", "rgba(255, 120, 120, 0.9)", "rgba(255, 120, 120, 0.9)"),
  prismRemoveStrokeProperty: profileColor("prismRemoveStroke", "#a03030", "#a03030"),

  // ── Spherical lens special handles ────────────────────────────────────────
  focalMarkerFillProperty: profileColor("focalMarkerFill", "rgb(255,0,255)", "rgb(180,0,180)"),
  rotationHandleFillProperty: profileColor("rotationHandleFill", "rgba(255, 200, 50, 0.9)", "rgba(255, 200, 50, 0.9)"),
  rotationHandleStrokeProperty: profileColor("rotationHandleStroke", "#996600", "#996600"),
  rotationIndicatorStrokeProperty: profileColor(
    "rotationIndicatorStroke",
    "rgba(150, 120, 0, 0.7)",
    "rgba(150, 120, 0, 0.7)",
  ),
  curvatureHandleFillProperty: profileColor(
    "curvatureHandleFill",
    "rgba(100, 220, 255, 0.9)",
    "rgba(100, 220, 255, 0.9)",
  ),
  curvatureHandleStrokeProperty: profileColor("curvatureHandleStroke", "#006090", "#006090"),

  // ── Arc / point light source ───────────────────────────────────────────────
  arcSourceGlowFillProperty: profileColor("arcSourceGlowFill", "rgba(255, 220, 80, 0.28)", "rgba(255, 220, 80, 0.28)"),
  arcSourceGlowStrokeProperty: profileColor(
    "arcSourceGlowStroke",
    "rgba(255, 220, 80, 0.90)",
    "rgba(255, 220, 80, 0.90)",
  ),
  arcSourceSectorFillProperty: profileColor(
    "arcSourceSectorFill",
    "rgba(255, 215, 60, 0.13)",
    "rgba(255, 215, 60, 0.13)",
  ),
  arcSourceSectorStrokeProperty: profileColor(
    "arcSourceSectorStroke",
    "rgba(255, 215, 60, 0.65)",
    "rgba(255, 215, 60, 0.65)",
  ),
  arcSourceRimStrokeProperty: profileColor(
    "arcSourceRimStroke",
    "rgba(255, 215, 60, 0.25)",
    "rgba(255, 215, 60, 0.25)",
  ),
  arcSourceBoundaryStrokeProperty: profileColor(
    "arcSourceBoundaryStroke",
    "rgba(255, 215, 60, 0.55)",
    "rgba(255, 215, 60, 0.55)",
  ),
  arcSourceSpokeStrokeProperty: profileColor(
    "arcSourceSpokeStroke",
    "rgba(255, 210, 60, 0.55)",
    "rgba(255, 210, 60, 0.55)",
  ),

  // ── Direction indicators (wavelength-independent sources) ──────────────────
  sourceDirLineStrokeProperty: profileColor("sourceDirLineStroke", "rgba(255,255,255,0.70)", "rgba(0,0,0,0.50)"),
  sourceDirArrowStrokeProperty: profileColor("sourceDirArrowStroke", "rgba(255,255,255,0.90)", "rgba(0,0,0,0.70)"),

  // ── Grid ───────────────────────────────────────────────────────────────────
  gridLineStrokeProperty: profileColor("gridLineStroke", "rgba(255,255,255,0.15)", "rgba(0,0,0,0.15)"),

  // ── Overlay UI (panels, labels on dark/light background) ──────────────────
  overlayLabelFillProperty: profileColor("overlayLabelFill", "#bbb", "#444"),
  comboBoxHighlightFillProperty: profileColor(
    "comboBoxHighlightFill",
    new Color(80, 100, 180, 0.55),
    new Color(60, 90, 200, 0.2),
  ),
  overlayValueFillProperty: profileColor("overlayValueFill", "#eee", "#111"),
  overlayInputBackgroundProperty: profileColor("overlayInputBackground", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.08)"),
  overlayInputBorderProperty: profileColor("overlayInputBorder", "rgba(100,100,120,0.6)", "rgba(100,100,120,0.6)"),
  deleteButtonBaseColorProperty: profileColor("deleteButtonBaseColor", "#883333", "#883333"),

  // ── Track (guide rail) ──────────────────────────────────────────────────────
  trackStrokeProperty: profileColor("trackStroke", "rgba(100, 200, 180, 0.55)", "rgba(60, 140, 120, 0.55)"),

  // ── Carousel ────────────────────────────────────────────────────────────────
  carouselSeparatorStrokeProperty: profileColor(
    "carouselSeparatorStroke",
    "rgba(120, 120, 140, 0.45)",
    "rgba(160, 160, 180, 0.45)",
  ),
  carouselButtonBaseColorProperty: profileColor(
    "carouselButtonBaseColor",
    "rgba(80, 80, 100, 0.6)",
    "rgba(200, 200, 220, 0.8)",
  ),
  carouselArrowStrokeProperty: profileColor("carouselArrowStroke", "#ccc", "#444"),
  carouselLabelFillProperty: profileColor("carouselLabelFill", "#ccc", "#444"),
  pageControlCurrentFillProperty: profileColor("pageControlCurrentFill", "#ccc", "#444"),
  pageControlInactiveFillProperty: profileColor(
    "pageControlInactiveFill",
    "rgba(180, 180, 200, 0.35)",
    "rgba(80, 80, 100, 0.35)",
  ),

  // ── Carousel icons ──────────────────────────────────────────────────────────
  iconRayStrokeProperty: profileColor("iconRayStroke", "#44ee66", "#22cc44"),
  pointSourceFillProperty: profileColor("pointSourceFill", "#ff8844", "#ff8844"),

  // ── Blocker fill ────────────────────────────────────────────────────────────
  blockerFillProperty: profileColor("blockerFill", "rgba(30, 30, 30, 0.5)", "rgba(30, 30, 30, 0.5)"),

  // ── Glass border (high-opacity stroke for half-plane boundary line) ─────────
  glassBorderStrokeProperty: profileColor("glassBorderStroke", "rgba(60, 130, 210, 0.95)", "rgba(60, 130, 210, 0.95)"),

  // ── Hit-area fill (invisible but non-null so Scenery includes it in hit-testing) ──
  /**
   * Nearly-transparent fill applied to invisible body-drag hit paths.
   * A non-zero alpha is required so Scenery includes the fill area in
   * containsPoint() — the path remains visually invisible.
   */
  hitAreaFillProperty: profileColor("hitAreaFill", "rgba(0,0,0,0.001)", "rgba(0,0,0,0.001)"),

  // ── Image overlay markers (real / virtual image positions) ─────────────────
  /** Base fill colour for real-image markers (yellow-orange). */
  imageRealFillBaseColorProperty: profileColor(
    "imageRealFillBase",
    "rgba(255, 200, 0, 0.85)",
    "rgba(200, 150, 0, 0.85)",
  ),
  /** Base stroke colour for real-image markers. */
  imageRealStrokeBaseColorProperty: profileColor("imageRealStrokeBase", "rgba(200, 150, 0, 1)", "rgba(150, 100, 0, 1)"),
  /** Label fill for real-image markers. */
  imageRealLabelFillProperty: profileColor("imageRealLabelFill", "rgba(255, 220, 80, 0.95)", "rgba(180, 130, 0, 0.95)"),
  /** Base stroke colour for virtual-object markers (red). */
  imageVirtualObjectStrokeBaseColorProperty: profileColor(
    "imageVirtualObjectStrokeBase",
    "rgba(255, 80, 80, 1)",
    "rgba(200, 40, 40, 1)",
  ),
  /** Label fill for virtual-object markers. */
  imageVirtualObjectLabelFillProperty: profileColor(
    "imageVirtualObjectLabelFill",
    "rgba(255, 100, 100, 0.95)",
    "rgba(200, 50, 50, 0.95)",
  ),
  /** Base stroke colour for virtual-image markers (cyan). */
  imageVirtualStrokeBaseColorProperty: profileColor(
    "imageVirtualStrokeBase",
    "rgba(0, 210, 255, 1)",
    "rgba(0, 150, 200, 1)",
  ),
  /** Label fill for virtual-image markers. */
  imageVirtualLabelFillProperty: profileColor(
    "imageVirtualLabelFill",
    "rgba(80, 210, 255, 0.95)",
    "rgba(0, 130, 180, 0.95)",
  ),

  // ── Measuring tape ──────────────────────────────────────────────────────────
  measuringTapeTextColorProperty: profileColor("measuringTapeTextColor", "white", "black"),
  measuringTapeBackgroundColorProperty: profileColor(
    "measuringTapeBackground",
    "rgba(0,0,0,0.65)",
    "rgba(255,255,255,0.65)",
  ),

  // ── Wavelength thumb outline ────────────────────────────────────────────────
  wavelengthThumbStrokeProperty: profileColor("wavelengthThumbStroke", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.55)"),

  // ── Observer node ──────────────────────────────────────────────────────────
  observerCircleStrokeProperty: profileColor(
    "observerCircleStroke",
    "rgba(255, 220, 80, 0.65)",
    "rgba(180, 140, 0, 0.80)",
  ),
  observerCircleFillProperty: profileColor(
    "observerCircleFill",
    "rgba(255, 220, 80, 0.06)",
    "rgba(255, 220, 80, 0.06)",
  ),
  observerDotFillProperty: profileColor("observerDotFill", "rgba(255, 220, 80, 0.9)", "rgba(180, 140, 0, 0.9)"),
  observerDotStrokeProperty: profileColor("observerDotStroke", "rgba(160, 120, 0, 1.0)", "rgba(160, 120, 0, 1.0)"),
  observerLabelFillProperty: profileColor("observerLabelFill", "rgba(255, 220, 80, 0.85)", "rgba(140, 100, 0, 0.90)"),
  observerRimFillProperty: profileColor("observerRimFill", "rgba(255, 220, 80, 0.55)", "rgba(180, 140, 0, 0.65)"),
  observerRimStrokeProperty: profileColor("observerRimStroke", "rgba(160, 120, 0, 0.9)", "rgba(160, 120, 0, 0.9)"),

  // ── Fiber optic carousel icon ─────────────────────────────────────────────
  /** Cladding fill used in the fiber-optic carousel icon (glass-blue, icon opacity). */
  fiberIconCladdingFillProperty: profileColor(
    "fiberIconCladdingFill",
    "rgba(100, 160, 255, 0.28)",
    "rgba(60, 100, 200, 0.28)",
  ),
  /** Cladding stroke used in the fiber-optic carousel icon. */
  fiberIconCladdingStrokeProperty: profileColor(
    "fiberIconCladdingStroke",
    "rgba(60, 130, 210, 0.75)",
    "rgba(60, 130, 210, 0.75)",
  ),
  /** Core fill used in the fiber-optic carousel icon (amber, icon opacity). */
  fiberIconCoreFillProperty: profileColor("fiberIconCoreFill", "rgba(255, 190, 50, 0.80)", "rgba(220, 150, 30, 0.85)"),
  /** Core stroke used in the fiber-optic carousel icon. */
  fiberIconCoreStrokeProperty: profileColor(
    "fiberIconCoreStroke",
    "rgba(200, 140, 20, 0.5)",
    "rgba(160, 100, 10, 0.5)",
  ),
};

opticsLab.register("OpticsLabColors", OpticsLabColors);

/**
 * Returns the fill color for any glass element, scaling opacity with the
 * refractive index so denser glass appears more opaque.
 * n=1 → ~0.05 (barely visible), n=3 → ~0.40
 */
export function glassFill(refIndex: number): string {
  const opacity = 0.05 + ((refIndex - 1.0) / 2.0) * 0.35;
  return `rgba(100, 160, 255, ${opacity.toFixed(3)})`;
}

/** @deprecated use glassFill */
export const halfPlaneGlassFill = glassFill;

export default OpticsLabColors;
