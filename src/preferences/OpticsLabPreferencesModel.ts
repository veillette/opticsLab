/**
 * OpticsLabPreferencesModel - Model for OpticsLab simulation preferences.
 *
 * Manages user preferences for the OpticsLab simulation.
 */

import { BooleanProperty } from "scenerystack/axon";
import opticsLab from "../OpticsLabNamespace.js";
import opticsLabQueryParameters from "./opticsLabQueryParameters.js";

export class OpticsLabPreferencesModel {
  /**
   * Whether the demo rotating rectangle animation is enabled.
   */
  public readonly enableDemoAnimationProperty: BooleanProperty;

  public constructor() {
    this.enableDemoAnimationProperty = new BooleanProperty(opticsLabQueryParameters.enableDemoAnimation);
  }

  public reset(): void {
    this.enableDemoAnimationProperty.reset();
  }
}

opticsLab.register("OpticsLabPreferencesModel", OpticsLabPreferencesModel);
