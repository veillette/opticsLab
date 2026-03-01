import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { RESET_BUTTON_MARGIN } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../../preferences/OpticsLabPreferencesModel.js";
import type { SimModel } from "../model/SimModel.js";
import { createComponentCarousel } from "./ComponentCarousel.js";
import { createOpticalElementView } from "./OpticalElementViewFactory.js";
import { RayPropagationView } from "./RayPropagationView.js";

export class SimScreenView extends ScreenView {
  private readonly model: SimModel;
  private readonly rayPropagationView: RayPropagationView;
  private readonly elementsLayer: Node;

  public constructor(model: SimModel, _opticsLabPreferences: OpticsLabPreferencesModel, options?: ScreenViewOptions) {
    super(options);

    this.model = model;
    const tandem = options?.tandem;

    // ── Ray Propagation Layer (behind elements so rays don't block handles) ─
    this.rayPropagationView = new RayPropagationView(this.layoutBounds);
    this.addChild(this.rayPropagationView);

    // ── Optical Elements Layer ──────────────────────────────────────────────
    this.elementsLayer = new Node({
      ...(tandem && { tandem: tandem.createTandem("elementsLayer") }),
    });

    for (const element of model.scene.getAllElements()) {
      const elementView = createOpticalElementView(element);
      if (elementView) {
        this.elementsLayer.addChild(elementView);
      }
    }

    this.addChild(this.elementsLayer);

    // ── Component Carousel (toolbox) ─────────────────────────────────────────
    const carousel = createComponentCarousel(
      (element) => {
        // Add to model
        model.scene.addElement(element);

        // Create and add corresponding view
        const view = createOpticalElementView(element);
        if (view) {
          this.elementsLayer.addChild(view);
        }
      },
      () => this.layoutBounds.centerX,
      () => this.layoutBounds.centerY,
    );
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
    // Remove all element views and clear the scene
    this.elementsLayer.removeAllChildren();
  }

  public override step(_dt: number): void {
    // Re-run the simulation every frame so that element drags are reflected
    // immediately. The scene uses dirty-flag caching internally, but we
    // invalidate here because element positions are mutated directly by the
    // drag handlers without going through OpticsScene setter methods.
    this.updateRayPropagation();
  }

  private updateRayPropagation(): void {
    this.model.scene.invalidate();
    const result = this.model.scene.simulate();
    this.rayPropagationView.setSegments(result.segments);
  }
}

opticsLab.register("SimScreenView", SimScreenView);
