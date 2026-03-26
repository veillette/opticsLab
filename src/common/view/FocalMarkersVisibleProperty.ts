/**
 * FocalMarkersVisibleProperty.ts
 *
 * Singleton BooleanProperty that controls the visibility of all focal-point
 * marker diamonds/squares on lenses and mirrors.  Toggled independently of
 * the drag-handle visibility so users can hide handles while keeping the
 * focal-point indicators, or vice-versa.
 */

import { BooleanProperty } from "scenerystack/axon";
import opticsLab from "../../OpticsLabNamespace.js";

export const focalMarkersVisibleProperty = new BooleanProperty(true);

opticsLab.register("focalMarkersVisibleProperty", focalMarkersVisibleProperty);
