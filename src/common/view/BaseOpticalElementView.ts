/**
 * BaseOpticalElementView.ts
 *
 * Abstract base class shared by every optical-element view node.
 * Encapsulates the three structural members that are identical across
 * all element views:
 *
 *  • bodyDragListener – the drag listener that translates the whole element.
 *    Declared abstract so each subclass assigns the concrete instance it
 *    creates with attachTranslationDrag().
 *
 *  • onRebuild – optional callback invoked at the end of every rebuild().
 *    Used by EditContainerNode to push updated model values back into the
 *    displayed NumberProperty controls after a drag changes the geometry.
 *
 *  • rebuild() – protected abstract template method that updates all visual
 *    geometry (shapes, handle positions, focal markers, …) to match the
 *    current model state.  Subclasses implement this; it replaces the
 *    previous private rebuild() pattern, making it properly overridable.
 */

import { Node, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../OpticsLabNamespace.js";

export abstract class BaseOpticalElementView extends Node {
  /** Drag listener used to translate the element as a whole. */
  public abstract readonly bodyDragListener: RichDragListener;

  /**
   * Optional callback invoked after every rebuild().
   * External observers (e.g. EditContainerNode) set this to sync UI controls.
   */
  public onRebuild: (() => void) | null = null;

  /** Recompute all visual geometry to match the current model state. */
  protected abstract rebuild(): void;
}

opticsLab.register("BaseOpticalElementView", BaseOpticalElementView);
