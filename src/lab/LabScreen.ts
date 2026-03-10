import { Screen } from "scenerystack/sim";
import type { OpticsLabScreenOptions } from "../common/SimScreen.js";
import opticsLab from "../OpticsLabNamespace.js";
import { LabModel } from "./LabModel.js";
import { LabScreenView } from "./LabScreenView.js";

export class LabScreen extends Screen<LabModel, LabScreenView> {
  public constructor(options: OpticsLabScreenOptions) {
    super(
      () => new LabModel(options.tandem.createTandem("model")),
      (model) =>
        new LabScreenView(model, options.opticsLabPreferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      options,
    );
  }
}

opticsLab.register("LabScreen", LabScreen);
