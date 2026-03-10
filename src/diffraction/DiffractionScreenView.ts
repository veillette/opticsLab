import type { ScreenViewOptions } from "scenerystack/sim";
import { RayTracingCommonView } from "../common/view/SimScreenView.js";
import opticsLab from "../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import type { DiffractionModel } from "./DiffractionModel.js";

export class DiffractionScreenView extends RayTracingCommonView {
  public constructor(
    model: DiffractionModel,
    opticsLabPreferences: OpticsLabPreferencesModel,
    options?: ScreenViewOptions,
  ) {
    super(model, opticsLabPreferences, options);
  }
}

opticsLab.register("DiffractionScreenView", DiffractionScreenView);
