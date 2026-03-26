import { BooleanProperty, Property } from "scenerystack/axon";
import { Dimension2, Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, Node, Path, Text, VBox } from "scenerystack/scenery";
import {
  GridNode,
  InfoButton,
  MeasuringTapeNode,
  NumberControl,
  ProtractorNode,
  ResetAllButton,
} from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import {
  AccordionBox,
  type Carousel,
  Checkbox,
  FlatAppearanceStrategy,
  PageControl,
  RoundPushButton,
} from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  ACCORDION_BUTTON_X_MARGIN,
  ACCORDION_BUTTON_Y_MARGIN,
  ACCORDION_CONTENT_SPACING,
  ACCORDION_CONTENT_Y_SPACING,
  ACQUISITION_PASSES_PER_FRAME,
  CAROUSEL_OFFSET_FROM_PAGE_CONTROL,
  CAROUSEL_PAGE_CONTROL_DOT_RADIUS,
  CAROUSEL_PAGE_CONTROL_DOT_SPACING,
  CAROUSEL_PAGE_CONTROL_MARGIN,
  PANEL_CORNER_RADIUS,
  PANEL_X_MARGIN,
  PANEL_Y_MARGIN,
  PIXELS_PER_METER,
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
import opticsLab from "../../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../../preferences/OpticsLabPreferencesModel.js";
import opticsLabQueryParameters from "../../preferences/opticsLabQueryParameters.js";
import { DetectorElement } from "../model/detectors/DetectorElement.js";
import { BaseGlass } from "../model/glass/BaseGlass.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { RayTracingCommonModel } from "../model/SimModel.js";
import { BaseOpticalElementView } from "./BaseOpticalElementView.js";
import { type ComponentKey, createComponentCarousel } from "./ComponentCarousel.js";
import { DetectorView } from "./detectors/DetectorView.js";
import { EditContainerNode } from "./EditContainerNode.js";
import { focalMarkersVisibleProperty } from "./FocalMarkersVisibleProperty.js";
import { handlesVisibleProperty } from "./HandlesVisibleProperty.js";
import { InfoDialogNode } from "./InfoDialogNode.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";
import { RayPropagationView } from "./RayPropagationView.js";
import { downloadSceneSVG } from "./SceneSVGExporter.js";
import { viewSnapState } from "./ViewSnapState.js";

/**
 * Single-letter shortcuts for the Tools panel checkboxes (when not typing in a field).
 * Returns true if the key was handled (caller should preventDefault).
 */
function tryHandleToolsPanelShortcut(
  event: KeyboardEvent,
  isTextInput: boolean,
  locals: {
    measuringTapeVisibleProperty: BooleanProperty;
    protractorVisibleProperty: BooleanProperty;
    extendedRaysProperty: BooleanProperty;
    gridVisibleProperty: BooleanProperty;
    snapToGridProperty: BooleanProperty;
  },
): boolean {
  if (isTextInput || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
    return false;
  }
  const letter = event.key.toLowerCase();
  const {
    measuringTapeVisibleProperty,
    protractorVisibleProperty,
    extendedRaysProperty,
    gridVisibleProperty,
    snapToGridProperty,
  } = locals;
  if (letter === "m") {
    measuringTapeVisibleProperty.toggle();
    return true;
  }
  if (letter === "p") {
    protractorVisibleProperty.toggle();
    return true;
  }
  if (letter === "e") {
    extendedRaysProperty.toggle();
    return true;
  }
  if (letter === "k") {
    handlesVisibleProperty.toggle();
    return true;
  }
  if (letter === "f") {
    focalMarkersVisibleProperty.toggle();
    return true;
  }
  if (letter === "g") {
    gridVisibleProperty.toggle();
    return true;
  }
  if (letter === "s" && gridVisibleProperty.value) {
    snapToGridProperty.toggle();
    return true;
  }
  return false;
}

export class RayTracingCommonView extends ScreenView {
  private readonly model: RayTracingCommonModel;
  private readonly rayPropagationView: RayPropagationView;
  private readonly elementsLayer: Node;
  private readonly dragLayer: Node = new Node();
  private readonly editContainerNode: EditContainerNode;

  /** Model-to-view coordinate transform (metres → pixels, y-up → y-down). */
  public readonly modelViewTransform: ModelViewTransform2;

  /** Tracks the currently selected element (null = nothing selected). */
  private readonly selectedElementProperty: Property<OpticalElement | null>;

  /** Maps element id → view so we can remove views and provide rebuild callbacks. */
  private readonly elementViewMap = new Map<string, OpticalElementView>();

  /** Carousel toolbox – set during construction; used in _setupView for return-to-delete. */
  private _carousel: Carousel | null = null;

  /** Central delete handler shared between EditContainerNode and return-to-carousel. */
  private _deleteElement: ((element: OpticalElement) => void) | null = null;

  /** Stored so it can be removed from window on dispose. */
  private _handleKeyDown!: (event: KeyboardEvent) => void;

  private static readonly DOWNLOAD_ICON_SHAPE = new Shape()
    .moveTo(4, 14)
    .lineTo(4, 18)
    .lineTo(16, 18)
    .lineTo(16, 14)
    .moveTo(10, 3)
    .lineTo(10, 13)
    .moveTo(6.5, 9.5)
    .lineTo(10, 13)
    .lineTo(13.5, 9.5);

  public constructor(
    model: RayTracingCommonModel,
    _opticsLabPreferences: OpticsLabPreferencesModel,
    options?: ScreenViewOptions,
    carouselComponents?: ComponentKey[],
  ) {
    super(options);

    this.model = model;
    const tandem = options?.tandem;
    const strings = StringManager.getInstance();
    const uiStrings = strings.getUIStrings();
    const prefStrings = strings.getPreferences();

    // ── Model-View Transform ────────────────────────────────────────────────
    // Maps model origin (0, 0) to the centre of the visible play area.
    // 100 px = 1 m; y-axis is inverted (model +y = up, view +y = down).
    this.modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      Vector2.ZERO,
      this.layoutBounds.center,
      PIXELS_PER_METER,
    );
    const modelViewTransform = this.modelViewTransform;

    this.selectedElementProperty = new Property<OpticalElement | null>(null);

    // ── Grid (model + preferences stay in sync for PhET-iO and global prefs) ─
    model.scene.showGridProperty.value = opticsLabQueryParameters.showGrid;
    model.scene.gridSizeProperty.value = _opticsLabPreferences.gridSpacingProperty.value;

    let blockSnapSync = false;
    _opticsLabPreferences.snapToGridProperty.lazyLink((v) => {
      if (!blockSnapSync) {
        blockSnapSync = true;
        model.scene.snapToGridProperty.value = v;
        blockSnapSync = false;
      }
    });
    model.scene.snapToGridProperty.lazyLink((v) => {
      if (!blockSnapSync) {
        blockSnapSync = true;
        _opticsLabPreferences.snapToGridProperty.value = v;
        blockSnapSync = false;
      }
    });
    let blockGridSync = false;
    _opticsLabPreferences.gridSpacingProperty.lazyLink((v) => {
      if (!blockGridSync) {
        blockGridSync = true;
        model.scene.gridSizeProperty.value = v;
        blockGridSync = false;
      }
    });
    model.scene.gridSizeProperty.lazyLink((v) => {
      if (!blockGridSync) {
        blockGridSync = true;
        _opticsLabPreferences.gridSpacingProperty.value = v;
        blockGridSync = false;
      }
    });

    // ── Partial reflection (global toggle via preferences) ──────────────────
    BaseGlass.partialReflectionEnabled = _opticsLabPreferences.partialReflectionEnabledProperty.value;
    _opticsLabPreferences.partialReflectionEnabledProperty.lazyLink((v) => {
      BaseGlass.partialReflectionEnabled = v;
    });

    const gridVisibleProperty = model.scene.showGridProperty;
    const gridContainer = new Node();
    gridVisibleProperty.linkAttribute(gridContainer, "visible");
    this.addChild(gridContainer);

    // Half the screen's larger dimension in model metres, plus 2 lines of padding.
    const halfScreenM = Math.max(this.layoutBounds.width, this.layoutBounds.height) / 2 / PIXELS_PER_METER;

    const buildGrid = (spacing: number) => {
      const linesPerSide = Math.ceil(halfScreenM / spacing) + 2;
      gridContainer.removeAllChildren();
      gridContainer.addChild(
        new GridNode(
          new Property(modelViewTransform),
          spacing,
          Vector2.ZERO, // model-space centre
          linesPerSide,
          { stroke: OpticsLabColors.gridLineStrokeProperty, lineWidth: 1 },
        ),
      );
      viewSnapState.setGridSpacingM(spacing);
    };
    buildGrid(model.scene.gridSizeProperty.value);
    model.scene.gridSizeProperty.lazyLink(buildGrid);

    const snapToGridProperty = _opticsLabPreferences.snapToGridProperty;
    gridVisibleProperty.lazyLink((visible) => {
      if (!visible) {
        snapToGridProperty.reset();
      }
    });
    viewSnapState.setSnapToGrid(snapToGridProperty);

    // ── Ray Propagation Layer (behind elements so rays don't block handles) ─
    this.rayPropagationView = new RayPropagationView(this.visibleBoundsProperty.value, modelViewTransform);
    this.visibleBoundsProperty.link((visibleBounds) => {
      this.rayPropagationView.canvasBounds = visibleBounds;
    });
    this.addChild(this.rayPropagationView);

    // Click on the background canvas → deselect the current element.
    this.rayPropagationView.addInputListener({
      down: () => {
        this.selectedElementProperty.value = null;
      },
    });

    // ── Optical Elements Layer ──────────────────────────────────────────────
    this.elementsLayer = new Node({
      ...(tandem && { tandem: tandem.createTandem("elementsLayer") }),
    });
    this.addChild(this.elementsLayer);

    // ── Delete handler (shared by EditContainerNode and return-to-carousel) ──
    this._deleteElement = (element: OpticalElement): void => {
      // Clear selection first (hides the panel).
      this.selectedElementProperty.value = null;

      // Remove view from whichever layer currently holds it (elements or drag layer).
      const view = this.elementViewMap.get(element.id);
      if (view) {
        if (this.elementsLayer.children.includes(view)) {
          this.elementsLayer.removeChild(view);
        } else if (this.dragLayer.children.includes(view)) {
          this.dragLayer.removeChild(view);
        }
        this.elementViewMap.delete(element.id);
        view.dispose();
      }

      // Remove from model.
      model.scene.removeElement(element.id);
    };

    // ── Edit Container Node ───────────────────────────────────────────────
    this.editContainerNode = new EditContainerNode(
      this.selectedElementProperty,
      (element) => this._deleteElement?.(element),
      this.visibleBoundsProperty,
      _opticsLabPreferences.signConventionProperty,
      _opticsLabPreferences.useCurvatureDisplayProperty,
    );
    this.addChild(this.editContainerNode);

    // ── Component Carousel (toolbox) ─────────────────────────────────────────
    // Created before the initial-element loop so _setupView can reference it
    // for return-to-carousel deletion detection.
    const carousel = createComponentCarousel(
      modelViewTransform,
      (p) => this.globalToLocalPoint(p),
      (element) => {
        // Deselect any currently selected element so the edit panel hides.
        this.selectedElementProperty.value = null;

        // Add to model
        model.scene.addElement(element);

        // Create and add corresponding view
        const tandemName = element.id.replace(/-(\d+)$/, (_, n) => n);
        const elementTandem = tandem?.createTandem(tandemName) ?? Tandem.OPTIONAL;
        const view = createOpticalElementView(element, modelViewTransform, elementTandem);
        if (view) {
          this._setupView(element, view);
        }
        return view;
      },
      carouselComponents,
    );
    this._carousel = carousel;
    this.addChild(carousel);

    const pageControl = new PageControl(carousel.pageNumberProperty, carousel.numberOfPagesProperty, {
      interactive: true,
      orientation: "vertical",
      dotRadius: CAROUSEL_PAGE_CONTROL_DOT_RADIUS,
      dotSpacing: CAROUSEL_PAGE_CONTROL_DOT_SPACING,
      currentPageFill: OpticsLabColors.pageControlCurrentFillProperty,
      currentPageStroke: null,
      pageFill: OpticsLabColors.pageControlInactiveFillProperty,
      pageStroke: null,
      tandem: tandem?.createTandem("pageControl") ?? Tandem.OPTIONAL,
    });
    this.addChild(pageControl);

    // Keep the page control and carousel pinned to the left edge of the visible (safe) area.
    this.visibleBoundsProperty.link((visibleBounds) => {
      pageControl.left = visibleBounds.minX + CAROUSEL_PAGE_CONTROL_MARGIN;
      pageControl.centerY = visibleBounds.centerY;
      carousel.left = pageControl.right + CAROUSEL_OFFSET_FROM_PAGE_CONTROL;
      carousel.centerY = visibleBounds.centerY;
    });

    // Drag layer sits above the carousel so elements being dragged are never
    // occluded by the toolbox panel.
    this.addChild(this.dragLayer);

    // ── Populate initial elements ──────────────────────────────────────────
    for (const element of model.scene.getAllElements()) {
      const tandemName = element.id.replace(/-(\d+)$/, (_, n) => n);
      const elementTandem = tandem?.createTandem(tandemName) ?? Tandem.OPTIONAL;
      const elementView = createOpticalElementView(element, modelViewTransform, elementTandem);
      if (elementView) {
        this._setupView(element, elementView);
      }
    }

    // ── Tools ─────────────────────────────────────────────────────────────────
    const measuringTapeVisibleProperty = new BooleanProperty(opticsLabQueryParameters.showMeasuringTape);
    const protractorVisibleProperty = new BooleanProperty(opticsLabQueryParameters.showProtractor);

    // Measuring tape – uses model coordinates (metres)
    const uiStringsForTape = StringManager.getInstance().getUIStrings();
    const measuringTapeUnitsProperty = new Property({
      name: uiStringsForTape.metersUnitStringProperty.value,
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
        this.selectedElementProperty.value = null;
      },
      tandem: tandem?.createTandem("measuringTapeNode") ?? Tandem.OPTIONAL,
    });
    measuringTapeVisibleProperty.linkAttribute(measuringTapeNode, "visible");
    measuringTapeNode.visible = false;
    this.addChild(measuringTapeNode);

    // Protractor
    const protractorNode = new ProtractorNode({
      rotatable: true,
      scale: PROTRACTOR_SCALE,
      cursor: "pointer",
    });
    protractorNode.center = modelViewTransform.modelToViewPosition(new Vector2(0, 1));
    protractorVisibleProperty.linkAttribute(protractorNode, "visible");
    protractorNode.visible = false;

    // Make protractor draggable
    protractorNode.addInputListener(
      new DragListener({
        translateNode: true,
        tandem: tandem?.createTandem("protractorDragListener") ?? Tandem.OPTIONAL,
      }),
    );
    this.addChild(protractorNode);

    // ── Ray Density Control ──────────────────────────────────────────────────
    const densityRange = new Range(RAY_DENSITY_MIN, RAY_DENSITY_MAX);
    const rayDensityProperty = model.scene.rayDensityProperty;

    const densityControl = new NumberControl(uiStrings.rayDensityStringProperty, rayDensityProperty, densityRange, {
      delta: RAY_DENSITY_DELTA,
      includeArrowButtons: false,
      soundGenerator: null,
      layoutFunction: NumberControl.createLayoutFunction4({ verticalSpacing: 4 }),
      titleNodeOptions: { fill: OpticsLabColors.overlayLabelFillProperty, font: "11px sans-serif" },
      numberDisplayOptions: {
        decimalPlaces: 2,
        textOptions: { fill: OpticsLabColors.overlayValueFillProperty, font: "11px sans-serif" },
        backgroundFill: OpticsLabColors.overlayInputBackgroundProperty,
        backgroundStroke: OpticsLabColors.overlayInputBorderProperty,
      },
      sliderOptions: {
        trackSize: new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT),
        thumbSize: new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT),
        ...(tandem && { tandem: tandem.createTandem("rayDensitySlider") }),
      },
      ...(tandem && { tandem: tandem.createTandem("rayDensityControl") }),
    });

    // ── Extended Rays ────────────────────────────────────────────────────────
    const extendedRaysProperty = new BooleanProperty(model.scene.modeProperty.value === "extended", {
      ...(tandem && { tandem: tandem.createTandem("extendedRaysVisibleProperty") }),
    });
    let blockModeSync = false;
    extendedRaysProperty.lazyLink((extended) => {
      if (blockModeSync) {
        return;
      }
      blockModeSync = true;
      model.scene.modeProperty.value = extended ? "extended" : "rays";
      blockModeSync = false;
    });
    model.scene.modeProperty.lazyLink((mode) => {
      if (blockModeSync) {
        return;
      }
      const extended = mode === "extended";
      if (extendedRaysProperty.value !== extended) {
        blockModeSync = true;
        extendedRaysProperty.value = extended;
        blockModeSync = false;
      }
    });

    // ── Checkbox helper ──────────────────────────────────────────────────────
    const checkboxOptions = {
      checkboxColor: OpticsLabColors.overlayLabelFillProperty,
      checkboxColorBackground: OpticsLabColors.overlayInputBackgroundProperty,
    };
    const checkboxTandem = (name: string) =>
      tandem ? { tandem: tandem.createTandem(name) } : { tandem: Tandem.OPTIONAL };
    const labelOptions = {
      fill: OpticsLabColors.overlayLabelFillProperty,
      font: "12px sans-serif",
    };

    const measuringTapeCheckbox = new Checkbox(
      measuringTapeVisibleProperty,
      new Text(uiStrings.measuringTapeStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("measuringTapeCheckbox") },
    );
    const protractorCheckbox = new Checkbox(
      protractorVisibleProperty,
      new Text(uiStrings.protractorStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("protractorCheckbox") },
    );
    const extendedRaysCheckbox = new Checkbox(
      extendedRaysProperty,
      new Text(uiStrings.extendedRaysStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("extendedRaysCheckbox") },
    );
    const showHandlesCheckbox = new Checkbox(
      handlesVisibleProperty,
      new Text(uiStrings.showHandlesStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("showHandlesCheckbox") },
    );
    const focalMarkersCheckbox = new Checkbox(
      focalMarkersVisibleProperty,
      new Text(uiStrings.focalMarkersStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("focalMarkersCheckbox") },
    );
    const gridCheckbox = new Checkbox(gridVisibleProperty, new Text(uiStrings.gridStringProperty, labelOptions), {
      ...checkboxOptions,
      ...checkboxTandem("showGridCheckbox"),
    });
    const snapCheckbox = new Checkbox(
      snapToGridProperty,
      new Text(prefStrings.snapToGridStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("snapToGridCheckbox"), enabledProperty: gridVisibleProperty },
    );

    // ── Tools / Options Accordion Box ────────────────────────────────────────
    const accordionContent = new VBox({
      spacing: ACCORDION_CONTENT_SPACING,
      align: "left",
      children: [
        measuringTapeCheckbox,
        protractorCheckbox,
        extendedRaysCheckbox,
        showHandlesCheckbox,
        focalMarkersCheckbox,
        gridCheckbox,
        snapCheckbox,
        densityControl,
      ],
    });

    const toolsAccordionBox = new AccordionBox(accordionContent, {
      titleNode: new Text(uiStrings.toolsStringProperty, {
        fill: OpticsLabColors.overlayLabelFillProperty,
        font: "bold 13px sans-serif",
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
    });
    this.addChild(toolsAccordionBox);

    // ── Reset Button ────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        _opticsLabPreferences.snapToGridProperty.reset();
        _opticsLabPreferences.gridSpacingProperty.reset();
        this.reset();
        extendedRaysProperty.reset();
        measuringTapeVisibleProperty.reset();
        protractorVisibleProperty.reset();
        handlesVisibleProperty.reset();
        focalMarkersVisibleProperty.reset();
        measuringTapeNode.basePositionProperty.reset();
        measuringTapeNode.tipPositionProperty.reset();
        protractorNode.angleProperty.reset();
      },
      ...(tandem && { tandem: tandem.createTandem("resetAllButton") }),
    });
    this.addChild(resetAllButton);

    const downloadSceneButton = new RoundPushButton({
      content: new Path(RayTracingCommonView.DOWNLOAD_ICON_SHAPE, {
        stroke: OpticsLabColors.overlayValueFillProperty,
        lineWidth: 2,
        lineCap: "round",
        lineJoin: "round",
      }),
      listener: () => {
        const result = this.updateRayPropagation();
        downloadSceneSVG({
          visibleBounds: this.visibleBoundsProperty.value,
          modelViewTransform: this.modelViewTransform,
          elements: [...this.model.scene.getAllElements()],
          segments: result.segments,
          viewState: {
            showGrid: model.scene.showGridProperty.value,
            gridSpacing: model.scene.gridSizeProperty.value,
            showHandles: handlesVisibleProperty.value,
            measuringTape: {
              visible: measuringTapeVisibleProperty.value,
              basePosition: measuringTapeNode.basePositionProperty.value.copy(),
              tipPosition: measuringTapeNode.tipPositionProperty.value.copy(),
            },
            protractor: {
              visible: protractorVisibleProperty.value,
              center: protractorNode.center.copy(),
              angle: protractorNode.angleProperty.value,
            },
          },
        });
      },
      accessibleName: uiStrings.downloadSceneStringProperty,
      baseColor: OpticsLabColors.panelFillProperty,
      buttonAppearanceStrategy: FlatAppearanceStrategy,
      xMargin: 8,
      yMargin: 8,
      tandem: tandem?.createTandem("downloadSceneButton") ?? Tandem.OPTIONAL,
    });
    this.addChild(downloadSceneButton);

    const infoDialogNode = new InfoDialogNode();
    this.addChild(infoDialogNode);

    const infoButton = new InfoButton({
      listener: () => {
        infoDialogNode.visible = !infoDialogNode.visible;
      },
      scale: 0.5,
      tandem: tandem?.createTandem("infoButton") ?? Tandem.OPT_OUT,
    });
    this.addChild(infoButton);

    // Pin the controls to the visible (safe) area.
    this.visibleBoundsProperty.link((visibleBounds) => {
      resetAllButton.right = visibleBounds.maxX - RESET_BUTTON_MARGIN;
      resetAllButton.bottom = visibleBounds.maxY - RESET_BUTTON_MARGIN;
      downloadSceneButton.right = resetAllButton.left - RESET_BUTTON_MARGIN;
      downloadSceneButton.centerY = resetAllButton.centerY;
      toolsAccordionBox.right = visibleBounds.maxX - RESET_BUTTON_MARGIN;
      toolsAccordionBox.top = visibleBounds.minY + RESET_BUTTON_MARGIN;
      infoButton.left = visibleBounds.minX + RESET_BUTTON_MARGIN;
      infoButton.centerY = resetAllButton.centerY;
      infoDialogNode.centerX = this.layoutBounds.centerX;
      infoDialogNode.bottom = infoButton.top - RESET_BUTTON_MARGIN;
    });

    // PDOM tab order: toolbox → tools → overlays → info / reset → help dialog
    this.addChild(
      new Node({
        pdomOrder: [
          pageControl,
          carousel,
          toolsAccordionBox,
          measuringTapeNode,
          protractorNode,
          this.editContainerNode,
          infoButton,
          downloadSceneButton,
          resetAllButton,
          infoDialogNode,
        ],
      }),
    );

    // ── Keyboard shortcuts ──────────────────────────────────────────────────
    // Delete / Backspace → remove the currently selected element (same as
    // clicking the trash icon), but only when no text input has focus.
    // Stored as a class field so it can be removed in dispose().
    this._handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement;
      const isTextInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (event.key === "Escape") {
        if (!isTextInput) {
          this.selectedElementProperty.value = null;
        }
        return;
      }

      if (
        tryHandleToolsPanelShortcut(event, isTextInput, {
          measuringTapeVisibleProperty,
          protractorVisibleProperty,
          extendedRaysProperty,
          gridVisibleProperty,
          snapToGridProperty,
        })
      ) {
        event.preventDefault();
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      if (isTextInput) {
        return;
      }
      const selected = this.selectedElementProperty.value;
      if (selected) {
        event.preventDefault();
        this._deleteElement?.(selected);
      }
    };
    window.addEventListener("keydown", this._handleKeyDown);

    // ── Initial simulation ──────────────────────────────────────────────────
    this.updateRayPropagation();
  }

  public reset(): void {
    // Deselect and hide the edit panel.
    this.selectedElementProperty.value = null;

    // Dispose every element view to release Emitter listeners, drag listeners,
    // and any other resources before removing from the scene graph.
    for (const view of this.elementViewMap.values()) {
      view.dispose();
    }

    // Remove all element views from both layers and clear the map.
    this.elementsLayer.removeAllChildren();
    this.dragLayer.removeAllChildren();
    this.elementViewMap.clear();
  }

  public override dispose(): void {
    window.removeEventListener("keydown", this._handleKeyDown);
    super.dispose();
  }

  public override step(_dt: number): void {
    this.updateRayPropagation();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  protected _setupView(element: OpticalElement, view: OpticalElementView): void {
    this.elementsLayer.addChild(view);
    this.elementViewMap.set(element.id, view);

    // For views that can change geometry via drag handles, sync the edit panel.
    if (view instanceof BaseOpticalElementView) {
      view.rebuildEmitter.addListener(() => this.editContainerNode.refresh());
    }

    // Tracks whether the view is currently in the drag layer (lifted above the carousel).
    // This is a reliable indicator that a body drag is in flight — used both for
    // reparenting and for the return-to-carousel detection.
    let inDragLayer = false;

    view.bodyDragListener.isPressedProperty.lazyLink((isPressed) => {
      if (isPressed) {
        // Reparent to the drag layer so the element renders above the carousel.
        this.elementsLayer.removeChild(view);
        this.dragLayer.addChild(view);
        inDragLayer = true;
      } else if (inDragLayer) {
        // Drag just ended.  Check whether the pointer drop position lands inside
        // the carousel.  We use the pointer's final global position rather than
        // view.globalBounds so that focal-point markers (which can be far from
        // the physical body) do not cause false returns.
        // bodyDragListener.dragListener.pointer is still set at this point in
        // the Scenery release sequence — it is cleared after isPressedProperty
        // fires — so this read is safe.
        const dropPoint = view.bodyDragListener.dragListener.pointer?.point ?? null;
        if (dropPoint && this._carousel?.globalBounds.containsPoint(dropPoint)) {
          inDragLayer = false;
          // _deleteElement removes the view from whichever layer holds it.
          this._deleteElement?.(element);
          return;
        }

        // Normal case: move back to the elements layer.
        this.dragLayer.removeChild(view);
        this.elementsLayer.addChild(view);
        inDragLayer = false;
      }
    });

    // Give each element an accessible name so screen readers can identify it.
    view.accessibleName = ElementTypeToAccessibleName(element.type);

    const SelectThis = (): void => {
      this.selectedElementProperty.value = element;
      this.editContainerNode.setViewRebuildCallback(() => {
        if (view instanceof BaseOpticalElementView) {
          view.rebuild();
        }
      });
    };

    view.addInputListener({
      // Pointer press selects the element.
      down: SelectThis,
      // Keyboard focus (Tab navigation) also selects it so the edit panel appears.
      focusin: SelectThis,
    });
  }

  private updateRayPropagation() {
    // During acquisition, run extra model-only simulation passes (no view update)
    // to accumulate more jittered samples into the detector's acquiredBins.
    const anyAcquiring = this.model.scene
      .getAllElements()
      .some((el) => el instanceof DetectorElement && el.isAcquiring);
    if (anyAcquiring) {
      for (let i = 0; i < ACQUISITION_PASSES_PER_FRAME; i++) {
        this.model.scene.invalidate();
        this.model.scene.simulate();
      }
    }

    // Final pass: simulate and update the view with the result.
    this.model.scene.invalidate();
    const result = this.model.scene.simulate();
    this.rayPropagationView.setSegments(result.segments);

    // Update detector chart panels with new bin data
    for (const [, view] of this.elementViewMap) {
      if (view instanceof DetectorView) {
        view.updateChart();
      }
    }

    return result;
  }
}

/**
 * Convert an element.type string (e.g. "IdealLens", "continuousSpectrumSource")
 * to a human-readable accessible name ("Ideal Lens", "Continuous Spectrum Source").
 */
function ElementTypeToAccessibleName(type: string): string {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

opticsLab.register("RayTracingCommonView", RayTracingCommonView);
