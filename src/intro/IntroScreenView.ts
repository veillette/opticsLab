import type { ScreenViewOptions } from "scenerystack/sim";
import { RayTracingCommonView } from "../common/view/SimScreenView.js";
import opticsLab from "../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import type { IntroModel } from "./IntroModel.js";

export class IntroScreenView extends RayTracingCommonView {
  public constructor(model: IntroModel, opticsLabPreferences: OpticsLabPreferencesModel, options?: ScreenViewOptions) {
    super(model, opticsLabPreferences, options);
  }
}

opticsLab.register("IntroScreenView", IntroScreenView);
