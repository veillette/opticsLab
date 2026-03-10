import type { ScreenViewOptions } from "scenerystack/sim";
import { RayTracingCommonView } from "../common/view/SimScreenView.js";
import opticsLab from "../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import type { PresetsModel } from "./PresetsModel.js";

export class PresetsScreenView extends RayTracingCommonView {
  public constructor(
    model: PresetsModel,
    opticsLabPreferences: OpticsLabPreferencesModel,
    options?: ScreenViewOptions,
  ) {
    super(model, opticsLabPreferences, options);
  }
}

opticsLab.register("PresetsScreenView", PresetsScreenView);
