/**
 * CircleGlassView.ts
 *
 * Scenery node for a circular glass element. Renders as a translucent
 * blue circle matching the model's center (p1) and boundary point (p2).
 * A center handle translates the whole circle; a boundary handle resizes it.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { CircleGlass } from "../../model/glass/CircleGlass.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const GLASS_FILL = "rgba(100, 180, 255, 0.22)";
const GLASS_STROKE = "rgba(60, 130, 210, 0.8)";
const GLASS_STROKE_WIDTH = 1.5;

export class CircleGlassView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly circlePath: Path;
  private readonly handleCenter: Circle;
  private readonly handleBoundary: Circle;

  public constructor(
    private readonly glass: CircleGlass,
    private readonly mvt: ModelViewTransform2,
  ) {
    super();

    this.circlePath = new Path(null, {
      fill: GLASS_FILL,
      stroke: GLASS_STROKE,
      lineWidth: GLASS_STROKE_WIDTH,
    });
    this.handleCenter = createHandle(glass.p1, mvt);
    this.handleBoundary = createHandle(glass.p2, mvt);

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
      mvt,
    );

    // Center handle: translates the whole circle (p1 and p2 move together)
    attachEndpointDrag(
      this.handleCenter,
      () => glass.p1,
      (newP1) => {
        const oldP1 = glass.p1;
        glass.p2 = { x: glass.p2.x + (newP1.x - oldP1.x), y: glass.p2.y + (newP1.y - oldP1.y) };
        glass.p1 = newP1;
      },
      () => {
        this.rebuild();
      },
      mvt,
    );

    // Boundary handle: resizes the circle (only p2 moves)
    attachEndpointDrag(
      this.handleBoundary,
      () => glass.p2,
      (p) => {
        glass.p2 = p;
      },
      () => {
        this.rebuild();
      },
      mvt,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.glass;
    const modelRadius = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const vcx = this.mvt.modelToViewX(p1.x);
    const vcy = this.mvt.modelToViewY(p1.y);
    const vr = Math.abs(this.mvt.modelToViewDeltaX(modelRadius));
    this.circlePath.shape = new Shape().circle(vcx, vcy, vr);
    this.handleCenter.x = vcx;
    this.handleCenter.y = vcy;
    this.handleBoundary.x = this.mvt.modelToViewX(p2.x);
    this.handleBoundary.y = this.mvt.modelToViewY(p2.y);
  }
}

opticsLab.register("CircleGlassView", CircleGlassView);
