import { Rectangle, Text } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { RESET_BUTTON_MARGIN } from "../../OpticsLabConstants.js";
import type { OpticsLabPreferencesModel } from "../../preferences/OpticsLabPreferencesModel.js";
import type { SimModel } from "../model/SimModel.js";

export class SimScreenView extends ScreenView {
  private readonly rotatingRectangle: Rectangle;
  private readonly opticsLabPreferences: OpticsLabPreferencesModel;

  public constructor(model: SimModel, opticsLabPreferences: OpticsLabPreferencesModel, options?: ScreenViewOptions) {
    super(options);
    this.opticsLabPreferences = opticsLabPreferences;

    // Sample Content

    this.rotatingRectangle = new Rectangle(-150, -20, 300, 40, {
      fill: "#ccc",
      translation: this.layoutBounds.center,
    });
    this.addChild(this.rotatingRectangle);

    this.addChild(
      new Text("Content goes here", {
        font: "24px sans-serif",
        center: this.layoutBounds.center,
      }),
    );

    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - RESET_BUTTON_MARGIN,
      bottom: this.layoutBounds.maxY - RESET_BUTTON_MARGIN,
    });
    this.addChild(resetAllButton);
  }

  public reset(): void {
    // Called when the user presses the reset-all button
  }

  public step(dt: number): void {
    // Called every frame, with the time since the last frame in seconds
    if (this.opticsLabPreferences.enableDemoAnimationProperty.value) {
      this.rotatingRectangle.rotation += 2 * dt;
    }
  }
}
