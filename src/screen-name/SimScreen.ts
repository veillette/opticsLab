import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import { SimModel } from "./model/SimModel.js";
import { SimScreenView } from "./view/SimScreenView.js";

/** Extends the base ScreenOptions with the preferences model required by SimScreenView. */
export type OpticsLabScreenOptions = ScreenOptions & {
  opticsLabPreferences: OpticsLabPreferencesModel;
};

export class SimScreen extends Screen<SimModel, SimScreenView> {
  public constructor(options: OpticsLabScreenOptions) {
    super(
      () => new SimModel(),
      (model) => new SimScreenView(model, options.opticsLabPreferences),
      options,
    );
  }
}
