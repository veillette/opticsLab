/**
 * OpticsLabPreferencesModel - Model for OpticsLab simulation preferences.
 *
 * Manages user preferences for the OpticsLab simulation.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import opticsLab from "../OpticsLabNamespace.js";
import opticsLabQueryParameters from "./opticsLabQueryParameters.js";

export class OpticsLabPreferencesModel {
  /**
   * Whether the demo rotating rectangle animation is enabled.
   */
  public readonly enableDemoAnimationProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.enableDemoAnimationProperty = new BooleanProperty(
      opticsLabQueryParameters.enableDemoAnimation,
      tandem ? { tandem: tandem.createTandem("enableDemoAnimationProperty") } : undefined,
    );
  }

  public reset(): void {
    this.enableDemoAnimationProperty.reset();
  }
}

opticsLab.register("OpticsLabPreferencesModel", OpticsLabPreferencesModel);
