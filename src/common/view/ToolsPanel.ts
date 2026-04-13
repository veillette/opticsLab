/**
 * ToolsPanel.ts
 *
 * Collects all of the right-hand "Tools" controls into a single Node:
 *   • MeasuringTapeNode  (draggable overlay)
 *   • ProtractorNode     (draggable / rotatable overlay)
 *   • Ray-display mode properties (extended rays, show images, observer mode)
 *     with bidirectional sync to model.scene.modeProperty
 *   • Ray-density NumberControl
 *   • 11 toggle Checkboxes
 *   • AccordionBox wrapper with the title "Tools"
 *
 * The panel itself stays at the scene origin so child positions are expressed
 * in the same coordinate space as the rest of SimScreenView.  The AccordionBox
 * is pinned to the upper-right safe area via `visibleBoundsProperty`.
 *
 * Exposed members
 * ────────────────
 *   measuringTapeNode        – add to scene in the desired z-order
 *   protractorNode           – add to scene in the desired z-order
 *   accordionBox             – for PDOM placement
 *   measuringTapeVisibleProperty / protractorVisibleProperty
 *                            – read by keyboard-shortcut handler and SVG export
 *   extendedRaysProperty     – read by keyboard-shortcut handler
 *   reset()                  – restores every local property to its default
 */

import { BooleanProperty, Property, type ReadOnlyProperty } from "scenerystack/axon";
import { type Bounds2, Dimension2, Range, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, Node, Text, VBox } from "scenerystack/scenery";
import { MeasuringTapeNode, NumberControl, ProtractorNode } from "scenerystack/scenery-phet";
import { AccordionBox, Checkbox } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  ACCORDION_BUTTON_X_MARGIN,
  ACCORDION_BUTTON_Y_MARGIN,
  ACCORDION_CONTENT_SPACING,
  ACCORDION_CONTENT_Y_SPACING,
  FONT_11PX,
  FONT_12PX,
  FONT_BOLD_13PX,
  PANEL_CORNER_RADIUS,
  PANEL_X_MARGIN,
  PANEL_Y_MARGIN,
  PROTRACTOR_SCALE,
  RAY_DENSITY_DELTA,
  RAY_DENSITY_MAX,
  RAY_DENSITY_MIN,
  RESET_BUTTON_MARGIN,
  SLIDER_THUMB_HEIGHT,
  SLIDER_THUMB_WIDTH,
  SLIDER_TRACK_HEIGHT,
  SLIDER_TRACK_WIDTH,
} from "../../OpticsLabConstants.js";
import opticsLabQueryParameters from "../../preferences/opticsLabQueryParameters.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { RayTracingCommonModel } from "../model/SimModel.js";
import { DEFAULT_OBSERVER } from "./ObserverNode.js";
import {
  dragHandleIcon,
  extendedRaysIcon,
  focalPointIcon,
  gridIcon,
  makeCheckboxContent,
  measuringTapeIcon,
  observerIcon,
  protractorIcon,
  rayArrowsIcon,
  rayStubsIcon,
  showImagesIcon,
  snapToGridIcon,
} from "./ToolsPanelIcons.js";
import type { ViewOptionsModel } from "./ViewOptionsModel.js";

export class ToolsPanel extends Node {
  /** Draggable measuring-tape overlay – add to scene in the desired z-order. */
  public readonly measuringTapeNode: MeasuringTapeNode;

  /** Draggable / rotatable protractor overlay – add to scene in the desired z-order. */
  public readonly protractorNode: ProtractorNode;

  /** The accordion box that groups all toggle controls – for PDOM placement. */
  public readonly accordionBox: AccordionBox;

  public readonly measuringTapeVisibleProperty: BooleanProperty;
  public readonly protractorVisibleProperty: BooleanProperty;

  private readonly viewOptions: ViewOptionsModel;

  /**
   * Whether "Extended Rays" mode is active.  Changing this property updates
   * model.scene.modeProperty; conversely, external modeProperty changes update
   * this property.
   */
  public readonly extendedRaysProperty: BooleanProperty;

  public constructor(
    model: RayTracingCommonModel,
    modelViewTransform: ModelViewTransform2,
    selectedElementProperty: Property<OpticalElement | null>,
    visibleBoundsProperty: ReadOnlyProperty<Bounds2>,
    snapToGridProperty: Property<boolean>,
    viewOptions: ViewOptionsModel,
    tandem: Tandem | undefined,
  ) {
    super();
    this.viewOptions = viewOptions;

    const strings = StringManager.getInstance();
    const uiStrings = strings.getUIStrings();
    const prefStrings = strings.getPreferences();

    // ── Visibility toggles ─────────────────────────────────────────────────────
    const measuringTapeVisibleProperty = new BooleanProperty(opticsLabQueryParameters.showMeasuringTape);
    const protractorVisibleProperty = new BooleanProperty(opticsLabQueryParameters.showProtractor);
    this.measuringTapeVisibleProperty = measuringTapeVisibleProperty;
    this.protractorVisibleProperty = protractorVisibleProperty;

    // ── Measuring tape ─────────────────────────────────────────────────────────
    const measuringTapeUnitsProperty = new Property({
      name: uiStrings.metersUnitStringProperty.value,
      multiplier: 1,
    });
    const measuringTapeNode = new MeasuringTapeNode(measuringTapeUnitsProperty, {
      modelViewTransform: modelViewTransform,
      significantFigures: 2,
      textColor: OpticsLabColors.measuringTapeTextColorProperty,
      textBackgroundColor: OpticsLabColors.measuringTapeBackgroundColorProperty,
      basePositionProperty: new Property(new Vector2(2, 1)),
      tipPositionProperty: new Property(new Vector2(3, 1)),
      baseDragStarted: () => {
        selectedElementProperty.value = null;
      },
      tandem: tandem?.createTandem("measuringTapeNode") ?? Tandem.OPTIONAL,
    });
    measuringTapeVisibleProperty.linkAttribute(measuringTapeNode, "visible");
    measuringTapeNode.visible = false;
    this.measuringTapeNode = measuringTapeNode;
    this.addChild(measuringTapeNode);

    // ── Protractor ─────────────────────────────────────────────────────────────
    const protractorNode = new ProtractorNode({
      rotatable: true,
      scale: PROTRACTOR_SCALE,
      cursor: "pointer",
    });
    protractorNode.center = modelViewTransform.modelToViewPosition(new Vector2(0, 1));
    protractorVisibleProperty.linkAttribute(protractorNode, "visible");
    protractorNode.visible = false;
    protractorNode.addInputListener(
      new DragListener({
        translateNode: true,
        tandem: tandem?.createTandem("protractorDragListener") ?? Tandem.OPTIONAL,
      }),
    );
    this.protractorNode = protractorNode;
    this.addChild(protractorNode);

    // ── Ray density control ────────────────────────────────────────────────────
    const densityControl = new NumberControl(
      uiStrings.rayDensityStringProperty,
      model.scene.rayDensityProperty,
      new Range(RAY_DENSITY_MIN, RAY_DENSITY_MAX),
      {
        delta: RAY_DENSITY_DELTA,
        includeArrowButtons: false,
        soundGenerator: null,
        layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
        titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: FONT_11PX },
        numberDisplayOptions: {
          decimalPlaces: 2,
          textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: FONT_11PX },
          backgroundFill: OpticsLabColors.overlayInputBackgroundProperty,
          backgroundStroke: OpticsLabColors.overlayInputBorderProperty,
        },
        sliderOptions: {
          trackSize: new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT),
          thumbSize: new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT),
          ...(tandem && { tandem: tandem.createTandem("rayDensitySlider") }),
        },
        ...(tandem && { tandem: tandem.createTandem("rayDensityControl") }),
      },
    );

    // ── Ray-display mode properties ────────────────────────────────────────────
    // Three mutually-exclusive modes share a single modeProperty.  Each checkbox
    // is backed by a local BooleanProperty; changes in either direction stay in sync.
    const extendedRaysProperty = new BooleanProperty(model.scene.modeProperty.value === "extended", {
      ...(tandem && { tandem: tandem.createTandem("extendedRaysVisibleProperty") }),
    });
    const showImagesProperty = new BooleanProperty(model.scene.modeProperty.value === "images", {
      ...(tandem && { tandem: tandem.createTandem("showImagesProperty") }),
    });
    const observerModeProperty = new BooleanProperty(model.scene.modeProperty.value === "observer", {
      ...(tandem && { tandem: tandem.createTandem("observerModeProperty") }),
    });
    this.extendedRaysProperty = extendedRaysProperty;

    let blockModeSync = false;

    const syncCheckboxesFromMode = (mode: string): void => {
      if (blockModeSync) {
        return;
      }
      blockModeSync = true;
      extendedRaysProperty.value = mode === "extended";
      showImagesProperty.value = mode === "images";
      observerModeProperty.value = mode === "observer";
      blockModeSync = false;
    };

    extendedRaysProperty.lazyLink((v) => {
      if (blockModeSync) {
        return;
      }
      model.scene.modeProperty.value = v ? "extended" : "rays";
    });
    showImagesProperty.lazyLink((v) => {
      if (blockModeSync) {
        return;
      }
      model.scene.modeProperty.value = v ? "images" : "rays";
    });
    observerModeProperty.lazyLink((v) => {
      if (blockModeSync) {
        return;
      }
      if (v && !model.scene.observerProperty.value) {
        model.scene.observerProperty.value = { ...DEFAULT_OBSERVER };
      }
      model.scene.modeProperty.value = v ? "observer" : "rays";
    });
    model.scene.modeProperty.lazyLink(syncCheckboxesFromMode);

    // ── Checkboxes ─────────────────────────────────────────────────────────────
    const checkboxOptions = {
      checkboxColor: OpticsLabColors.overlayLabelFillProperty,
      checkboxColorBackground: OpticsLabColors.overlayInputBackgroundProperty,
    };
    const cbTandem = (name: string) => (tandem ? { tandem: tandem.createTandem(name) } : { tandem: Tandem.OPTIONAL });
    const labelOptions = {
      fill: OpticsLabColors.overlayLabelFillProperty,
      font: FONT_12PX,
    };

    const gridVisibleProperty = model.scene.showGridProperty;

    const checkboxes = [
      new Checkbox(
        measuringTapeVisibleProperty,
        makeCheckboxContent(measuringTapeIcon(), uiStrings.measuringTapeStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("measuringTapeCheckbox") },
      ),
      new Checkbox(
        protractorVisibleProperty,
        makeCheckboxContent(protractorIcon(), uiStrings.protractorStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("protractorCheckbox") },
      ),
      new Checkbox(
        extendedRaysProperty,
        makeCheckboxContent(extendedRaysIcon(), uiStrings.extendedRaysStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("extendedRaysCheckbox") },
      ),
      new Checkbox(
        showImagesProperty,
        makeCheckboxContent(showImagesIcon(), uiStrings.showImagesStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("showImagesCheckbox") },
      ),
      new Checkbox(
        observerModeProperty,
        makeCheckboxContent(observerIcon(), uiStrings.observerModeStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("observerModeCheckbox") },
      ),
      new Checkbox(
        viewOptions.handlesVisibleProperty,
        makeCheckboxContent(dragHandleIcon(), uiStrings.showHandlesStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("showHandlesCheckbox") },
      ),
      new Checkbox(
        viewOptions.focalMarkersVisibleProperty,
        makeCheckboxContent(focalPointIcon(), uiStrings.focalMarkersStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("focalMarkersCheckbox") },
      ),
      new Checkbox(
        viewOptions.rayArrowsVisibleProperty,
        makeCheckboxContent(rayArrowsIcon(), uiStrings.showRayArrowsStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("rayArrowsCheckbox") },
      ),
      new Checkbox(
        viewOptions.rayStubsEnabledProperty,
        makeCheckboxContent(rayStubsIcon(), uiStrings.rayStubsStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("rayStubsCheckbox") },
      ),
      new Checkbox(gridVisibleProperty, makeCheckboxContent(gridIcon(), uiStrings.gridStringProperty, labelOptions), {
        ...checkboxOptions,
        ...cbTandem("showGridCheckbox"),
      }),
      new Checkbox(
        snapToGridProperty,
        makeCheckboxContent(snapToGridIcon(), prefStrings.snapToGridStringProperty, labelOptions),
        { ...checkboxOptions, ...cbTandem("snapToGridCheckbox"), enabledProperty: gridVisibleProperty },
      ),
    ];

    // ── Accordion box ──────────────────────────────────────────────────────────
    const accordionBox = new AccordionBox(
      new VBox({ spacing: ACCORDION_CONTENT_SPACING, align: "left", children: [...checkboxes, densityControl] }),
      {
        titleNode: new Text(uiStrings.toolsStringProperty, {
          fill: OpticsLabColors.overlayLabelFillProperty,
          font: FONT_BOLD_13PX,
        }),
        fill: OpticsLabColors.panelFillProperty,
        stroke: OpticsLabColors.panelStrokeProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        contentXMargin: PANEL_X_MARGIN,
        contentYMargin: PANEL_Y_MARGIN,
        buttonXMargin: ACCORDION_BUTTON_X_MARGIN,
        buttonYMargin: ACCORDION_BUTTON_Y_MARGIN,
        contentYSpacing: ACCORDION_CONTENT_Y_SPACING,
        expandedProperty: new BooleanProperty(true),
        ...(tandem && { tandem: tandem.createTandem("toolsAccordionBox") }),
        ...(!tandem && { tandem: Tandem.OPTIONAL }),
      },
    );
    this.accordionBox = accordionBox;
    this.addChild(accordionBox);

    // ── Pin accordion to upper-right safe area ─────────────────────────────────
    visibleBoundsProperty.link((visibleBounds) => {
      accordionBox.right = visibleBounds.maxX - RESET_BUTTON_MARGIN;
      accordionBox.top = visibleBounds.minY + RESET_BUTTON_MARGIN;
    });
  }

  /**
   * Reset all local properties and tool positions to their initial values.
   * Called by the ResetAllButton listener in SimScreenView.
   */
  public reset(): void {
    this.extendedRaysProperty.reset();
    this.measuringTapeVisibleProperty.reset();
    this.protractorVisibleProperty.reset();
    this.viewOptions.reset();
    this.measuringTapeNode.basePositionProperty.reset();
    this.measuringTapeNode.tipPositionProperty.reset();
    this.protractorNode.angleProperty.reset();
  }
}
