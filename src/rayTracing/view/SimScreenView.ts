import { NumberProperty, Property } from "scenerystack/axon";
import { Dimension2, Range, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node } from "scenerystack/scenery";
import { NumberControl, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { type Carousel, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
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
import { createComponentCarousel } from "./ComponentCarousel.js";
import { EditContainerNode } from "./EditContainerNode.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";
import { RayPropagationView } from "./RayPropagationView.js";

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

      // Remove view.
      const view = this.elementViewMap.get(element.id);
      if (view) {
        this.elementsLayer.removeChild(view);
        this.elementViewMap.delete(element.id);
      }

      // Remove from model.
      model.scene.removeElement(element.id);
    };

    // ── Edit Container Node ───────────────────────────────────────────────
    this.editContainerNode = new EditContainerNode(
      this.selectedElementProperty,
      (element) => this._deleteElement?.(element),
      this.layoutBounds,
    );
    this.addChild(this.editContainerNode);

    // ── Component Carousel (toolbox) ─────────────────────────────────────────
    // Created before the initial-element loop so _setupView can reference it
    // for return-to-carousel deletion detection.
    const carousel = createComponentCarousel(modelViewTransform, (element) => {
      // Add to model
      model.scene.addElement(element);

      // Create and add corresponding view
      const view = createOpticalElementView(element, modelViewTransform);
      if (view) {
        this._setupView(element, view);
      }
      return view;
    });
    this._carousel = carousel;
    carousel.left = this.layoutBounds.minX + 8;
    carousel.centerY = this.layoutBounds.centerY;
    this.addChild(carousel);

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
      titleNodeOptions: { fill: "#bbb", font: "11px sans-serif" },
      numberDisplayOptions: {
        decimalPlaces: 2,
        textOptions: { fill: "#eee", font: "11px sans-serif" },
        backgroundFill: "rgba(0,0,0,0.35)",
        backgroundStroke: "rgba(100,100,120,0.6)",
      },
      sliderOptions: {
        trackSize: new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT),
        thumbSize: new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT),
        tandem: Tandem.OPT_OUT,
      },
      tandem: Tandem.OPT_OUT,
    });

    const densityPanel = new Panel(densityControl, {
      fill: "rgba(25, 25, 45, 0.92)",
      stroke: "rgba(120, 120, 140, 1)",
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
      },
      right: this.layoutBounds.maxX - RESET_BUTTON_MARGIN,
      bottom: this.layoutBounds.maxY - RESET_BUTTON_MARGIN,
      ...(tandem && { tandem: tandem.createTandem("resetAllButton") }),
    });
    this.addChild(resetAllButton);

    densityPanel.right = resetAllButton.left - 12;
    densityPanel.centerY = resetAllButton.centerY;
    this.addChild(densityPanel);

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

    // Track whether a body drag is in flight so we can:
    //  (a) lift the view above the carousel while dragging, and
    //  (b) distinguish a real drag from a simple click when checking the
    //      return-to-carousel drop zone.
    let inDragLayer = false;
    let bodyWasPressed = false;

    view.bodyDragListener.isPressedProperty.lazyLink((isPressed) => {
      if (isPressed) {
        bodyWasPressed = true;
        // Reparent to the drag layer so the element renders above the carousel.
        this.elementsLayer.removeChild(view);
        this.dragLayer.addChild(view);
        inDragLayer = true;
      } else if (inDragLayer) {
        // Return to the normal elements layer when the drag ends.
        this.dragLayer.removeChild(view);
        this.elementsLayer.addChild(view);
        inDragLayer = false;
      }
    });

    view.addInputListener({
      down: () => {
        bodyWasPressed = false;
        this.selectedElementProperty.value = element;
        this.editContainerNode.setViewRebuildCallback(() => {
          const rebuildable = view as unknown as { rebuild?: () => void };
          rebuildable.rebuild?.();
        });
      },

      // When the pointer is released, check whether it ended up over the
      // carousel.  If so, treat it as "return to toolbox" and delete the element.
      // By this point isPressedProperty has already fired and the view is back
      // in elementsLayer, so _deleteElement can safely remove it.
      up: (event) => {
        if (bodyWasPressed && this._carousel && this._carousel.globalBounds.containsPoint(event.pointer.point)) {
          bodyWasPressed = false;
          this._deleteElement?.(element);
        } else {
          bodyWasPressed = false;
        }
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
