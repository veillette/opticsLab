/**
 * RayStubsProperty.ts
 *
 * Singleton properties that control the "ray stubs" display mode.
 * When enabled, only a short stub of each ray segment is rendered from its
 * start point, hiding the full ray path.  This gives a clean directional
 * indicator without the visual clutter of complete ray traces.
 *
 * rayStubsEnabledProperty  – toggles the mode on / off
 * rayStubLengthPxProperty  – length of each stub in view pixels (default 50)
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import opticsLab from "../../OpticsLabNamespace.js";

export const RAY_STUB_LENGTH_DEFAULT_PX = 50;
export const RAY_STUB_LENGTH_MIN_PX = 10;
export const RAY_STUB_LENGTH_MAX_PX = 200;

export const rayStubsEnabledProperty = new BooleanProperty(false);

export const rayStubLengthPxProperty = new NumberProperty(RAY_STUB_LENGTH_DEFAULT_PX, {
  range: new Range(RAY_STUB_LENGTH_MIN_PX, RAY_STUB_LENGTH_MAX_PX),
});

opticsLab.register("rayStubsEnabledProperty", rayStubsEnabledProperty);
opticsLab.register("rayStubLengthPxProperty", rayStubLengthPxProperty);
