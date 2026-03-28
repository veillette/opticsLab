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
import { Bounds2 } from "scenerystack/dot";
import { Color, Node, Rectangle, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../OpticsLabNamespace.js";

const SELECTION_PAD = 8; // px of padding around content bounds

export abstract class BaseOpticalElementView extends Node {
  /** Drag listener used to translate the element as a whole. */
  public abstract readonly bodyDragListener: RichDragListener;

  private readonly _selectionFrame: Rectangle;
  private _isSelected = false;

  protected constructor() {
    super();
    // Wrap children in a labelled container element so screen readers can
    // identify each optical element by name and navigate between them.
    this.tagName = "div";

    // Selection frame – added first so it renders behind all content children.
    this._selectionFrame = new Rectangle(0, 0, 0, 0, 4, 4, {
      stroke: new Color(255, 220, 0, 0.75),
      lineWidth: 2,
      lineDash: [5, 3],
      fill: null,
      pickable: false,
      visible: false,
    });
    this.addChild(this._selectionFrame);

    // Keep the frame in sync whenever geometry changes after a rebuild().
    this.rebuildEmitter.addListener(() => {
      if (this._isSelected) {
        this._refreshSelectionFrame();
      }
    });
  }

  /** Show or hide the selection highlight rectangle around this element. */
  public setSelected(isSelected: boolean): void {
    this._isSelected = isSelected;
    if (isSelected) {
      this._refreshSelectionFrame();
      this._selectionFrame.visible = true;
    } else {
      this._selectionFrame.visible = false;
    }
  }

  /**
   * Recompute the selection-frame bounds from all content children (index 1+),
   * skipping the frame at index 0 to avoid a circular bounds dependency.
   */
  private _refreshSelectionFrame(): void {
    let b = Bounds2.NOTHING;
    for (let i = 1; i < this.children.length; i++) {
      b = b.union(this.children[i]?.bounds ?? Bounds2.NOTHING);
    }
    if (!b.isFinite() || b.isEmpty()) {
      return;
    }
    this._selectionFrame.setRect(
      b.minX - SELECTION_PAD,
      b.minY - SELECTION_PAD,
      b.width + 2 * SELECTION_PAD,
      b.height + 2 * SELECTION_PAD,
    );
  }

  /**
   * Emitted after every rebuild(). External observers (e.g. EditContainerNode)
   * add listeners to sync UI controls with updated geometry.
   */
  public readonly rebuildEmitter = new Emitter();

  /** Recompute all visual geometry to match the current model state. */
  public abstract rebuild(): void;

  /**
   * Release resources held by this view to prevent memory leaks.
   * Disposes the rebuildEmitter (removing all external listeners) and the
   * bodyDragListener (removing isPressedProperty observers), then delegates
   * to Node.dispose() for Scenery-managed cleanup (input listeners, children).
   *
   * Subclasses that hold additional disposable resources (e.g. axon Properties)
   * should override this and call super.dispose().
   */
  public override dispose(): void {
    this.rebuildEmitter.dispose();
    this.bodyDragListener.dispose();
    super.dispose();
  }
}

opticsLab.register("BaseOpticalElementView", BaseOpticalElementView);
