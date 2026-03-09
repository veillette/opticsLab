import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { Dimension2, Range, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Text } from "scenerystack/scenery";
import { GridNode, NumberControl, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { type Carousel, Checkbox, PageControl, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  DEFAULT_RAY_DENSITY,
  PANEL_CORNER_RADIUS,
  PANEL_X_MARGIN,
  PANEL_Y_MARGIN,
  PIXELS_PER_METER,
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
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { SimModel } from "../model/SimModel.js";
import { LineBlockerView } from "./blockers/LineBlockerView.js";
import { createComponentCarousel } from "./ComponentCarousel.js";
import { EditContainerNode } from "./EditContainerNode.js";
import { IdealLensView } from "./glass/IdealLensView.js";
import { SphericalLensView } from "./glass/SphericalLensView.js";
import { BeamSourceView } from "./light-sources/BeamSourceView.js";
import { ArcMirrorView } from "./mirrors/ArcMirrorView.js";
import { IdealCurvedMirrorView } from "./mirrors/IdealCurvedMirrorView.js";
import { SegmentMirrorView } from "./mirrors/SegmentMirrorView.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";
import { RayPropagationView } from "./RayPropagationView.js";
import { setGridSpacingM, setSnapToGridProperty } from "./ViewHelpers.js";

export class SimScreenView extends ScreenView {
  private readonly model: SimModel;
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

  public constructor(model: SimModel, _opticsLabPreferences: OpticsLabPreferencesModel, options?: ScreenViewOptions) {
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

    // ── Grid ────────────────────────────────────────────────────────────────
    const gridVisibleProperty = new BooleanProperty(false);
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
      setGridSpacingM(spacing);
    };
    buildGrid(_opticsLabPreferences.gridSpacingProperty.value);
    _opticsLabPreferences.gridSpacingProperty.lazyLink(buildGrid);

    // Snap-to-grid is independent of grid visibility but disabled when grid is hidden.
    const snapToGridProperty = new BooleanProperty(false);
    // Hide the grid → also turn off snap.
    gridVisibleProperty.lazyLink((visible) => {
      if (!visible) {
        snapToGridProperty.reset();
      }
    });
    setSnapToGridProperty(snapToGridProperty);

    // ── Ray Propagation Layer (behind elements so rays don't block handles) ─
    this.rayPropagationView = new RayPropagationView(this.layoutBounds, modelViewTransform);
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
      }

      // Remove from model.
      model.scene.removeElement(element.id);
    };

    // ── Edit Container Node ───────────────────────────────────────────────
    this.editContainerNode = new EditContainerNode(
      this.selectedElementProperty,
      (element) => this._deleteElement?.(element),
      this.visibleBoundsProperty,
    );
    this.addChild(this.editContainerNode);

    // ── Component Carousel (toolbox) ─────────────────────────────────────────
    // Created before the initial-element loop so _setupView can reference it
    // for return-to-carousel deletion detection.
    const carousel = createComponentCarousel(
      modelViewTransform,
      (p) => this.globalToLocalPoint(p),
      (element) => {
        // Add to model
        model.scene.addElement(element);

        // Create and add corresponding view
        const view = createOpticalElementView(element, modelViewTransform);
        if (view) {
          this._setupView(element, view);
        }
        return view;
      },
    );
    this._carousel = carousel;
    this.addChild(carousel);

    const pageControl = new PageControl(carousel.pageNumberProperty, carousel.numberOfPagesProperty, {
      interactive: true,
      orientation: "vertical",
      dotRadius: 4,
      dotSpacing: 8,
      currentPageFill: OpticsLabColors.pageControlCurrentFillProperty,
      currentPageStroke: null,
      pageFill: OpticsLabColors.pageControlInactiveFillProperty,
      pageStroke: null,
      tandem: Tandem.OPT_OUT,
    });
    this.addChild(pageControl);

    // Keep the page control and carousel pinned to the left edge of the visible (safe) area.
    this.visibleBoundsProperty.link((visibleBounds) => {
      pageControl.left = visibleBounds.minX + 8;
      pageControl.centerY = visibleBounds.centerY;
      carousel.left = pageControl.right + 6;
      carousel.centerY = visibleBounds.centerY;
    });

    // Drag layer sits above the carousel so elements being dragged are never
    // occluded by the toolbox panel.
    this.addChild(this.dragLayer);

    // ── Populate initial elements ──────────────────────────────────────────
    for (const element of model.scene.getAllElements()) {
      const elementView = createOpticalElementView(element, modelViewTransform);
      if (elementView) {
        this._setupView(element, elementView);
      }
    }

    // ── Ray Density Control ──────────────────────────────────────────────────
    const densityRange = new Range(RAY_DENSITY_MIN, RAY_DENSITY_MAX);
    const rayDensityProperty = new NumberProperty(DEFAULT_RAY_DENSITY, {
      range: densityRange,
      tandem: Tandem.OPT_OUT,
    });
    rayDensityProperty.lazyLink((density) => {
      model.scene.setRayDensity(density);
    });

    const densityControl = new NumberControl("Ray Density", rayDensityProperty, densityRange, {
      delta: 0.05,
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
        tandem: Tandem.OPT_OUT,
      },
      tandem: Tandem.OPT_OUT,
    });

    const densityPanel = new Panel(densityControl, {
      fill: OpticsLabColors.panelFillProperty,
      stroke: OpticsLabColors.panelStrokeProperty,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
    });

    // ── Reset Button ────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
        rayDensityProperty.reset();
        gridVisibleProperty.reset();
        snapToGridProperty.reset();
      },
      ...(tandem && { tandem: tandem.createTandem("resetAllButton") }),
    });
    this.addChild(resetAllButton);
    this.addChild(densityPanel);

    // ── Grid Checkbox ────────────────────────────────────────────────────────
    const gridCheckbox = new Checkbox(
      gridVisibleProperty,
      new Text(uiStrings.gridStringProperty, {
        fill: OpticsLabColors.overlayLabelFillProperty,
        font: "12px sans-serif",
      }),
      {
        checkboxColor: OpticsLabColors.overlayLabelFillProperty,
        checkboxColorBackground: OpticsLabColors.overlayInputBackgroundProperty,
        tandem: Tandem.OPT_OUT,
      },
    );
    this.addChild(gridCheckbox);

    // ── Snap to Grid Checkbox (enabled only when grid is visible) ────────────
    const snapCheckbox = new Checkbox(
      snapToGridProperty,
      new Text(prefStrings.snapToGridStringProperty, {
        fill: OpticsLabColors.overlayLabelFillProperty,
        font: "12px sans-serif",
      }),
      {
        checkboxColor: OpticsLabColors.overlayLabelFillProperty,
        checkboxColorBackground: OpticsLabColors.overlayInputBackgroundProperty,
        enabledProperty: gridVisibleProperty,
        tandem: Tandem.OPT_OUT,
      },
    );
    this.addChild(snapCheckbox);

    // Pin the bottom-right controls to the visible (safe) area.
    this.visibleBoundsProperty.link((visibleBounds) => {
      resetAllButton.right = visibleBounds.maxX - RESET_BUTTON_MARGIN;
      resetAllButton.bottom = visibleBounds.maxY - RESET_BUTTON_MARGIN;
      densityPanel.right = resetAllButton.left - 12;
      densityPanel.centerY = resetAllButton.centerY;
      gridCheckbox.right = densityPanel.left - 12;
      gridCheckbox.centerY = resetAllButton.centerY;
      snapCheckbox.right = gridCheckbox.left - 12;
      snapCheckbox.centerY = resetAllButton.centerY;
    });

    // ── Keyboard shortcuts ──────────────────────────────────────────────────
    // Delete / Backspace → remove the currently selected element (same as
    // clicking the trash icon), but only when no text input has focus.
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      const selected = this.selectedElementProperty.value;
      if (selected) {
        event.preventDefault();
        this._deleteElement?.(selected);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // ── Initial simulation ──────────────────────────────────────────────────
    this.updateRayPropagation();
  }

  public reset(): void {
    // Deselect and hide the edit panel.
    this.selectedElementProperty.value = null;

    // Remove all element views from both layers and clear the map.
    this.elementsLayer.removeAllChildren();
    this.dragLayer.removeAllChildren();
    this.elementViewMap.clear();
  }

  public override step(_dt: number): void {
    this.updateRayPropagation();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _setupView(element: OpticalElement, view: OpticalElementView): void {
    this.elementsLayer.addChild(view);
    this.elementViewMap.set(element.id, view);

    // For views that can change geometry via drag handles, sync the edit panel.
    if (view instanceof ArcMirrorView) {
      view.onRebuild = () => this.editContainerNode.refresh();
    } else if (view instanceof SphericalLensView) {
      view.onRebuild = () => this.editContainerNode.refresh();
    } else if (view instanceof LineBlockerView) {
      view.onRebuild = () => this.editContainerNode.refresh();
    } else if (view instanceof SegmentMirrorView) {
      view.onRebuild = () => this.editContainerNode.refresh();
    } else if (view instanceof IdealLensView) {
      view.onRebuild = () => this.editContainerNode.refresh();
    } else if (view instanceof IdealCurvedMirrorView) {
      view.onRebuild = () => this.editContainerNode.refresh();
    } else if (view instanceof BeamSourceView) {
      view.onRebuild = () => this.editContainerNode.refresh();
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
        // Drag just ended.  While the view is still in dragLayer its globalBounds
        // reflect the exact drop position — check for carousel overlap NOW,
        // before reparenting back to elementsLayer.
        //
        // Using intersectsBounds (rather than a single cursor-point check) so
        // that any visual overlap with the carousel panel triggers a return,
        // matching the user's mental model of "drop it onto the toolbox".
        if (this._carousel?.globalBounds.intersectsBounds(view.globalBounds)) {
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

    view.addInputListener({
      down: () => {
        this.selectedElementProperty.value = element;
        this.editContainerNode.setViewRebuildCallback(() => {
          const rebuildable = view as unknown as { rebuild?: () => void };
          rebuildable.rebuild?.();
        });
      },
    });
  }

  private updateRayPropagation(): void {
    this.model.scene.invalidate();
    const result = this.model.scene.simulate();
    this.rayPropagationView.setSegments(result.segments);
  }
}

opticsLab.register("SimScreenView", SimScreenView);
