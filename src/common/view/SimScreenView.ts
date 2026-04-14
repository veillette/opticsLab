import { type BooleanProperty, Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Path } from "scenerystack/scenery";
import { GridNode, InfoButton, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { type Carousel, FlatAppearanceStrategy, RoundPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import { ACQUISITION_PASSES_PER_FRAME, PIXELS_PER_METER, RESET_BUTTON_MARGIN } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../../preferences/OpticsLabPreferencesModel.js";
import opticsLabQueryParameters from "../../preferences/opticsLabQueryParameters.js";
import { DetectorElement } from "../model/detectors/DetectorElement.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { RayTracingCommonModel } from "../model/SimModel.js";
import { BaseOpticalElementView } from "./BaseOpticalElementView.js";
import { CarouselPanel } from "./CarouselPanel.js";
import type { ComponentKey } from "./ComponentCarousel.js";
import { DetectorView } from "./detectors/DetectorView.js";
import { EditContainerNode } from "./EditContainerNode.js";
import { ImageOverlayNode } from "./ImageOverlayNode.js";
import { InfoDialogNode } from "./InfoDialogNode.js";
import { ObserverNode } from "./ObserverNode.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";
import { RayPropagationView } from "./RayPropagationView.js";
import { sceneHistoryRegistry } from "./SceneHistoryRegistry.js";
import { downloadSceneSVG } from "./SceneSVGExporter.js";
import { ToolsPanel } from "./ToolsPanel.js";
import { ViewOptionsModel } from "./ViewOptionsModel.js";
import { viewSnapState } from "./ViewSnapState.js";

/**
 * Wire two properties so that a change in either is immediately reflected in
 * the other, without triggering an infinite re-entrant loop.
 *
 * This replaces the repetitive `let blockXSync = false` pattern that appeared
 * three times in the constructor.  The sync is bidirectional because:
 *  - Preferences → scene keeps the simulation up-to-date when the user opens
 *    the preferences panel.
 *  - Scene → preferences keeps the preferences panel up-to-date when PhET-iO
 *    sets the scene property directly (e.g. via the studio UI or saved state).
 *
 * `propA.value` is written to `propB` on the first call so both start in sync.
 */
function syncBidirectional<T>(
  propA: { value: T; lazyLink: (cb: (v: T) => void) => void },
  propB: { value: T; lazyLink: (cb: (v: T) => void) => void },
): void {
  propB.value = propA.value;
  let syncing = false;
  propA.lazyLink((v) => {
    if (!syncing) {
      syncing = true;
      propB.value = v;
      syncing = false;
    }
  });
  propB.lazyLink((v) => {
    if (!syncing) {
      syncing = true;
      propA.value = v;
      syncing = false;
    }
  });
}

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
    handlesVisibleProperty: BooleanProperty;
    focalMarkersVisibleProperty: BooleanProperty;
    rayArrowsVisibleProperty: BooleanProperty;
    rayStubsEnabledProperty: BooleanProperty;
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
    handlesVisibleProperty,
    focalMarkersVisibleProperty,
    rayArrowsVisibleProperty,
    rayStubsEnabledProperty,
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

/**
 * Ctrl/Cmd+Z → undo; Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z → redo.
 * Returns true if the key was handled.
 */
function tryHandleUndoRedo(event: KeyboardEvent, isTextInput: boolean): boolean {
  if (isTextInput || !(event.ctrlKey || event.metaKey)) {
    return false;
  }
  const history = sceneHistoryRegistry.history;
  if (!history) {
    return false;
  }
  if (event.key === "z" && !event.shiftKey) {
    event.preventDefault();
    history.undo();
    return true;
  }
  if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
    event.preventDefault();
    history.redo();
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

  /** Per-screen view state (handles visibility, ray arrows, focal markers, etc.). */
  protected readonly viewOptions: ViewOptionsModel;

  /**
   * Maps element id → its Tandem so we can remove it from the global tandem tree on deletion.
   * RichDragListener is not a PhetioObject, so its tandem's dispose() is never triggered
   * automatically; without this cleanup the parent's children map retains orphaned entries.
   */
  protected readonly elementTandemMap = new Map<string, Tandem>();

  /** Carousel toolbox – set during construction; used in _setupView for return-to-delete. */
  private _carousel: Carousel | null = null;

  /** Central delete handler shared between EditContainerNode and return-to-carousel. */
  private _deleteElement: ((element: OpticalElement) => void) | null = null;

  /** Stored so it can be removed from window on dispose. */
  private _handleKeyDown!: (event: KeyboardEvent) => void;

  /**
   * Remove an element's tandem from the global tandem tree so it and its children
   * can be garbage-collected.  Tandem.dispose() is private, so we directly delete
   * the entry from the parent's public `children` map — the only external strong
   * reference that keeps the sub-tree alive after the view is disposed.
   */
  protected static _cleanupElementTandem(tandem: Tandem): void {
    if (tandem.supplied && tandem.parentTandem) {
      delete (tandem.parentTandem.children as Record<string, Tandem | undefined>)[tandem.name];
    }
  }

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
    sceneHistoryRegistry.setHistory(model.scene.history);
    const tandem = options?.tandem;
    const uiStrings = StringManager.getInstance().getUIStrings();

    this.viewOptions = new ViewOptionsModel(tandem?.createTandem("viewOptions"));

    // ── Model-View Transform ────────────────────────────────────────────────
    // Maps model origin (0, 0) to the centre of the visible play area.
    // 100 px = 1 m; y-axis is inverted (model +y = up, view +y = down).
    this.modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      Vector2.ZERO,
      this.layoutBounds.center,
      PIXELS_PER_METER,
    );
    const modelViewTransform = this.modelViewTransform;

    this.selectedElementProperty = new Property<OpticalElement | null>(null, {
      // The fuzz tester can fire overlapping input events (e.g. carousel drag-create
      // sets null while a simultaneous down event selects an element) during a single
      // dispatch cycle, causing reentrant sets. Allow reentry with queued notifications.
      reentrant: true,
    });

    // ── Grid (model + preferences stay in sync for PhET-iO and global prefs) ─
    // showGrid is initialised from a query parameter (one-time override only).
    model.scene.showGridProperty.value = opticsLabQueryParameters.showGrid;

    // snapToGrid, gridSpacing, and maxRayDepth are duplicated between the
    // preferences model and the scene so that both the preferences panel UI
    // and PhET-iO state capture see up-to-date values.  syncBidirectional
    // handles the mutual update without re-entrant loops.
    syncBidirectional(_opticsLabPreferences.snapToGridProperty, model.scene.snapToGridProperty);
    syncBidirectional(_opticsLabPreferences.gridSpacingProperty, model.scene.gridSizeProperty);
    syncBidirectional(_opticsLabPreferences.maxRayDepthProperty, model.scene.maxRayDepthProperty);

    // ── Partial reflection (global toggle via preferences) ──────────────────
    // These are preferences-only toggles; there is no PhET-iO override path
    // for the scene copies, so a one-directional link is sufficient.
    _opticsLabPreferences.partialReflectionEnabledProperty.link((v) => {
      model.scene.partialReflectionEnabledProperty.value = v;
    });

    _opticsLabPreferences.lensRimBlockingProperty.link((v) => {
      model.scene.lensRimBlockingProperty.value = v;
    });

    const gridVisibleProperty = model.scene.showGridProperty;
    const gridContainer = new Node();
    gridVisibleProperty.linkAttribute(gridContainer, "visible");
    this.addChild(gridContainer);

    // Build the grid so it covers the entire visibleBounds.  Lines are always
    // drawn at integer multiples of spacing from Vector2.ZERO (= layout centre),
    // so lines inside layoutBounds never shift when the window is resized —
    // resizing only adds or removes lines at the outer edges.
    const gridMvtProperty = new Property(modelViewTransform);
    const buildGrid = (spacing: number) => {
      const vb = this.visibleBoundsProperty.value;
      const cx = this.layoutBounds.centerX;
      const cy = this.layoutBounds.centerY;
      const halfWidthPx = Math.max(cx - vb.left, vb.right - cx);
      const halfHeightPx = Math.max(cy - vb.top, vb.bottom - cy);
      const halfM = Math.max(halfWidthPx, halfHeightPx) / PIXELS_PER_METER;
      const linesPerSide = Math.ceil(halfM / spacing) + 1;
      // Dispose the old GridNode (and its internal Line children) before replacing.
      for (const child of [...gridContainer.children]) {
        child.dispose();
      }
      gridContainer.addChild(
        new GridNode(
          gridMvtProperty,
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
    this.rayPropagationView = new RayPropagationView(
      this.visibleBoundsProperty.value,
      modelViewTransform,
      this.viewOptions,
    );
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

      // Dispose the view while it is still connected to the display tree so that
      // the Display's deferred Instance/PDOMInstance cleanup sees the full
      // subtree removal.  Node.dispose() calls detach() internally, which removes
      // the view from whichever layer (elements or drag) currently holds it.
      const view = this.elementViewMap.get(element.id);
      if (view) {
        this.elementViewMap.delete(element.id);
        view.dispose();
      }

      // Remove the element tandem from the global tandem tree. RichDragListener
      // is not a PhetioObject, so its tandem children are never auto-cleaned.
      const et = this.elementTandemMap.get(element.id);
      if (et) {
        RayTracingCommonView._cleanupElementTandem(et);
        this.elementTandemMap.delete(element.id);
      }

      // Remove from model.
      model.scene.removeElement(element.id);
    };

    // ── Edit Container Node ───────────────────────────────────────────────
    this.editContainerNode = new EditContainerNode(
      this.selectedElementProperty,
      (element) => this._deleteElement?.(element),
      (element) => {
        const view = this.elementViewMap.get(element.id);
        if (view instanceof BaseOpticalElementView) {
          view.rebuild();
        }
      },
      this.visibleBoundsProperty,
      _opticsLabPreferences.signConventionProperty,
      _opticsLabPreferences.useCurvatureDisplayProperty,
    );
    this.addChild(this.editContainerNode);

    // ── Component Carousel (toolbox) ─────────────────────────────────────────
    // CarouselPanel owns the Carousel, PageControl, GridScaleIndicatorNode, and
    // their layout listener.  _carousel is kept as a class field so _setupView
    // can test whether a drop target is inside the toolbox.
    const carouselPanel = new CarouselPanel(
      modelViewTransform,
      (p) => this.globalToLocalPoint(p),
      (element) => {
        // Deselect any currently selected element so the edit panel hides.
        this.selectedElementProperty.value = null;

        // Create and register the view BEFORE adding to the model so that
        // the elementCreatedEmitter listener (used for undo/redo) sees the
        // view already exists and skips duplicate creation.
        const tandemName = element.id.replace(/-(\d+)$/, (_, n) => n);
        const elementTandem = tandem?.createTandem(tandemName) ?? Tandem.OPTIONAL;
        const view = createOpticalElementView(element, modelViewTransform, elementTandem, this.viewOptions);
        if (view) {
          this.elementTandemMap.set(element.id, elementTandem);
          this._setupView(element, view);
        }

        // Add to model (fires elementCreatedEmitter — listener will no-op
        // because the view is already in elementViewMap).
        model.scene.addElement(element);

        return view;
      },
      model,
      this.visibleBoundsProperty,
      tandem,
      carouselComponents,
    );
    this._carousel = carouselPanel.carousel;
    this.addChild(carouselPanel);

    // ── Observer node (interactive, above elements layer) ────────────────────
    this.observerNode = new ObserverNode(model.scene.observerProperty, modelViewTransform);
    // Visibility tracks model mode so observer node appears/disappears without
    // ToolsPanel needing a direct reference to this node.
    model.scene.modeProperty.link((mode) => {
      this.observerNode.visible = mode === "observer";
    });
    this.addChild(this.observerNode);

    // Drag layer sits above the carousel so elements being dragged are never
    // occluded by the toolbox panel.
    this.addChild(this.dragLayer);

    // ── Populate initial elements ──────────────────────────────────────────
    for (const element of model.scene.getAllElements()) {
      const tandemName = element.id.replace(/-(\d+)$/, (_, n) => n);
      const elementTandem = tandem?.createTandem(tandemName) ?? Tandem.OPTIONAL;
      const elementView = createOpticalElementView(element, modelViewTransform, elementTandem, this.viewOptions);
      if (elementView) {
        this.elementTandemMap.set(element.id, elementTandem);
        this._setupView(element, elementView);
      }
    }

    // ── Model→View synchronization (undo/redo) ─────────────────────────────
    // When the model adds an element (e.g. redo of a remove, or undo of a
    // delete), create the corresponding view if one doesn't already exist.
    model.scene.opticalElementsGroup.elementCreatedEmitter.addListener((wrapper) => {
      const element = wrapper.opticalElement;
      if (this.elementViewMap.has(element.id)) {
        return; // view already exists (normal add via carousel)
      }
      const tn = element.id.replace(/-(\d+)$/, (_, n: string) => n);
      const et = tandem?.createTandem(tn) ?? Tandem.OPTIONAL;
      const view = createOpticalElementView(element, modelViewTransform, et, this.viewOptions);
      if (view) {
        this.elementTandemMap.set(element.id, et);
        this._setupView(element, view);
      }
    });

    // When the model removes an element (e.g. undo of an add), dispose the
    // corresponding view so it can be garbage collected.
    model.scene.opticalElementsGroup.elementDisposedEmitter.addListener((wrapper) => {
      const element = wrapper.opticalElement;
      const view = this.elementViewMap.get(element.id);
      if (!view) {
        return; // already cleaned up (normal delete via _deleteElement)
      }
      if (this.selectedElementProperty.value === element) {
        this.selectedElementProperty.value = null;
      }
      // Dispose while still in the display tree — Node.dispose() calls detach()
      // to remove from whichever layer holds it, and the Display can properly
      // clean up Instances/PDOMInstances for the entire subtree.
      this.elementViewMap.delete(element.id);
      view.dispose();
      const et = this.elementTandemMap.get(element.id);
      if (et) {
        RayTracingCommonView._cleanupElementTandem(et);
        this.elementTandemMap.delete(element.id);
      }
    });

    // ── Tools Panel ───────────────────────────────────────────────────────────
    // ToolsPanel owns the measuring tape, protractor, all toggle checkboxes,
    // the ray-density control, and the accordion box.  It pins the accordion to
    // the upper-right safe area via visibleBoundsProperty internally.
    const toolsPanel = new ToolsPanel(
      model,
      modelViewTransform,
      this.selectedElementProperty,
      this.visibleBoundsProperty,
      _opticsLabPreferences.snapToGridProperty,
      this.viewOptions,
      tandem,
    );
    this.addChild(toolsPanel);

    // ── Reset Button ────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        _opticsLabPreferences.snapToGridProperty.reset();
        _opticsLabPreferences.gridSpacingProperty.reset();
        this.reset();
        toolsPanel.reset();
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
            showHandles: this.viewOptions.handlesVisibleProperty.value,
            measuringTape: {
              visible: toolsPanel.measuringTapeVisibleProperty.value,
              basePosition: toolsPanel.measuringTapeNode.basePositionProperty.value.copy(),
              tipPosition: toolsPanel.measuringTapeNode.tipPositionProperty.value.copy(),
            },
            protractor: {
              visible: toolsPanel.protractorVisibleProperty.value,
              center: modelViewTransform.viewToModelPosition(toolsPanel.protractorNode.center),
              angle: toolsPanel.protractorNode.angleProperty.value,
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

    // Pin the controls (excluding the tools accordion, which ToolsPanel
    // positions itself) to the visible (safe) area.
    this.visibleBoundsProperty.link((visibleBounds) => {
      resetAllButton.right = visibleBounds.maxX - RESET_BUTTON_MARGIN;
      resetAllButton.bottom = visibleBounds.maxY - RESET_BUTTON_MARGIN;
      downloadSceneButton.right = resetAllButton.left - RESET_BUTTON_MARGIN;
      downloadSceneButton.centerY = resetAllButton.centerY;
      infoButton.left = visibleBounds.minX + RESET_BUTTON_MARGIN;
      infoButton.centerY = resetAllButton.centerY;
      infoDialogNode.centerX = this.layoutBounds.centerX;
      infoDialogNode.bottom = infoButton.top - RESET_BUTTON_MARGIN;
    });

    // PDOM tab order: toolbox → tools → overlays → info / reset → help dialog
    this.addChild(
      new Node({
        pdomOrder: [
          carouselPanel.pageControl,
          carouselPanel.carousel,
          toolsPanel.accordionBox,
          toolsPanel.measuringTapeNode,
          toolsPanel.protractorNode,
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

      if (tryHandleUndoRedo(event, isTextInput)) {
        return;
      }

      if (
        tryHandleToolsPanelShortcut(event, isTextInput, {
          measuringTapeVisibleProperty: toolsPanel.measuringTapeVisibleProperty,
          protractorVisibleProperty: toolsPanel.protractorVisibleProperty,
          extendedRaysProperty: toolsPanel.extendedRaysProperty,
          gridVisibleProperty: model.scene.showGridProperty,
          snapToGridProperty: _opticsLabPreferences.snapToGridProperty,
          handlesVisibleProperty: this.viewOptions.handlesVisibleProperty,
          focalMarkersVisibleProperty: this.viewOptions.focalMarkersVisibleProperty,
          rayArrowsVisibleProperty: this.viewOptions.rayArrowsVisibleProperty,
          rayStubsEnabledProperty: this.viewOptions.rayStubsEnabledProperty,
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

    // Dispose every element view while still in the display tree so the Display
    // can properly clean up Instances/PDOMInstances.  Node.dispose() → detach()
    // removes each view from its parent layer automatically.
    for (const view of this.elementViewMap.values()) {
      view.dispose();
    }
    this.elementViewMap.clear();

    // Clean up all element tandems from the global tandem tree.
    for (const et of this.elementTandemMap.values()) {
      RayTracingCommonView._cleanupElementTandem(et);
    }
    this.elementTandemMap.clear();
  }

  public override dispose(): void {
    window.removeEventListener("keydown", this._handleKeyDown);
    super.dispose();
    this.viewOptions.dispose();
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
      const rebuildListener = (): void => {
        this.editContainerNode.refresh();
        this._clearAllDetectorAcquisitions();
        // Element positions are plain objects (not axon Properties), so dragging
        // does not automatically mark the scene dirty. Invalidate here so the
        // ray tracer re-runs on the next step() rather than showing a stale result.
        this.model.scene.invalidate();
      };
      view.rebuildEmitter.addListener(rebuildListener);
      view.disposeEmitter.addListener(() => {
        view.rebuildEmitter.removeListener(rebuildListener);
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

    const pressedListener = (isPressed: boolean): void => {
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
    };
    view.bodyDragListener.isPressedProperty.lazyLink(pressedListener);

    // Unlink when the view is disposed so the closure (which captures view,
    // element, and this SimScreenView) doesn't prevent garbage collection.
    view.disposeEmitter.addListener(() => {
      view.bodyDragListener.isPressedProperty.unlink(pressedListener);
    });

    // Give each element an accessible name so screen readers can identify it.
    view.accessibleName = ElementTypeToAccessibleName(element.type);

    const SelectThis = (): void => {
      this.selectedElementProperty.value = element;
    };

    const selectionInputListener = {
      // Pointer press selects the element.
      down: SelectThis,
      // Keyboard focus (Tab navigation) also selects it so the edit panel appears.
      focusin: SelectThis,
    };
    view.addInputListener(selectionInputListener);
    view.disposeEmitter.addListener(() => {
      view.removeInputListener(selectionInputListener);
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
        // No invalidate() needed: simulate() bypasses its cache when anyAcquiring,
        // and jitter is applied fresh each call via the jitter: anyAcquiring config flag.
        this.model.scene.simulate();
      }
    }

    // Final pass: simulate and update the view with the result.
    // No unconditional invalidate() here — the scene marks itself dirty via
    // rebuildEmitter (drag) or its Multilink (property changes). Removing the
    // forced invalidation allows the cached TraceResult to be reused for static
    // scenes, eliminating per-frame allocation of TracedSegment arrays and the
    // deduplication Sets in findImagesInSequence.
    const result = this.model.scene.simulate();
    const currentMode = this.model.scene.modeProperty.value;
    this.rayPropagationView.setSegments(result.segments, currentMode);

    // Update image-position overlay in images and observer modes.
    if (currentMode === "images" || currentMode === "observer") {
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
 * Convert an element.type string (e.g. "IdealLens", "ContinuousSpectrumSource")
 * to a human-readable accessible name ("Ideal Lens", "Continuous Spectrum Source").
 */
function ElementTypeToAccessibleName(type: string): string {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

opticsLab.register("RayTracingCommonView", RayTracingCommonView);
