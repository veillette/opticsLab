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

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { HBox, Node, Text } from "scenerystack/scenery";
import { CloseButton, TrashButton } from "scenerystack/scenery-phet";
import { FlatAppearanceStrategy, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  PANEL_BOTTOM_MARGIN,
  PANEL_CONTENT_SPACING,
  PANEL_CORNER_RADIUS,
  PANEL_X_MARGIN,
  PANEL_Y_MARGIN,
} from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { SignConvention } from "../../preferences/OpticsLabPreferencesModel.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import { buildEditControls } from "./EditControlFactory.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const TITLE_FONT = "bold 12px sans-serif";

// Human-readable labels for each element type string.
// Keys must match the `type` field on each model class.
function buildTypeLabels(): Partial<Record<string, TReadOnlyProperty<string>>> {
  const c = StringManager.getInstance().getComponentStrings();
  return {
    ArcSource: c.arcSourceStringProperty,
    PointSource: c.pointSourceStringProperty,
    Beam: c.beamSourceStringProperty,
    DivergentBeam: c.divergentBeamSourceStringProperty,
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
    Detector: c.detectorStringProperty,
    Aperture: c.apertureStringProperty,
    TransmissionGrating: c.transmissionGratingStringProperty,
    ReflectionGrating: c.reflectionGratingStringProperty,
    Track: c.trackStringProperty,
  };
}
const TYPE_LABELS = buildTypeLabels();

// ── EditContainerNode ────────────────────────────────────────────────────────

export class EditContainerNode extends Node {
  /**
   * Callback set by SimScreenView after an element is selected so that
   * controls can trigger a visual rebuild of the element's view.
   * Read lazily at value-change time (after the link callback has run).
   */
  private _rebuildViewCallback: (() => void) | null = null;

  /**
   * Set by EditControlFactory for elements whose geometry can change via
   * drag (e.g. ArcMirror).  Calling refresh() invokes this to push the
   * current model value back into the displayed NumberProperty.
   */
  private _refreshCallback: (() => void) | null = null;

  private readonly _visibleBoundsProperty: TReadOnlyProperty<Bounds2>;
  private _currentPanel: Panel | null = null;
  private readonly _signConventionProperty: TReadOnlyProperty<SignConvention>;
  private readonly _useCurvatureDisplayProperty: TReadOnlyProperty<boolean>;

  public constructor(
    selectedElementProperty: Property<OpticalElement | null>,
    onDelete: (element: OpticalElement) => void,
    visibleBoundsProperty: TReadOnlyProperty<Bounds2>,
    signConventionProperty: TReadOnlyProperty<SignConvention>,
    useCurvatureDisplayProperty: TReadOnlyProperty<boolean>,
  ) {
    super({
      // Group property controls under a labelled landmark so screen readers
      // can navigate directly to the element-properties panel.
      tagName: "section",
      accessibleHeading: "Element Properties",
    });

    this._visibleBoundsProperty = visibleBoundsProperty;
    this._signConventionProperty = signConventionProperty;
    this._useCurvatureDisplayProperty = useCurvatureDisplayProperty;
    this.visible = false;

    // Track the current element so sign-convention changes can re-render it.
    let currentElement: OpticalElement | null = null;

    selectedElementProperty.link((element) => {
      currentElement = element;
      // Reset the callback whenever the selection changes.
      this._rebuildViewCallback = null;
      this._renderFor(element, onDelete, () => {
        selectedElementProperty.value = null;
      });
    });

    const onDismiss = (): void => {
      selectedElementProperty.value = null;
    };

    // Re-render when the sign convention changes (affects SphericalLens R₂ display).
    signConventionProperty.lazyLink(() => {
      if (currentElement) {
        this._rebuildViewCallback = null;
        this._renderFor(currentElement, onDelete, onDismiss);
      }
    });

    // Re-render when curvature display mode changes (affects all radius sliders).
    useCurvatureDisplayProperty.lazyLink(() => {
      if (currentElement) {
        this._rebuildViewCallback = null;
        this._renderFor(currentElement, onDelete, onDismiss);
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

  private _renderFor(
    element: OpticalElement | null,
    onDelete: (e: OpticalElement) => void,
    onDismiss: () => void,
  ): void {
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

    // ── Title ──────────────────────────────────────────────────────────────
    const typeLabel: TReadOnlyProperty<string> | string = TYPE_LABELS[element.type] ?? element.type;
    const titleText = new Text(typeLabel, { font: TITLE_FONT, fill: OpticsLabColors.overlayValueFillProperty });

    const dismissBtn = new CloseButton({
      listener: onDismiss,
      baseColor: OpticsLabColors.panelFillProperty,
      iconLength: 8,
      tandem: Tandem.OPTIONAL,
    });

    const deleteBtn = new TrashButton({
      listener: () => onDelete(element),
      baseColor: OpticsLabColors.deleteButtonBaseColorProperty,
      iconOptions: { fill: OpticsLabColors.overlayValueFillProperty },
      buttonAppearanceStrategy: FlatAppearanceStrategy,
      tandem: Tandem.OPTIONAL,
    });

    // ── Type-specific controls ─────────────────────────────────────────────
    const { controls, refreshCallback } = buildEditControls(
      element,
      triggerRebuild,
      this._signConventionProperty.value,
      this._useCurvatureDisplayProperty.value,
    );
    this._refreshCallback = refreshCallback;

    // ── Assemble panel — dismiss left, title, controls, trash right ─────────
    const content = new HBox({
      spacing: PANEL_CONTENT_SPACING,
      align: "center",
      children: [dismissBtn, titleText, ...controls, deleteBtn],
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
}

opticsLab.register("EditContainerNode", EditContainerNode);
