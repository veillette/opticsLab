/**
 * LineBlockerView.ts
 *
 * Scenery node for a line-segment blocker. Rendered as a dark opaque line.
 * Endpoint handles and a body-drag region let the user reshape and reposition.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
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

  public constructor(
    private readonly blocker: LineBlocker,
    private readonly mvt: ModelViewTransform2,
  ) {
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
    this.handle1 = createHandle(blocker.p1, mvt);
    this.handle2 = createHandle(blocker.p2, mvt);

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
      mvt,
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
      mvt,
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
      mvt,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.blocker;
    const vx1 = this.mvt.modelToViewX(p1.x);
    const vy1 = this.mvt.modelToViewY(p1.y);
    const vx2 = this.mvt.modelToViewX(p2.x);
    const vy2 = this.mvt.modelToViewY(p2.y);
    const shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
  }
}

opticsLab.register("LineBlockerView", LineBlockerView);
