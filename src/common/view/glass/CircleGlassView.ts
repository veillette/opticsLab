/**
 * CircleGlassView.ts
 *
 * Scenery node for a circular glass element. Renders as a translucent
 * blue circle matching the model's center (p1) and boundary point (p2).
 * A center handle translates the whole circle; a boundary handle resizes it.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors, { glassFill } from "../../../OpticsLabColors.js";
import { GLASS_STROKE_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { CircleGlass } from "../../model/glass/CircleGlass.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { attachTranslationDrag, type DragHandle, makeEndpointHandle } from "../ViewHelpers.js";

export class CircleGlassView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly circlePath: Path;
  private readonly handleCenter: DragHandle;
  private readonly handleBoundary: DragHandle;

  private readonly glass: CircleGlass;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(glass: CircleGlass, modelViewTransform: ModelViewTransform2, tandem: Tandem) {
    super();
    this.glass = glass;
    this.modelViewTransform = modelViewTransform;

    this.circlePath = new Path(null, {
      fill: glassFill(glass.refIndex),
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: GLASS_STROKE_WIDTH,
    });
    // Center handle: translates the whole circle (p1 and p2 move together)
    this.handleCenter = makeEndpointHandle(
      () => glass.p1,
      (newP1) => {
        const oldP1 = glass.p1;
        glass.p2 = { x: glass.p2.x + (newP1.x - oldP1.x), y: glass.p2.y + (newP1.y - oldP1.y) };
        glass.p1 = newP1;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("centerDragListener"),
    );
    // Boundary handle: resizes the circle (only p2 moves)
    this.handleBoundary = makeEndpointHandle(
      () => glass.p2,
      (p) => {
        glass.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("boundaryDragListener"),
    );

    this.addChild(this.circlePath);
    this.addChild(this.handleCenter);
    this.addChild(this.handleBoundary);

    this.rebuild();

    // Body drag: translate both center and boundary point together
    this.bodyDragListener = attachTranslationDrag(
      this.circlePath,
      [
        {
          get: () => glass.p1,
          set: (p) => {
            glass.p1 = p;
          },
        },
        {
          get: () => glass.p2,
          set: (p) => {
            glass.p2 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("bodyDragListener"),
    );
  }

  public override rebuild(): void {
    const { p1, p2 } = this.glass;
    const modelRadius = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const vcx = this.modelViewTransform.modelToViewX(p1.x);
    const vcy = this.modelViewTransform.modelToViewY(p1.y);
    const vr = Math.abs(this.modelViewTransform.modelToViewDeltaX(modelRadius));
    this.circlePath.fill = glassFill(this.glass.refIndex);
    this.circlePath.shape = new Shape().circle(vcx, vcy, vr);
    this.handleCenter.syncToModel();
    this.handleBoundary.syncToModel();
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("CircleGlassView", CircleGlassView);
