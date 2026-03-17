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
 *  • rebuildEmitter – emitted at the end of every rebuild(). External
 *    observers (e.g. EditContainerNode) add listeners to stay in sync.
 *
 *  • rebuild() – public abstract template method that updates all visual
 *    geometry (shapes, handle positions, focal markers, …) to match the
 *    current model state.  Subclasses implement this; it replaces the
 *    previous private rebuild() pattern, making it properly overridable.
 */

import { Emitter } from "scenerystack/axon";
import { Node, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../OpticsLabNamespace.js";

export abstract class BaseOpticalElementView extends Node {
  /** Drag listener used to translate the element as a whole. */
  public abstract readonly bodyDragListener: RichDragListener;

  /**
   * Emitted after every rebuild(). External observers (e.g. EditContainerNode)
   * add listeners to sync UI controls with updated geometry.
   */
  public readonly rebuildEmitter = new Emitter();

  /** Recompute all visual geometry to match the current model state. */
  public abstract rebuild(): void;
}

opticsLab.register("BaseOpticalElementView", BaseOpticalElementView);
