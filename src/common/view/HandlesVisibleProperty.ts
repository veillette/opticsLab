/**
 * HandlesVisibleProperty.ts
 *
 * Singleton BooleanProperty that controls the visibility of all drag-handle
 * circles (endpoint handles, scale handles, rotation handle) in the view.
 * Setting it to false gives a clean "screenshot mode" with no handle overlays.
 */

import { BooleanProperty } from "scenerystack/axon";
import opticsLab from "../../OpticsLabNamespace.js";

export const handlesVisibleProperty = new BooleanProperty(true);

opticsLab.register("handlesVisibleProperty", handlesVisibleProperty);
