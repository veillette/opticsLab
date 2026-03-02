/**
 * LineBlockerView.ts
 *
 * Scenery node for a line-segment blocker. Rendered as a dark opaque line.
 * Endpoint handles and a body-drag region let the user reshape and reposition.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { LineBlocker } from "../../model/blockers/LineBlocker.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const BACK_STROKE = "#555";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#222";
const FRONT_WIDTH = 2.5;

export class LineBlockerView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(private readonly blocker: LineBlocker) {
    super();

    this.backPath = new Path(null, {
      stroke: BACK_STROKE,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
    });
    this.frontPath = new Path(null, {
      stroke: FRONT_STROKE,
      lineWidth: FRONT_WIDTH,
      lineCap: "round",
    });
    this.handle1 = createHandle(blocker.p1);
    this.handle2 = createHandle(blocker.p2);

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.backPath,
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
      this.handle1,
      () => blocker.p1,
      (p) => {
        blocker.p1 = p;
      },
      () => {
        this.rebuild();
      },
    );
    attachEndpointDrag(
      this.handle2,
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
    const shape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.handle1.x = p1.x;
    this.handle1.y = p1.y;
    this.handle2.x = p2.x;
    this.handle2.y = p2.y;
  }
}

opticsLab.register("LineBlockerView", LineBlockerView);
