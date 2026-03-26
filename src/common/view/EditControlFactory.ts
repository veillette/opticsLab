/**
 * EditControlFactory.ts
 *
 * Public dispatcher that routes any OpticalElement to its edit-panel controls.
 * All per-element builder functions now live in:
 *   - ./edit-controls/LightSourceEditControls.ts
 *   - ./edit-controls/GlassEditControls.ts
 *   - ./edit-controls/MirrorEditControls.ts
 *
 * The actual dispatch is handled by ElementRegistry.buildEditControls, which
 * iterates the shared ELEMENT_REGISTRY so that view creation and edit controls
 * are registered in one place.
 */

import opticsLab from "../../OpticsLabNamespace.js";
import type { SignConvention } from "../../preferences/OpticsLabPreferencesModel.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import { buildEditControls as buildEditControlsFromRegistry } from "./ElementRegistry.js";
import type { EditControlsResult } from "./edit-controls/EditControlsResult.js";

// Re-export so callers that previously imported EditControlsResult from this
// file continue to work without any import-path changes.
export type { EditControlsResult } from "./edit-controls/EditControlsResult.js";

/**
 * Build the property controls appropriate for the given optical element.
 * Returns the control nodes to display and an optional refresh callback
 * that can be invoked to sync control values after a geometry drag.
 */
export function buildEditControls(
  element: OpticalElement,
  triggerRebuild: () => void,
  signConvention: SignConvention,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  return buildEditControlsFromRegistry(element, triggerRebuild, signConvention, useCurvatureDisplay);
}

opticsLab.register("buildEditControls", buildEditControls);
