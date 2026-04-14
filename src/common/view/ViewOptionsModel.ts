/**
 * ViewOptionsModel.ts
 *
 * Per-screen view-state model that owns the five view-toggle properties
 * previously held as module-level singletons.  Instantiating one per screen
 * lets each screen maintain independent settings and makes the properties
 * visible to PhET-iO via Tandem instrumentation.
 *
 * Properties
 * ──────────
 *   handlesVisibleProperty       – show/hide drag-handle circles
 *   focalMarkersVisibleProperty  – show/hide focal-point marker diamonds
 *   rayArrowsVisibleProperty     – show/hide directional arrowheads on rays
 *   rayStubsEnabledProperty      – toggle "ray stubs" display mode
 *   rayStubLengthPxProperty      – stub length in view pixels
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import { RAY_STUB_LENGTH_MAX_PX, RAY_STUB_LENGTH_MIN_PX } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import opticsLabQueryParameters from "../../preferences/opticsLabQueryParameters.js";

export class ViewOptionsModel {
  public readonly handlesVisibleProperty: BooleanProperty;
  public readonly focalMarkersVisibleProperty: BooleanProperty;
  public readonly rayArrowsVisibleProperty: BooleanProperty;
  public readonly rayStubsEnabledProperty: BooleanProperty;
  public readonly rayStubLengthPxProperty: NumberProperty;

  public constructor(tandem?: Tandem) {
    this.handlesVisibleProperty = new BooleanProperty(opticsLabQueryParameters.showHandles, {
      ...(tandem && { tandem: tandem.createTandem("handlesVisibleProperty") }),
    });

    this.focalMarkersVisibleProperty = new BooleanProperty(opticsLabQueryParameters.showFocalMarkers, {
      ...(tandem && { tandem: tandem.createTandem("focalMarkersVisibleProperty") }),
    });

    this.rayArrowsVisibleProperty = new BooleanProperty(opticsLabQueryParameters.showRayArrows, {
      ...(tandem && { tandem: tandem.createTandem("rayArrowsVisibleProperty") }),
    });

    this.rayStubsEnabledProperty = new BooleanProperty(opticsLabQueryParameters.showRayStubs, {
      ...(tandem && { tandem: tandem.createTandem("rayStubsEnabledProperty") }),
    });

    this.rayStubLengthPxProperty = new NumberProperty(opticsLabQueryParameters.rayStubLength, {
      range: new Range(RAY_STUB_LENGTH_MIN_PX, RAY_STUB_LENGTH_MAX_PX),
      ...(tandem && { tandem: tandem.createTandem("rayStubLengthPxProperty") }),
    });
  }

  public reset(): void {
    this.handlesVisibleProperty.reset();
    this.focalMarkersVisibleProperty.reset();
    this.rayArrowsVisibleProperty.reset();
    this.rayStubsEnabledProperty.reset();
    this.rayStubLengthPxProperty.reset();
  }

  public dispose(): void {
    this.handlesVisibleProperty.dispose();
    this.focalMarkersVisibleProperty.dispose();
    this.rayArrowsVisibleProperty.dispose();
    this.rayStubsEnabledProperty.dispose();
    this.rayStubLengthPxProperty.dispose();
  }
}

opticsLab.register("ViewOptionsModel", ViewOptionsModel);
