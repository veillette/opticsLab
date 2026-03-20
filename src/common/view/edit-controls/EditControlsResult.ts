/**
 * EditControlsResult.ts
 *
 * Shared result type returned by all per-element edit-control builders.
 */

import type { Node } from "scenerystack/scenery";

export type EditControlsResult = {
  controls: Node[];
  /** Called by EditContainerNode.refresh() to sync controls after a geometry drag. */
  refreshCallback: (() => void) | null;
};
