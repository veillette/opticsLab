/**
 * EditControlsResult.ts
 *
 * Shared result type returned by all per-element edit-control builders,
 * and the context bag that carries per-call display-preference options.
 */

import type { Node } from "scenerystack/scenery";
import type { SignConvention } from "../../../preferences/OpticsLabPreferencesModel.js";

export type EditControlsResult = {
  controls: Node[];
  /** Called by EditContainerNode.refresh() to sync controls after a geometry drag. */
  refreshCallback: (() => void) | null;
};

/**
 * Display-preference context forwarded to element edit-control builders.
 *
 * Collected into a single bag so that adding a new display preference only
 * requires updating this interface and the call site in EditContainerNode —
 * not the signature of every builder function.
 */
export interface EditControlContext {
  /** Sign convention used when displaying radii of curvature. */
  signConvention: SignConvention;
  /** When true, builders show curvature κ = 1/R instead of radius R. */
  useCurvatureDisplay: boolean;
}
