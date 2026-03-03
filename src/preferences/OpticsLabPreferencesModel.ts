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
   * Whether the components snapToGrid.
   */
  public readonly snapToGridProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.snapToGridProperty = new BooleanProperty(
      opticsLabQueryParameters.snapToGrid,
      tandem ? { tandem: tandem.createTandem("snapToGridProperty") } : undefined,
    );
  }

  public reset(): void {
    this.snapToGridProperty.reset();
  }
}

opticsLab.register("OpticsLabPreferencesModel", OpticsLabPreferencesModel);
