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

import { NumberProperty, type Property, type ReadOnlyProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type Bounds2, Dimension2, Range } from "scenerystack/dot";
import { HBox, Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl, TrashButton, WavelengthNumberControl } from "scenerystack/scenery-phet";
import { FlatAppearanceStrategy, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  ARC_MIRROR_RADIUS_MAX,
  ARC_MIRROR_RADIUS_MIN,
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
  SEGMENT_LENGTH_MAX,
  SEGMENT_LENGTH_MIN,
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
import type { SignConvention } from "../../preferences/OpticsLabPreferencesModel.js";
import { LineBlocker } from "../model/blockers/LineBlocker.js";
import { BaseGlass } from "../model/glass/BaseGlass.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { SphericalLens } from "../model/glass/SphericalLens.js";
import { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import { BeamSource } from "../model/light-sources/BeamSource.js";
import { PointSourceElement } from "../model/light-sources/PointSourceElement.js";
import { SingleRaySource } from "../model/light-sources/SingleRaySource.js";
import { ArcMirror } from "../model/mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import { SegmentMirror } from "../model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const SLIDER_TRACK_SIZE = new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT);
const SLIDER_THUMB_SIZE = new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT);

const LABEL_FONT = "11px sans-serif";
const TITLE_FONT = "bold 12px sans-serif";

// Human-readable labels for each element type string.
// Keys must match the `type` field on each model class.
function buildTypeLabels(): Partial<Record<string, TReadOnlyProperty<string>>> {
  const c = StringManager.getInstance().getComponentStrings();
  return {
    ArcSource: c.arcSourceStringProperty,
    PointSource: c.pointSourceStringProperty,
    Beam: c.beamSourceStringProperty,
    SingleRay: c.singleRayStringProperty,
    continuousSpectrumSource: c.continuousSpectrumStringProperty,
    IdealLens: c.idealLensStringProperty,
    IdealMirror: c.idealMirrorStringProperty,
    SphericalLens: c.sphericalLensStringProperty,
    CircleGlass: c.circleGlassStringProperty,
    Glass: c.glassPrismStringProperty,
    PlaneGlass: c.halfPlaneGlassStringProperty,
    Mirror: c.flatMirrorStringProperty,
    ArcMirror: c.arcMirrorStringProperty,
    ParabolicMirror: c.parabolicMirrorStringProperty,
    BeamSplitter: c.beamSplitterStringProperty,
    Blocker: c.lineBlockerStringProperty,
    Aperture: c.apertureStringProperty,
  };
}
const TYPE_LABELS = buildTypeLabels();

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
  label: string | ReadOnlyProperty<string>,
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
 * Build a WavelengthNumberControl with a spectrum-coloured slider track.
 */
function makeWavelengthControl(
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

  return new WavelengthNumberControl(prop, {
    range,
    tandem: Tandem.OPT_OUT,
    includeArrowButtons: false,
    soundGenerator: null,
    layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
    titleNodeOptions: {
      fill: OpticsLabColors.overlayLabelFillProperty,
      font: LABEL_FONT,
    },
    numberDisplayOptions: {
      textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: LABEL_FONT },
      backgroundFill: "rgba(0,0,0,0.35)",
      backgroundStroke: "rgba(100,100,120,0.6)",
    },
    spectrumSliderTrackOptions: { size: SLIDER_TRACK_SIZE },
    spectrumSliderThumbOptions: { width: SLIDER_THUMB_SIZE.width, height: SLIDER_THUMB_SIZE.height },
  });
}

/** Euclidean length of a two-point segment in model space. */
function segmentLength(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/** Resize a segment to newLength while keeping its centre and orientation fixed. */
function resizeSegment(
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

// ── EditContainerNode ────────────────────────────────────────────────────────

export class EditContainerNode extends Node {
  /**
   * Callback set by SimScreenView after an element is selected so that
   * controls can trigger a visual rebuild of the element's view.
   * Read lazily at value-change time (after the link callback has run).
   */
  private _rebuildViewCallback: (() => void) | null = null;

  /**
   * Set during _buildControls for elements whose geometry can change via
   * drag (e.g. ArcMirror).  Calling refresh() invokes this to push the
   * current model value back into the displayed NumberProperty.
   */
  private _refreshCallback: (() => void) | null = null;

  private readonly _visibleBoundsProperty: TReadOnlyProperty<Bounds2>;
  private _currentPanel: Panel | null = null;
  private readonly _signConventionProperty: TReadOnlyProperty<SignConvention>;

  public constructor(
    selectedElementProperty: Property<OpticalElement | null>,
    onDelete: (element: OpticalElement) => void,
    visibleBoundsProperty: TReadOnlyProperty<Bounds2>,
    signConventionProperty: TReadOnlyProperty<SignConvention>,
  ) {
    super();

    this._visibleBoundsProperty = visibleBoundsProperty;
    this._signConventionProperty = signConventionProperty;
    this.visible = false;

    // Track the current element so sign-convention changes can re-render it.
    let currentElement: OpticalElement | null = null;

    selectedElementProperty.link((element) => {
      currentElement = element;
      // Reset the callback whenever the selection changes.
      this._rebuildViewCallback = null;
      this._renderFor(element, onDelete);
    });

    // Re-render when the sign convention changes (affects SphericalLens R₂ display).
    signConventionProperty.lazyLink(() => {
      if (currentElement) {
        this._rebuildViewCallback = null;
        this._renderFor(currentElement, onDelete);
      }
    });

    // Reposition when the visible area changes (e.g. browser resize).
    visibleBoundsProperty.link(() => this._repositionPanel());
  }

  /**
   * Called by SimScreenView immediately after setting selectedElementProperty
   * so that control onChange callbacks can trigger a visual rebuild.
   */
  public setViewRebuildCallback(callback: (() => void) | null): void {
    this._rebuildViewCallback = callback;
  }

  /**
   * Push the current model state back into the displayed controls.
   * Called by views (e.g. ArcMirrorView) after a drag changes geometry.
   */
  public refresh(): void {
    this._refreshCallback?.();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _renderFor(element: OpticalElement | null, onDelete: (e: OpticalElement) => void): void {
    this.removeAllChildren();
    this._refreshCallback = null;

    if (!element) {
      this._currentPanel = null;
      this.visible = false;
      return;
    }

    this.visible = true;

    // Lazily reads _rebuildViewCallback at control-change time.
    const triggerRebuild = (): void => {
      this._rebuildViewCallback?.();
    };

    // ── Title row ──────────────────────────────────────────────────────────
    const typeLabel: TReadOnlyProperty<string> | string = TYPE_LABELS[element.type] ?? element.type;
    const titleText = new Text(typeLabel, { font: TITLE_FONT, fill: OpticsLabColors.overlayValueFillProperty });

    const deleteBtn = new TrashButton({
      listener: () => onDelete(element),
      baseColor: OpticsLabColors.deleteButtonBaseColorProperty,
      iconOptions: { fill: OpticsLabColors.overlayValueFillProperty },
      buttonAppearanceStrategy: FlatAppearanceStrategy,
      tandem: Tandem.OPT_OUT,
    });

    const titleRow = new HBox({
      spacing: TITLE_ROW_SPACING,
      align: "center",
      children: [titleText, deleteBtn],
    });

    // ── Type-specific controls ─────────────────────────────────────────────
    const controls: Node[] = this._buildControls(element, triggerRebuild, this._signConventionProperty.value);

    // ── Assemble panel ─────────────────────────────────────────────────────
    const content = new VBox({
      spacing: PANEL_CONTENT_SPACING,
      align: "left",
      children: [titleRow, ...controls],
    });

    const panel = new Panel(content, {
      fill: OpticsLabColors.panelFillProperty,
      stroke: OpticsLabColors.panelStrokeProperty,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
    });

    this.addChild(panel);
    this._currentPanel = panel;
    this._repositionPanel();
  }

  private _repositionPanel(): void {
    if (!this._currentPanel) {
      return;
    }
    const visibleBounds = this._visibleBoundsProperty.value;
    this._currentPanel.centerX = visibleBounds.centerX;
    this._currentPanel.bottom = visibleBounds.maxY - PANEL_BOTTOM_MARGIN;
  }

  private _buildControls(element: OpticalElement, triggerRebuild: () => void, signConvention: SignConvention): Node[] {
    const controls: Node[] = [];
    const ctrl = StringManager.getInstance().getControlStrings();

    // ── Light Sources ─────────────────────────────────────────────────────
    if (element instanceof ArcLightSource) {
      controls.push(
        makeControl(
          ctrl.brightnessStringProperty,
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeWavelengthControl(
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
        makeControl(
          ctrl.emissionAngleStringProperty,
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
          ctrl.brightnessStringProperty,
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeWavelengthControl(
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof BeamSource) {
      const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
      const lenProp = new NumberProperty(
        safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0),
        {
          range: L_RANGE,
          tandem: Tandem.OPT_OUT,
        },
      );
      let lenDriving = false;
      lenProp.lazyLink((v) => {
        lenDriving = true;
        const resized = resizeSegment(element.p1, element.p2, v);
        element.p1 = resized.p1;
        element.p2 = resized.p2;
        triggerRebuild();
        lenDriving = false;
      });
      this._refreshCallback = () => {
        if (lenDriving) {
          return;
        }
        lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      };
      controls.push(
        makeControl(
          ctrl.brightnessStringProperty,
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeWavelengthControl(
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
        makeControl(
          ctrl.divergenceStringProperty,
          element.emisAngle,
          new Range(DIVERGENCE_MIN_DEG, DIVERGENCE_MAX_DEG),
          1,
          (v) => {
            element.emisAngle = v;
          },
          triggerRebuild,
        ),
        new NumberControl(ctrl.heightStringProperty, lenProp, L_RANGE, {
          delta: 0.05,
          includeArrowButtons: false,
          soundGenerator: null,
          layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
          titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
          numberDisplayOptions: {
            decimalPlaces: 2,
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
        }),
      );
    } else if (element instanceof SingleRaySource) {
      controls.push(
        makeControl(
          ctrl.brightnessStringProperty,
          element.brightness,
          new Range(BRIGHTNESS_MIN, BRIGHTNESS_MAX),
          0.05,
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeWavelengthControl(
          element.wavelength,
          new Range(WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM),
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
      const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);

      // In Real-is-Positive mode, R₂ is negated for display: a biconvex lens
      // has R₁ > 0, R₂ > 0 (instead of R₁ > 0, R₂ < 0 in New Cartesian).
      const isRIP = signConvention === "realIsPositive";
      const r2Display = isRIP ? -r2 : r2;

      const r1Prop = new NumberProperty(safeClamp(r1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK), {
        range: R_RANGE,
        tandem: Tandem.OPT_OUT,
      });
      const r2Prop = new NumberProperty(safeClamp(r2Display, R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK), {
        range: R_RANGE,
        tandem: Tandem.OPT_OUT,
      });
      const lenProp = new NumberProperty(
        safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0),
        {
          range: L_RANGE,
          tandem: Tandem.OPT_OUT,
        },
      );

      let sliderDriving = false;
      r1Prop.lazyLink((v) => {
        sliderDriving = true;
        const { d, r2: cr2 } = element.getDR1R2();
        element.createLensWithDR1R2(d, v, cr2);
        triggerRebuild();
        sliderDriving = false;
      });
      r2Prop.lazyLink((v) => {
        sliderDriving = true;
        const { d, r1: cr1 } = element.getDR1R2();
        // In RIP mode the slider holds −R₂_model; invert before storing.
        const modelR2 = isRIP ? -v : v;
        element.createLensWithDR1R2(d, cr1, modelR2);
        triggerRebuild();
        sliderDriving = false;
      });
      lenProp.lazyLink((v) => {
        sliderDriving = true;
        const resized = resizeSegment(element.p1, element.p2, v);
        element.p1 = resized.p1;
        element.p2 = resized.p2;
        const { d, r1: cr1, r2: cr2 } = element.getDR1R2();
        element.createLensWithDR1R2(d, cr1, cr2);
        triggerRebuild();
        sliderDriving = false;
      });

      this._refreshCallback = () => {
        if (sliderDriving) {
          return;
        }
        const { r1: newR1, r2: newR2 } = element.getDR1R2();
        r1Prop.value = safeClamp(newR1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK);
        r2Prop.value = safeClamp(isRIP ? -newR2 : newR2, R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK);
        lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      };

      const r2Label = isRIP ? ctrl.r2RightRIPStringProperty : ctrl.r2RightSurfaceStringProperty;

      const curvatureControlOptions = {
        delta: 0.1,
        includeArrowButtons: false,
        soundGenerator: null,
        layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
        titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
        numberDisplayOptions: {
          decimalPlaces: 1,
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
      } as const;

      controls.push(
        new NumberControl(ctrl.r1LeftSurfaceStringProperty, r1Prop, R_RANGE, curvatureControlOptions),
        new NumberControl(r2Label, r2Prop, R_RANGE, curvatureControlOptions),
        new NumberControl(ctrl.lengthStringProperty, lenProp, L_RANGE, {
          delta: 0.05,
          includeArrowButtons: false,
          soundGenerator: null,
          layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
          titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
          numberDisplayOptions: {
            decimalPlaces: 2,
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
        }),
        makeControl(
          ctrl.refractiveIndexStringProperty,
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
      const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
      const lenProp = new NumberProperty(
        safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0),
        {
          range: L_RANGE,
          tandem: Tandem.OPT_OUT,
        },
      );
      let lenDriving = false;
      lenProp.lazyLink((v) => {
        lenDriving = true;
        const resized = resizeSegment(element.p1, element.p2, v);
        element.p1 = resized.p1;
        element.p2 = resized.p2;
        triggerRebuild();
        lenDriving = false;
      });
      this._refreshCallback = () => {
        if (lenDriving) {
          return;
        }
        lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      };
      controls.push(
        makeControl(
          ctrl.focalLengthStringProperty,
          element.focalLength,
          new Range(FOCAL_LENGTH_MIN_M, FOCAL_LENGTH_MAX_M),
          0.1,
          (v) => {
            element.focalLength = v;
          },
          triggerRebuild,
        ),
        new NumberControl(ctrl.lengthStringProperty, lenProp, L_RANGE, {
          delta: 0.05,
          includeArrowButtons: false,
          soundGenerator: null,
          layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
          titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
          numberDisplayOptions: {
            decimalPlaces: 2,
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
        }),
      );
    } else if (element instanceof CircleGlass) {
      controls.push(
        makeControl(
          ctrl.refractiveIndexStringProperty,
          element.refIndex,
          new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
          0.05,
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof HalfPlaneGlass || element instanceof BaseGlass) {
      // Covers HalfPlaneGlass, Glass (prism), and other BaseGlass subclasses
      controls.push(
        makeControl(
          ctrl.refractiveIndexStringProperty,
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
    } else if (element instanceof ArcMirror) {
      const R_RANGE = new Range(ARC_MIRROR_RADIUS_MIN, ARC_MIRROR_RADIUS_MAX);
      const currentRadius = safeClamp(
        element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
        R_RANGE.min,
        R_RANGE.max,
        ARC_MIRROR_RADIUS_MAX,
      );
      const radiusProp = new NumberProperty(currentRadius, { range: R_RANGE, tandem: Tandem.OPT_OUT });
      let sliderDriving = false;
      radiusProp.lazyLink((v) => {
        sliderDriving = true;
        element.setRadius(v);
        triggerRebuild();
        sliderDriving = false;
      });
      this._refreshCallback = () => {
        if (sliderDriving) {
          return;
        }
        const r = safeClamp(
          element.getRadius() ?? ARC_MIRROR_RADIUS_MAX,
          R_RANGE.min,
          R_RANGE.max,
          ARC_MIRROR_RADIUS_MAX,
        );
        radiusProp.value = r;
      };
      controls.push(
        new NumberControl(ctrl.radiusOfCurvatureStringProperty, radiusProp, R_RANGE, {
          delta: 0.1,
          includeArrowButtons: false,
          soundGenerator: null,
          layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
          titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
          numberDisplayOptions: {
            decimalPlaces: 1,
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
        }),
      );
    } else if (element instanceof IdealCurvedMirror) {
      const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
      const lenProp = new NumberProperty(
        safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0),
        {
          range: L_RANGE,
          tandem: Tandem.OPT_OUT,
        },
      );
      let lenDriving = false;
      lenProp.lazyLink((v) => {
        lenDriving = true;
        const resized = resizeSegment(element.p1, element.p2, v);
        element.p1 = resized.p1;
        element.p2 = resized.p2;
        triggerRebuild();
        lenDriving = false;
      });
      this._refreshCallback = () => {
        if (lenDriving) {
          return;
        }
        lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      };
      controls.push(
        makeControl(
          ctrl.focalLengthStringProperty,
          element.focalLength,
          new Range(FOCAL_LENGTH_MIN_M, FOCAL_LENGTH_MAX_M),
          0.1,
          (v) => {
            element.focalLength = v;
          },
          triggerRebuild,
        ),
        new NumberControl(ctrl.lengthStringProperty, lenProp, L_RANGE, {
          delta: 0.05,
          includeArrowButtons: false,
          soundGenerator: null,
          layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
          titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
          numberDisplayOptions: {
            decimalPlaces: 2,
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
        }),
      );
    } else if (element instanceof SegmentMirror || element instanceof LineBlocker) {
      const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
      const lenProp = new NumberProperty(
        safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0),
        {
          range: L_RANGE,
          tandem: Tandem.OPT_OUT,
        },
      );
      let lenDriving = false;
      lenProp.lazyLink((v) => {
        lenDriving = true;
        const resized = resizeSegment(element.p1, element.p2, v);
        element.p1 = resized.p1;
        element.p2 = resized.p2;
        triggerRebuild();
        lenDriving = false;
      });
      this._refreshCallback = () => {
        if (lenDriving) {
          return;
        }
        lenProp.value = safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
      };
      controls.push(
        new NumberControl(ctrl.lengthStringProperty, lenProp, L_RANGE, {
          delta: 0.05,
          includeArrowButtons: false,
          soundGenerator: null,
          layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
          titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: LABEL_FONT },
          numberDisplayOptions: {
            decimalPlaces: 2,
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
        }),
      );
    } else if (element instanceof BeamSplitterElement) {
      controls.push(
        makeControl(
          ctrl.transmissionRatioStringProperty,
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
