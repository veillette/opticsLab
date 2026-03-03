/**
 * EditContainerNode.ts
 *
 * A panel shown at the bottom of the screen whenever an optical element is
 * selected. Displays numeric property controls appropriate to the element type
 * and a Delete button.
 *
 * Design notes
 * ─────────────
 * • The panel content is rebuilt from scratch each time the selected element
 *   changes (kept simple because the element set is small).
 * • Controls read `_rebuildViewCallback` lazily at change-time so that
 *   SimScreenView can supply the callback after selection is triggered.
 */

import { NumberProperty, type Property } from "scenerystack/axon";
import { type Bounds2, Dimension2, Range } from "scenerystack/dot";
import { HBox, Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl, TrashButton } from "scenerystack/scenery-phet";
import { FlatAppearanceStrategy, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import {
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  DIVERGENCE_MAX_DEG,
  DIVERGENCE_MIN_DEG,
  EMISSION_ANGLE_MAX_DEG,
  EMISSION_ANGLE_MIN_DEG,
  FOCAL_LENGTH_MAX_M,
  FOCAL_LENGTH_MIN_M,
  PANEL_BOTTOM_MARGIN,
  PANEL_CONTENT_SPACING,
  PANEL_CORNER_RADIUS,
  PANEL_X_MARGIN,
  PANEL_Y_MARGIN,
  REFRACTIVE_INDEX_MAX,
  REFRACTIVE_INDEX_MIN,
  SLIDER_THUMB_HEIGHT,
  SLIDER_THUMB_WIDTH,
  SLIDER_TRACK_HEIGHT,
  SLIDER_TRACK_WIDTH,
  SPHERICAL_R1_FALLBACK,
  SPHERICAL_R2_FALLBACK,
  SPHERICAL_RADIUS_MAX,
  SPHERICAL_RADIUS_MIN,
  TITLE_ROW_SPACING,
  WAVELENGTH_MAX_NM,
  WAVELENGTH_MIN_NM,
} from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import { BaseGlass } from "../model/glass/BaseGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { SphericalLens } from "../model/glass/SphericalLens.js";
import { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import { BeamSource } from "../model/light-sources/BeamSource.js";
import { PointSourceElement } from "../model/light-sources/PointSourceElement.js";
import { SingleRaySource } from "../model/light-sources/SingleRaySource.js";
import { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const SLIDER_TRACK_SIZE = new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT);
const SLIDER_THUMB_SIZE = new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT);

const LABEL_FONT = "11px sans-serif";
const TITLE_FONT = "bold 12px sans-serif";
const LABEL_FILL = "#bbb";
const TITLE_FILL = "#eee";

const PANEL_FILL = "rgba(25, 25, 45, 0.92)";
const PANEL_STROKE = "rgba(120, 120, 140, 1)";

const DELETE_BASE_COLOR = "#883333";

// Human-readable labels for each element type string
const TYPE_LABELS: Partial<Record<string, string>> = {
  ArcSource: "Arc Source",
  PointSource: "Point Source",
  Beam: "Beam Source",
  SingleRay: "Single Ray",
  IdealLens: "Ideal Lens",
  IdealMirror: "Ideal Mirror",
  SphericalLens: "Spherical Lens",
  CircleGlass: "Circle Glass",
  Glass: "Glass (Prism)",
  HalfPlane: "Half-Plane Glass",
  SegmentMirror: "Flat Mirror",
  ArcMirror: "Arc Mirror",
  ParabolicMirror: "Parabolic Mirror",
  BeamSplitter: "Beam Splitter",
  LineBlocker: "Line Blocker",
  CircleBlocker: "Circle Blocker",
  Aperture: "Aperture",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Clamp a number to a range, replacing non-finite values with a fallback. */
function safeClamp(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

/** Number of decimal places to show for a given step size. */
function decimalPlacesForDelta(delta: number): number {
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
 *
 * @param label        - text shown as the control title
 * @param initValue    - starting value (clamped to range)
 * @param range        - allowed value range
 * @param delta        - keyboard / arrow-button step size; also determines decimal places shown
 * @param onSet        - called with the new value when the control changes
 * @param onAfterSet   - called after onSet (use to trigger view rebuild / ray re-trace)
 */
function makeControl(
  label: string,
  initValue: number,
  range: Range,
  delta: number,
  onSet: (v: number) => void,
  onAfterSet: () => void,
): Node {
  const clampedInit = Math.max(range.min, Math.min(range.max, initValue));
  const prop = new NumberProperty(clampedInit, { range, tandem: Tandem.OPT_OUT });

  // Use lazyLink so the link fires only on subsequent changes, not at creation.
  prop.lazyLink((v) => {
    onSet(v);
    onAfterSet();
  });

  return new NumberControl(label, prop, range, {
    delta,
    includeArrowButtons: false,
    soundGenerator: null,
    layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
    titleNodeOptions: {
      fill: LABEL_FILL,
      font: LABEL_FONT,
    },
    numberDisplayOptions: {
      decimalPlaces: decimalPlacesForDelta(delta),
      textOptions: { fill: TITLE_FILL, font: LABEL_FONT },
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

// ── EditContainerNode ────────────────────────────────────────────────────────

export class EditContainerNode extends Node {
  /**
   * Callback set by SimScreenView after an element is selected so that
   * controls can trigger a visual rebuild of the element's view.
   * Read lazily at value-change time (after the link callback has run).
   */
  private _rebuildViewCallback: (() => void) | null = null;

  private readonly _layoutBounds: Bounds2;

  public constructor(
    selectedElementProperty: Property<OpticalElement | null>,
    onDelete: (element: OpticalElement) => void,
    layoutBounds: Bounds2,
  ) {
    super();

    this._layoutBounds = layoutBounds;
    this.visible = false;

    selectedElementProperty.link((element) => {
      // Reset the callback whenever the selection changes.
      this._rebuildViewCallback = null;
      this._renderFor(element, onDelete);
    });
  }

  /**
   * Called by SimScreenView immediately after setting selectedElementProperty
   * so that control onChange callbacks can trigger a visual rebuild.
   */
  public setViewRebuildCallback(callback: (() => void) | null): void {
    this._rebuildViewCallback = callback;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _renderFor(element: OpticalElement | null, onDelete: (e: OpticalElement) => void): void {
    this.removeAllChildren();

    if (!element) {
      this.visible = false;
      return;
    }

    this.visible = true;

    // Lazily reads _rebuildViewCallback at control-change time.
    const triggerRebuild = (): void => {
      this._rebuildViewCallback?.();
    };

    // ── Title row ──────────────────────────────────────────────────────────
    const typeLabel = TYPE_LABELS[element.type] ?? element.type;
    const titleText = new Text(typeLabel, { font: TITLE_FONT, fill: TITLE_FILL });

    const deleteBtn = new TrashButton({
      listener: () => onDelete(element),
      baseColor: DELETE_BASE_COLOR,
      iconOptions: { fill: "#fff" },
      buttonAppearanceStrategy: FlatAppearanceStrategy,
      tandem: Tandem.OPT_OUT,
    });

    const titleRow = new HBox({
      spacing: TITLE_ROW_SPACING,
      align: "center",
      children: [titleText, deleteBtn],
    });

    // ── Type-specific controls ─────────────────────────────────────────────
    const controls: Node[] = this._buildControls(element, triggerRebuild);

    // ── Assemble panel ─────────────────────────────────────────────────────
    const content = new VBox({
      spacing: PANEL_CONTENT_SPACING,
      align: "left",
      children: [titleRow, ...controls],
    });

    const panel = new Panel(content, {
      fill: PANEL_FILL,
      stroke: PANEL_STROKE,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
    });

    this.addChild(panel);

    // Position at bottom-center of the play area.
    panel.centerX = this._layoutBounds.centerX;
    panel.bottom = this._layoutBounds.maxY - PANEL_BOTTOM_MARGIN;
  }

  private _buildControls(element: OpticalElement, triggerRebuild: () => void): Node[] {
    const controls: Node[] = [];

    // ── Light Sources ─────────────────────────────────────────────────────
    if (element instanceof ArcLightSource) {
      controls.push(
        makeControl(
          "Brightness",
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeControl(
          "Wavelength (nm)",
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
          1,
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
        makeControl(
          "Emission Angle (°)",
          element.emissionAngle * (180 / Math.PI),
          new Range(EMISSION_ANGLE_MIN_DEG, EMISSION_ANGLE_MAX_DEG),
          1,
          (v) => {
            element.emissionAngle = v * (Math.PI / 180);
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof PointSourceElement) {
      controls.push(
        makeControl(
          "Brightness",
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeControl(
          "Wavelength (nm)",
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
          1,
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof BeamSource) {
      controls.push(
        makeControl(
          "Brightness",
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeControl(
          "Wavelength (nm)",
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
          1,
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
        makeControl(
          "Divergence (°)",
          element.emisAngle,
          new Range(DIVERGENCE_MIN_DEG, DIVERGENCE_MAX_DEG),
          1,
          (v) => {
            element.emisAngle = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof SingleRaySource) {
      controls.push(
        makeControl(
          "Brightness",
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeControl(
          "Wavelength (nm)",
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
          1,
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
      );

      // ── Glass / Lenses ────────────────────────────────────────────────────
    } else if (element instanceof SphericalLens) {
      const { r1, r2 } = element.getDR1R2();
      const R_RANGE = new Range(SPHERICAL_RADIUS_MIN, SPHERICAL_RADIUS_MAX);

      controls.push(
        makeControl(
          "R₁ (left surface)",
          safeClamp(r1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK),
          R_RANGE,
          0.1,
          (v) => {
            const { d, r2: cr2 } = element.getDR1R2();
            element.createLensWithDR1R2(d, v, cr2);
          },
          triggerRebuild,
        ),
        makeControl(
          "R₂ (right surface)",
          safeClamp(r2, R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK),
          R_RANGE,
          0.1,
          (v) => {
            const { d, r1: cr1 } = element.getDR1R2();
            element.createLensWithDR1R2(d, cr1, v);
          },
          triggerRebuild,
        ),
        makeControl(
          "Ref. Index",
          element.refIndex,
          new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
          0.05,
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof IdealLens) {
      controls.push(
        makeControl(
          "Focal Length (m)",
          element.focalLength,
          new Range(FOCAL_LENGTH_MIN_M, FOCAL_LENGTH_MAX_M),
          0.1,
          (v) => {
            element.focalLength = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof BaseGlass) {
      // Covers CircleGlass, HalfPlaneGlass, Glass (prism)
      controls.push(
        makeControl(
          "Ref. Index",
          element.refIndex,
          new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
          0.05,
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
        ),
      );

      // ── Mirrors ───────────────────────────────────────────────────────────
    } else if (element instanceof IdealCurvedMirror) {
      controls.push(
        makeControl(
          "Focal Length (m)",
          element.focalLength,
          new Range(FOCAL_LENGTH_MIN_M, FOCAL_LENGTH_MAX_M),
          0.1,
          (v) => {
            element.focalLength = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof BeamSplitterElement) {
      controls.push(
        makeControl(
          "Transmission ratio",
          element.transRatio,
          new Range(0, 1),
          0.05,
          (v) => {
            element.transRatio = v;
          },
          triggerRebuild,
        ),
      );
    }

    return controls;
  }
}

opticsLab.register("EditContainerNode", EditContainerNode);
