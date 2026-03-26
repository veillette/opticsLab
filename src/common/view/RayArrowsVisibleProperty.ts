/**
 * RayArrowsVisibleProperty.ts
 *
 * Singleton BooleanProperty that controls whether small directional arrowheads
 * are drawn on each ray segment, indicating the direction of propagation after
 * each reflection or refraction.
 */

import { BooleanProperty } from "scenerystack/axon";
import opticsLab from "../../OpticsLabNamespace.js";

export const rayArrowsVisibleProperty = new BooleanProperty(false);

opticsLab.register("rayArrowsVisibleProperty", rayArrowsVisibleProperty);
