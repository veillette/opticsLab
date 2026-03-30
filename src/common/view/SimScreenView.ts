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
  GRID_SCALE_INDICATOR_MARGIN,
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
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { RayTracingCommonModel } from "../model/SimModel.js";
import { BaseOpticalElementView } from "./BaseOpticalElementView.js";
import { type ComponentKey, createComponentCarousel } from "./ComponentCarousel.js";
import { DetectorView } from "./detectors/DetectorView.js";
import { EditContainerNode } from "./EditContainerNode.js";
import { focalMarkersVisibleProperty } from "./FocalMarkersVisibleProperty.js";
import { GridScaleIndicatorNode } from "./GridScaleIndicatorNode.js";
import { handlesVisibleProperty } from "./HandlesVisibleProperty.js";
import { ImageOverlayNode } from "./ImageOverlayNode.js";
import { InfoDialogNode } from "./InfoDialogNode.js";
import { DEFAULT_OBSERVER, ObserverNode } from "./ObserverNode.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";
import { rayArrowsVisibleProperty } from "./RayArrowsVisibleProperty.js";
import { RayPropagationView } from "./RayPropagationView.js";
import { rayStubsEnabledProperty } from "./RayStubsProperty.js";
import { downloadSceneSVG } from "./SceneSVGExporter.js";
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
  if (letter === "a") {
    rayArrowsVisibleProperty.toggle();
    return true;
  }
  if (letter === "r") {
    rayStubsEnabledProperty.toggle();
    return true;
  }
  return false;
}

export class RayTracingCommonView extends ScreenView {
  private readonly model: RayTracingCommonModel;
  private readonly rayPropagationView: RayPropagationView;
  private readonly imageOverlayNode: ImageOverlayNode;
  private readonly observerNode: ObserverNode;
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
    // Drive the scene's property from the preference so the model layer controls
    // the flag, avoiding direct view→model static mutation.
    _opticsLabPreferences.partialReflectionEnabledProperty.link((v) => {
      model.scene.partialReflectionEnabledProperty.value = v;
    });

    const gridVisibleProperty = model.scene.showGridProperty;
    const gridContainer = new Node();
    gridVisibleProperty.linkAttribute(gridContainer, "visible");
    this.addChild(gridContainer);

    // Build the grid so it covers the entire visibleBounds.  Lines are always
    // drawn at integer multiples of spacing from Vector2.ZERO (= layout centre),
    // so lines inside layoutBounds never shift when the window is resized —
    // resizing only adds or removes lines at the outer edges.
    const buildGrid = (spacing: number) => {
      const vb = this.visibleBoundsProperty.value;
      const cx = this.layoutBounds.centerX;
      const cy = this.layoutBounds.centerY;
      const halfWidthPx = Math.max(cx - vb.left, vb.right - cx);
      const halfHeightPx = Math.max(cy - vb.top, vb.bottom - cy);
      const halfM = Math.max(halfWidthPx, halfHeightPx) / PIXELS_PER_METER;
      const linesPerSide = Math.ceil(halfM / spacing) + 1;
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
    this.visibleBoundsProperty.lazyLink(() => buildGrid(model.scene.gridSizeProperty.value));

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

    // ── Image overlay (above rays, below element handles) ────────────────────
    this.imageOverlayNode = new ImageOverlayNode(modelViewTransform);
    this.addChild(this.imageOverlayNode);

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

    // ── Grid Scale Indicator ──────────────────────────────────────────────
    // Shown below the carousel whenever the grid is visible.  Its width
    // equals one grid spacing in pixels; left edge is snapped to the nearest
    // grid line that keeps it under the carousel panel.
    const gridScaleIndicatorNode = new GridScaleIndicatorNode();
    gridScaleIndicatorNode.rebuild(model.scene.gridSizeProperty.value, modelViewTransform);
    gridVisibleProperty.linkAttribute(gridScaleIndicatorNode, "visible");
    this.addChild(gridScaleIndicatorNode);

    const positionGridScaleIndicator = (): void => {
      const spacing = model.scene.gridSizeProperty.value;
      // Find the grid-line index whose view-x is just left of the carousel centre.
      const carouselCenterXModel = modelViewTransform.viewToModelX(carousel.centerX);
      const leftIndex = Math.floor(carouselCenterXModel / spacing);
      // node.x places local x=0 (the left tick) exactly on the gridline,
      // rather than node.left which would shift the background pill's edge there.
      gridScaleIndicatorNode.x = modelViewTransform.modelToViewX(leftIndex * spacing);
      gridScaleIndicatorNode.top = carousel.bottom + GRID_SCALE_INDICATOR_MARGIN;
    };

    model.scene.gridSizeProperty.lazyLink((spacing) => {
      gridScaleIndicatorNode.rebuild(spacing, modelViewTransform);
      positionGridScaleIndicator();
    });

    // Keep the page control and carousel pinned to the left edge of the visible (safe) area.
    this.visibleBoundsProperty.link((visibleBounds) => {
      pageControl.left = visibleBounds.minX + CAROUSEL_PAGE_CONTROL_MARGIN;
      pageControl.centerY = visibleBounds.centerY;
      carousel.left = pageControl.right + CAROUSEL_OFFSET_FROM_PAGE_CONTROL;
      carousel.centerY = visibleBounds.centerY;
      positionGridScaleIndicator();
    });

    // ── Observer node (interactive, above elements layer) ────────────────────
    this.observerNode = new ObserverNode(model.scene.observerProperty, modelViewTransform);
    this.observerNode.visible = false;
    this.addChild(this.observerNode);

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

    // ── Ray display mode checkboxes ───────────────────────────────────────────
    // Each checkbox corresponds to one non-default ViewMode. Checking one sets
    // that mode; un-checking reverts to "rays". All three stay mutually exclusive
    // via the shared modeProperty as single source of truth.
    const extendedRaysProperty = new BooleanProperty(model.scene.modeProperty.value === "extended", {
      ...(tandem && { tandem: tandem.createTandem("extendedRaysVisibleProperty") }),
    });
    const showImagesProperty = new BooleanProperty(model.scene.modeProperty.value === "images", {
      ...(tandem && { tandem: tandem.createTandem("showImagesProperty") }),
    });
    const observerModeProperty = new BooleanProperty(model.scene.modeProperty.value === "observer", {
      ...(tandem && { tandem: tandem.createTandem("observerModeProperty") }),
    });

    let blockModeSync = false;

    const syncCheckboxesFromMode = (mode: string) => {
      if (blockModeSync) {
        return;
      }
      blockModeSync = true;
      extendedRaysProperty.value = mode === "extended";
      showImagesProperty.value = mode === "images";
      observerModeProperty.value = mode === "observer";
      this.observerNode.visible = mode === "observer";
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
      makeCheckboxContent(measuringTapeIcon(), uiStrings.measuringTapeStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("measuringTapeCheckbox") },
    );
    const protractorCheckbox = new Checkbox(
      protractorVisibleProperty,
      makeCheckboxContent(protractorIcon(), uiStrings.protractorStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("protractorCheckbox") },
    );
    const extendedRaysCheckbox = new Checkbox(
      extendedRaysProperty,
      makeCheckboxContent(extendedRaysIcon(), uiStrings.extendedRaysStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("extendedRaysCheckbox") },
    );
    const showHandlesCheckbox = new Checkbox(
      handlesVisibleProperty,
      makeCheckboxContent(dragHandleIcon(), uiStrings.showHandlesStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("showHandlesCheckbox") },
    );
    const focalMarkersCheckbox = new Checkbox(
      focalMarkersVisibleProperty,
      makeCheckboxContent(focalPointIcon(), uiStrings.focalMarkersStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("focalMarkersCheckbox") },
    );
    const rayArrowsCheckbox = new Checkbox(
      rayArrowsVisibleProperty,
      makeCheckboxContent(rayArrowsIcon(), uiStrings.showRayArrowsStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("rayArrowsCheckbox") },
    );
    const rayStubsCheckbox = new Checkbox(
      rayStubsEnabledProperty,
      makeCheckboxContent(rayStubsIcon(), uiStrings.rayStubsStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("rayStubsCheckbox") },
    );
    const gridCheckbox = new Checkbox(
      gridVisibleProperty,
      makeCheckboxContent(gridIcon(), uiStrings.gridStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("showGridCheckbox") },
    );
    const snapCheckbox = new Checkbox(
      snapToGridProperty,
      makeCheckboxContent(snapToGridIcon(), prefStrings.snapToGridStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("snapToGridCheckbox"), enabledProperty: gridVisibleProperty },
    );
    const showImagesCheckbox = new Checkbox(
      showImagesProperty,
      makeCheckboxContent(showImagesIcon(), uiStrings.showImagesStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("showImagesCheckbox") },
    );
    const observerModeCheckbox = new Checkbox(
      observerModeProperty,
      makeCheckboxContent(observerIcon(), uiStrings.observerModeStringProperty, labelOptions),
      { ...checkboxOptions, ...checkboxTandem("observerModeCheckbox") },
    );

    // ── Tools / Options Accordion Box ────────────────────────────────────────
    const accordionContent = new VBox({
      spacing: ACCORDION_CONTENT_SPACING,
      align: "left",
      children: [
        measuringTapeCheckbox,
        protractorCheckbox,
        extendedRaysCheckbox,
        showImagesCheckbox,
        observerModeCheckbox,
        showHandlesCheckbox,
        focalMarkersCheckbox,
        rayArrowsCheckbox,
        rayStubsCheckbox,
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
        rayArrowsVisibleProperty.reset();
        rayStubsEnabledProperty.reset();
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
              center: modelViewTransform.viewToModelPosition(protractorNode.center),
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

    // ── Clear detector acquisitions when scene settings or element list change ──
    this.model.scene.sceneChangedEmitter.addListener(() => this._clearAllDetectorAcquisitions());

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

    // For views that can change geometry via drag handles, sync the edit panel
    // and clear any completed detector acquisitions (scene geometry changed).
    if (view instanceof BaseOpticalElementView) {
      view.rebuildEmitter.addListener(() => {
        this.editContainerNode.refresh();
        this._clearAllDetectorAcquisitions();
      });
    }

    // Selection highlight: show a dashed yellow frame around the active element.
    if (view instanceof BaseOpticalElementView) {
      const baseView = view;
      const selectionListener = (newEl: OpticalElement | null): void => {
        baseView.setSelected(newEl === element);
      };
      this.selectedElementProperty.link(selectionListener);
      // Unlink when the view is disposed so deleted elements don't leak.
      baseView.disposeEmitter.addListener(() => {
        this.selectedElementProperty.unlink(selectionListener);
      });
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

  /** Clear completed acquisition data on all detectors (scene has changed). */
  private _clearAllDetectorAcquisitions(): void {
    for (const element of this.model.scene.getAllElements()) {
      if (element instanceof DetectorElement) {
        element.clearAcquisition();
      }
    }
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

    // Update image-position overlay when in images mode.
    if (this.model.scene.modeProperty.value === "images") {
      this.imageOverlayNode.setImages(result.images);
    } else {
      this.imageOverlayNode.setImages([]);
    }

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
