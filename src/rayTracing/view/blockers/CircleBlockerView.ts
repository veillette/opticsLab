/**
 * CircleBlockerView.ts
 *
 * Scenery node for a circular blocker. Rendered as a dark filled circle.
 * A center handle translates the whole blocker; a boundary handle resizes it.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { CircleBlocker } from "../../model/blockers/CircleBlocker.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const BLOCKER_FILL = "rgba(30, 30, 30, 0.5)";
const BLOCKER_STROKE = "#555";
const BLOCKER_STROKE_WIDTH = 1.5;

export class CircleBlockerView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly circlePath: Path;
  private readonly handleCenter: Circle;
  private readonly handleBoundary: Circle;

  public constructor(private readonly blocker: CircleBlocker) {
    super();

    this.circlePath = new Path(null, {
      fill: BLOCKER_FILL,
      stroke: BLOCKER_STROKE,
      lineWidth: BLOCKER_STROKE_WIDTH,
    });
    this.handleCenter = createHandle(blocker.p1);
    this.handleBoundary = createHandle(blocker.p2);

    this.addChild(this.circlePath);
    this.addChild(this.handleCenter);
    this.addChild(this.handleBoundary);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.circlePath,
      [
        {
          get: () => blocker.p1,
          set: (p) => {
            blocker.p1 = p;
          },
        },
        {
          get: () => blocker.p2,
          set: (p) => {
            blocker.p2 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
    );

    attachEndpointDrag(
      this.handleCenter,
      () => blocker.p1,
      (newP1) => {
        const oldP1 = blocker.p1;
        blocker.p2 = { x: blocker.p2.x + (newP1.x - oldP1.x), y: blocker.p2.y + (newP1.y - oldP1.y) };
        blocker.p1 = newP1;
      },
      () => {
        this.rebuild();
      },
    );

    attachEndpointDrag(
      this.handleBoundary,
      () => blocker.p2,
      (p) => {
        blocker.p2 = p;
      },
      () => {
        this.rebuild();
      },
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.blocker;
    const radius = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    this.circlePath.shape = new Shape().circle(p1.x, p1.y, radius);
    this.handleCenter.x = p1.x;
    this.handleCenter.y = p1.y;
    this.handleBoundary.x = p2.x;
    this.handleBoundary.y = p2.y;
  }
}

opticsLab.register("CircleBlockerView", CircleBlockerView);
