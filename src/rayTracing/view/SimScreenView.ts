import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { Property } from "scenerystack/axon";
import { RESET_BUTTON_MARGIN } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../../preferences/OpticsLabPreferencesModel.js";
import type { SimModel } from "../model/SimModel.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import { createComponentCarousel } from "./ComponentCarousel.js";
import { EditContainerNode } from "./EditContainerNode.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";
import { RayPropagationView } from "./RayPropagationView.js";

export class SimScreenView extends ScreenView {
  private readonly model: SimModel;
  private readonly rayPropagationView: RayPropagationView;
  private readonly elementsLayer: Node;
  private readonly editContainerNode: EditContainerNode;

  /** Tracks the currently selected element (null = nothing selected). */
  private readonly selectedElementProperty: Property<OpticalElement | null>;

  /** Maps element id → view so we can remove views and provide rebuild callbacks. */
  private readonly elementViewMap = new Map<string, OpticalElementView>();

  public constructor(model: SimModel, _opticsLabPreferences: OpticsLabPreferencesModel, options?: ScreenViewOptions) {
    super(options);

    this.model = model;
    const tandem = options?.tandem;

    this.selectedElementProperty = new Property<OpticalElement | null>(null);

    // ── Ray Propagation Layer (behind elements so rays don't block handles) ─
    this.rayPropagationView = new RayPropagationView(this.layoutBounds);
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

    for (const element of model.scene.getAllElements()) {
      const elementView = createOpticalElementView(element);
      if (elementView) {
        this._setupView(element, elementView);
      }
    }

    this.addChild(this.elementsLayer);

    // ── Edit Container Node ───────────────────────────────────────────────
    const onDelete = (element: OpticalElement): void => {
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

    this.editContainerNode = new EditContainerNode(
      this.selectedElementProperty,
      onDelete,
      this.layoutBounds,
    );
    this.addChild(this.editContainerNode);

    // ── Component Carousel (toolbox) ─────────────────────────────────────────
    const carousel = createComponentCarousel((element) => {
      // Add to model
      model.scene.addElement(element);

      // Create and add corresponding view
      const view = createOpticalElementView(element);
      if (view) {
        this._setupView(element, view);
      }
      return view;
    });
    carousel.left = this.layoutBounds.minX + 8;
    carousel.centerY = this.layoutBounds.centerY;
    this.addChild(carousel);

    // ── Reset Button ────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - RESET_BUTTON_MARGIN,
      bottom: this.layoutBounds.maxY - RESET_BUTTON_MARGIN,
      ...(tandem && { tandem: tandem.createTandem("resetAllButton") }),
    });
    this.addChild(resetAllButton);

    // ── Initial simulation ──────────────────────────────────────────────────
    this.updateRayPropagation();
  }

  public reset(): void {
    // Deselect and hide the edit panel.
    this.selectedElementProperty.value = null;

    // Remove all element views and clear the scene.
    this.elementsLayer.removeAllChildren();
    this.elementViewMap.clear();
  }

  public override step(_dt: number): void {
    // Re-run the simulation every frame so that element drags are reflected
    // immediately. The scene uses dirty-flag caching internally, but we
    // invalidate here because element positions are mutated directly by the
    // drag handlers without going through OpticsScene setter methods.
    this.updateRayPropagation();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Register a view for an element: add it to the layer + map, and attach a
   * `down` listener that selects the element and provides its rebuild callback.
   */
  private _setupView(element: OpticalElement, view: OpticalElementView): void {
    this.elementsLayer.addChild(view);
    this.elementViewMap.set(element.id, view);

    view.addInputListener({
      down: () => {
        // 1. Trigger selectedElementProperty link (which resets _rebuildViewCallback).
        this.selectedElementProperty.value = element;

        // 2. Immediately after the link runs, supply the rebuild callback.
        //    Sliders in EditContainerNode read this lazily at change-time.
        this.editContainerNode.setViewRebuildCallback(() => {
          // Access rebuild() through a type-safe duck-type check; the method
          // is protected/private in the view classes but accessible at runtime.
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
