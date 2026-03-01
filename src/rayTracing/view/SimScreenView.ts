import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { RESET_BUTTON_MARGIN } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../../preferences/OpticsLabPreferencesModel.js";
import type { SimModel } from "../model/SimModel.js";
import { createOpticalElementView } from "./OpticalElementViewFactory.js";

export class SimScreenView extends ScreenView {
  public constructor(model: SimModel, _opticsLabPreferences: OpticsLabPreferencesModel, options?: ScreenViewOptions) {
    super(options);

    const tandem = options?.tandem;

    // ── Optical Elements Layer ──────────────────────────────────────────────
    // Create a Scenery node for every mirror and glass/lens in the scene.
    const elementsLayer = new Node({
      ...(tandem && { tandem: tandem.createTandem("elementsLayer") }),
    });

    for (const element of model.scene.getAllElements()) {
      const elementView = createOpticalElementView(element);
      if (elementView) {
        elementsLayer.addChild(elementView);
      }
    }

    this.addChild(elementsLayer);

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
  }

  public reset(): void {
    // Called when the user presses the reset-all button
  }

  public override step(_dt: number): void {
    // Animation step — hook available for future per-frame updates
  }
}

opticsLab.register("SimScreenView", SimScreenView);
