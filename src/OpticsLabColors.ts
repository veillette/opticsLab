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

  // ── Ideal optical elements ─────────────────────────────────────────────────
  idealMirrorStrokeProperty: profileColor("idealMirrorStroke", "#e8c000", "#c8a000"),
  idealMirrorTickStrokeProperty: profileColor("idealMirrorTickStroke", "#b89000", "#987000"),
  idealLensStrokeProperty: profileColor("idealLensStroke", "#44cc88", "#22aa66"),
  idealLensArrowStrokeProperty: profileColor("idealLensArrowStroke", "#ffee44", "#ddcc00"),
  alignmentMarkStrokeProperty: profileColor("alignmentMarkStroke", "rgba(255,255,255,0.55)", "rgba(0,0,0,0.40)"),

  // ── Glass / lens rendering ─────────────────────────────────────────────────
  glassFillProperty: profileColor("glassFill", "rgba(100, 180, 255, 0.22)", "rgba(60, 130, 210, 0.25)"),
  glassStrokeProperty: profileColor("glassStroke", "rgba(60, 130, 210, 0.8)", "rgba(60, 130, 210, 0.8)"),
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
  overlayValueFillProperty: profileColor("overlayValueFill", "#eee", "#111"),
  overlayInputBackgroundProperty: profileColor("overlayInputBackground", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.08)"),
  overlayInputBorderProperty: profileColor("overlayInputBorder", "rgba(100,100,120,0.6)", "rgba(100,100,120,0.6)"),
  deleteButtonBaseColorProperty: profileColor("deleteButtonBaseColor", "#883333", "#883333"),

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
};

opticsLab.register("OpticsLabColors", OpticsLabColors);

export default OpticsLabColors;
