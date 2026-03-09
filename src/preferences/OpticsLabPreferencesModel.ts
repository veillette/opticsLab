/**
 * OpticsLabPreferencesModel - Model for OpticsLab simulation preferences.
 *
 * Manages user preferences for the OpticsLab simulation.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import { GRID_SPACING_MAX_M, GRID_SPACING_MIN_M } from "../OpticsLabConstants.js";
import opticsLab from "../OpticsLabNamespace.js";
import opticsLabQueryParameters from "./opticsLabQueryParameters.js";

export class OpticsLabPreferencesModel {
  /**
   * Whether the components snapToGrid.
   */
  public readonly snapToGridProperty: BooleanProperty;

  /**
   * Spacing between major grid lines, in model metres.
   */
  public readonly gridSpacingProperty: NumberProperty;

  public constructor(tandem?: Tandem) {
    this.snapToGridProperty = new BooleanProperty(
      opticsLabQueryParameters.snapToGrid,
      tandem ? { tandem: tandem.createTandem("snapToGridProperty") } : undefined,
    );

    this.gridSpacingProperty = new NumberProperty(opticsLabQueryParameters.gridSpacing, {
      range: new Range(GRID_SPACING_MIN_M, GRID_SPACING_MAX_M),
      ...(tandem && { tandem: tandem.createTandem("gridSpacingProperty") }),
    });
  }

  public reset(): void {
    this.snapToGridProperty.reset();
    this.gridSpacingProperty.reset();
  }
}

opticsLab.register("OpticsLabPreferencesModel", OpticsLabPreferencesModel);
