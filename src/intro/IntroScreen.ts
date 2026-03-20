import { Screen } from "scenerystack/sim";
import type { OpticsLabScreenOptions } from "../common/SimScreen.js";
import opticsLab from "../OpticsLabNamespace.js";
import { IntroModel } from "./IntroModel.js";
import { IntroScreenView } from "./IntroScreenView.js";

export class IntroScreen extends Screen<IntroModel, IntroScreenView> {
  public constructor(options: OpticsLabScreenOptions) {
    super(
      () => new IntroModel(options.tandem.createTandem("model")),
      (model) =>
        new IntroScreenView(
          model,
          options.opticsLabPreferences,
          { tandem: options.tandem.createTandem("view") },
          options.carouselComponents,
        ),
      options,
    );
  }
}

opticsLab.register("IntroScreen", IntroScreen);
