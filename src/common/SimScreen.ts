import { Screen, type ScreenOptions } from "scenerystack/sim";
import opticsLab from "../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import { RayTracingCommonModel } from "./model/SimModel.js";
import type { ComponentKey } from "./view/ComponentCarousel.js";
import { RayTracingCommonView } from "./view/SimScreenView.js";

/** Extends the base ScreenOptions with the preferences model required by RayTracingCommonView. */
export type OpticsLabScreenOptions = ScreenOptions & {
  opticsLabPreferences: OpticsLabPreferencesModel;

  /**
   * Optional list of component keys to show in the carousel (in order).
   * When omitted, all components are shown in the default order.
   */
  carouselComponents?: ComponentKey[];
};

export class RayTracingCommonScreen extends Screen<RayTracingCommonModel, RayTracingCommonView> {
  public constructor(options: OpticsLabScreenOptions) {
    super(
      () => new RayTracingCommonModel(options.tandem.createTandem("model")),
      (model) =>
        new RayTracingCommonView(
          model,
          options.opticsLabPreferences,
          { tandem: options.tandem.createTandem("view") },
          options.carouselComponents,
        ),
      options,
    );
  }
}

opticsLab.register("RayTracingCommonScreen", RayTracingCommonScreen);
