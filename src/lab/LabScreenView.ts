import type { ScreenViewOptions } from "scenerystack/sim";
import { RayTracingCommonView } from "../common/view/SimScreenView.js";
import opticsLab from "../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import type { LabModel } from "./LabModel.js";

export class LabScreenView extends RayTracingCommonView {
  public constructor(model: LabModel, opticsLabPreferences: OpticsLabPreferencesModel, options?: ScreenViewOptions) {
    super(model, opticsLabPreferences, options);
  }
}

opticsLab.register("LabScreenView", LabScreenView);
