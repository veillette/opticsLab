/**
 * OpticalElementViewFactory.ts
 *
 * Factory that creates the appropriate Scenery Node for any OpticalElement.
 * Dispatch is now handled by the central ElementRegistry so that adding a new
 * element type only requires updating ElementRegistry.ts.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import opticsLab from "../../OpticsLabNamespace.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";

export type { OpticalElementView } from "./ElementRegistry.js";

import { createOpticalElementView as createFromRegistry } from "./ElementRegistry.js";

/**
 * Create and return a Scenery Node that visually represents the given
 * optical element. Returns null if the element type has no registered view.
 */
export function createOpticalElementView(
  element: OpticalElement,
  modelViewTransform: ModelViewTransform2,
): OpticalElementView | null {
  return createFromRegistry(element, modelViewTransform);
}

opticsLab.register("createOpticalElementView", createOpticalElementView);
