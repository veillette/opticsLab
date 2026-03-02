/**
 * EditContainerNode.ts
 *
 * A panel shown at the bottom of the screen whenever an optical element is
 * selected. Displays numeric property sliders appropriate to the element type
 * and a Delete button.
 *
 * Design notes
 * ─────────────
 * • The panel content is rebuilt from scratch each time the selected element
 *   changes (kept simple because the element set is small).
 * • Sliders read `_rebuildViewCallback` lazily at change-time so that
 *   SimScreenView can supply the callback after selection is triggered.
 */

import { NumberProperty, type Property } from "scenerystack/axon";
import { type Bounds2, Dimension2, Range } from "scenerystack/dot";
import { HBox, Node, Text, VBox } from "scenerystack/scenery";
import { HSlider, Panel, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
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

const SLIDER_TRACK_SIZE = new Dimension2(130, 4);
const SLIDER_THUMB_SIZE = new Dimension2(10, 20);

const LABEL_FONT = "11px sans-serif";
const TITLE_FONT = "bold 12px sans-serif";
const LABEL_FILL = "#bbb";
const TITLE_FILL = "#eee";

const PANEL_FILL = "rgba(25, 25, 45, 0.92)";
const PANEL_STROKE = "rgba(120, 120, 140, 1)";
const PANEL_CORNER_RADIUS = 8;

const DELETE_BASE_COLOR = "#883333";
const PANEL_BOTTOM_MARGIN = 10;

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

/**
 * Build a VBox containing a label text and an HSlider.
 *
 * @param label        - text shown above the slider
 * @param initValue    - starting slider position (clamped to range)
 * @param range        - allowed slider range
 * @param onSet        - called with the new value when the slider changes
 * @param onAfterSet   - called after onSet (use to trigger view rebuild / ray re-trace)
 */
function makeSlider(
  label: string,
  initValue: number,
  range: Range,
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

  const slider = new HSlider(prop, range, {
    trackSize: SLIDER_TRACK_SIZE,
    thumbSize: SLIDER_THUMB_SIZE,
    tandem: Tandem.OPT_OUT,
  });

  return new VBox({
    spacing: 2,
    align: "left",
    children: [new Text(label, { font: LABEL_FONT, fill: LABEL_FILL }), slider],
  });
}

// ── EditContainerNode ────────────────────────────────────────────────────────

export class EditContainerNode extends Node {
  /**
   * Callback set by SimScreenView after an element is selected so that
   * sliders can trigger a visual rebuild of the element's view.
   * Read lazily at slider-change time (after the link callback has run).
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
   * so that slider onChange callbacks can trigger a visual rebuild.
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

    // Lazily reads _rebuildViewCallback at slider-change time.
    const triggerRebuild = (): void => {
      this._rebuildViewCallback?.();
    };

    // ── Title row ──────────────────────────────────────────────────────────
    const typeLabel = TYPE_LABELS[element.type] ?? element.type;
    const titleText = new Text(typeLabel, { font: TITLE_FONT, fill: TITLE_FILL });

    const deleteBtn = new TextPushButton("Delete", {
      listener: () => onDelete(element),
      baseColor: DELETE_BASE_COLOR,
      textFill: "#fff",
      tandem: Tandem.OPT_OUT,
    });

    const titleRow = new HBox({
      spacing: 12,
      align: "center",
      children: [titleText, deleteBtn],
    });

    // ── Type-specific sliders ──────────────────────────────────────────────
    const sliders: Node[] = this._buildSliders(element, triggerRebuild);

    // ── Assemble panel ─────────────────────────────────────────────────────
    const content = new VBox({
      spacing: 8,
      align: "left",
      children: [titleRow, ...sliders],
    });

    const panel = new Panel(content, {
      fill: PANEL_FILL,
      stroke: PANEL_STROKE,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: 12,
      yMargin: 8,
    });

    this.addChild(panel);

    // Position at bottom-center of the play area.
    panel.centerX = this._layoutBounds.centerX;
    panel.bottom = this._layoutBounds.maxY - PANEL_BOTTOM_MARGIN;
  }

  private _buildSliders(element: OpticalElement, triggerRebuild: () => void): Node[] {
    const sliders: Node[] = [];

    // ── Light Sources ─────────────────────────────────────────────────────
    if (element instanceof ArcLightSource) {
      sliders.push(
        makeSlider(
          "Brightness",
          element.brightness,
          new Range(0.05, 2),
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeSlider(
          "Wavelength (nm)",
          element.wavelength,
          new Range(380, 780),
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
        makeSlider(
          "Emission Angle (°)",
          element.emissionAngle * (180 / Math.PI),
          new Range(5, 360),
          (v) => {
            element.emissionAngle = v * (Math.PI / 180);
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof PointSourceElement) {
      sliders.push(
        makeSlider(
          "Brightness",
          element.brightness,
          new Range(0.05, 2),
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeSlider(
          "Wavelength (nm)",
          element.wavelength,
          new Range(380, 780),
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof BeamSource) {
      sliders.push(
        makeSlider(
          "Brightness",
          element.brightness,
          new Range(0.05, 2),
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeSlider(
          "Wavelength (nm)",
          element.wavelength,
          new Range(380, 780),
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
        makeSlider(
          "Divergence (°)",
          element.emisAngle,
          new Range(0, 90),
          (v) => {
            element.emisAngle = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof SingleRaySource) {
      sliders.push(
        makeSlider(
          "Brightness",
          element.brightness,
          new Range(0.05, 2),
          (v) => {
            element.brightness = v;
          },
          triggerRebuild,
        ),
        makeSlider(
          "Wavelength (nm)",
          element.wavelength,
          new Range(380, 780),
          (v) => {
            element.wavelength = v;
          },
          triggerRebuild,
        ),
      );

      // ── Glass / Lenses ────────────────────────────────────────────────────
    } else if (element instanceof SphericalLens) {
      const { r1, r2 } = element.getDR1R2();
      const R_RANGE = new Range(-2000, 2000);

      sliders.push(
        makeSlider(
          "R₁ (left surface)",
          safeClamp(r1, R_RANGE.min, R_RANGE.max, 500),
          R_RANGE,
          (v) => {
            const { d, r2: cr2 } = element.getDR1R2();
            element.createLensWithDR1R2(d, v, cr2);
          },
          triggerRebuild,
        ),
        makeSlider(
          "R₂ (right surface)",
          safeClamp(r2, R_RANGE.min, R_RANGE.max, -500),
          R_RANGE,
          (v) => {
            const { d, r1: cr1 } = element.getDR1R2();
            element.createLensWithDR1R2(d, cr1, v);
          },
          triggerRebuild,
        ),
        makeSlider(
          "Ref. Index",
          element.refIndex,
          new Range(1, 3),
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof IdealLens) {
      sliders.push(
        makeSlider(
          "Focal Length (px)",
          element.focalLength,
          new Range(-800, 800),
          (v) => {
            element.focalLength = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof BaseGlass) {
      // Covers CircleGlass, HalfPlaneGlass, Glass (prism)
      sliders.push(
        makeSlider(
          "Ref. Index",
          element.refIndex,
          new Range(1, 3),
          (v) => {
            element.refIndex = v;
          },
          triggerRebuild,
        ),
      );

      // ── Mirrors ───────────────────────────────────────────────────────────
    } else if (element instanceof IdealCurvedMirror) {
      sliders.push(
        makeSlider(
          "Focal Length (px)",
          element.focalLength,
          new Range(10, 800),
          (v) => {
            element.focalLength = v;
          },
          triggerRebuild,
        ),
      );
    } else if (element instanceof BeamSplitterElement) {
      sliders.push(
        makeSlider(
          "Transmission ratio",
          element.transRatio,
          new Range(0, 1),
          (v) => {
            element.transRatio = v;
          },
          triggerRebuild,
        ),
      );
    }

    return sliders;
  }
}

opticsLab.register("EditContainerNode", EditContainerNode);
