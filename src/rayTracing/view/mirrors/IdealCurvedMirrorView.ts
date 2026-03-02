/**
 * IdealCurvedMirrorView.ts
 *
 * Scenery node for an ideal curved mirror (obeys the mirror equation exactly).
 * Rendered as a golden line segment with small focal-length tick marks, visually
 * distinguishing it from a physical curved mirror.
 * Endpoint handles and a body-drag region let the user reposition the mirror.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { IdealCurvedMirror } from "../../model/mirrors/IdealCurvedMirror.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const MIRROR_STROKE = "#e8c000";
const MIRROR_WIDTH = 3;
const TICK_STROKE = "#b89000";
const TICK_WIDTH = 1.5;
const TICK_LENGTH = 0.06; // metres (was 6px)
const TICK_COUNT = 5;

export class IdealCurvedMirrorView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly linePath: Path;
  private readonly tickPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly mirror: IdealCurvedMirror,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.linePath = new Path(null, {
      stroke: MIRROR_STROKE,
      lineWidth: MIRROR_WIDTH,
      lineCap: "round",
    });
    this.tickPath = new Path(null, {
      stroke: TICK_STROKE,
      lineWidth: TICK_WIDTH,
      lineCap: "butt",
    });
    this.handle1 = createHandle(mirror.p1, modelViewTransform);
    this.handle2 = createHandle(mirror.p2, modelViewTransform);

    this.addChild(this.linePath);
    this.addChild(this.tickPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.linePath,
      [
        {
          get: () => mirror.p1,
          set: (p) => {
            mirror.p1 = p;
          },
        },
        {
          get: () => mirror.p2,
          set: (p) => {
            mirror.p2 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle1,
      () => mirror.p1,
      (p) => {
        mirror.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => mirror.p2,
      (p) => {
        mirror.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.mirror;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy); // model length

    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);

    this.linePath.shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);

    if (len > 1e-10) {
      const ux = dx / len;
      const uy = dy / len;
      // Normal direction (perpendicular to mirror, pointing "back"), model space
      const nx = -uy;
      const ny = ux;

      const tickShape = new Shape();
      for (let i = 0; i <= TICK_COUNT; i++) {
        const t = i / TICK_COUNT;
        // Tick base and tip in model space
        const mx = p1.x + dx * t;
        const my = p1.y + dy * t;
        const tx = mx + nx * TICK_LENGTH;
        const ty = my + ny * TICK_LENGTH;
        tickShape.moveTo(this.modelViewTransform.modelToViewX(mx), this.modelViewTransform.modelToViewY(my));
        tickShape.lineTo(this.modelViewTransform.modelToViewX(tx), this.modelViewTransform.modelToViewY(ty));
      }
      this.tickPath.shape = tickShape;
    } else {
      this.tickPath.shape = null;
    }

    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
  }
}

opticsLab.register("IdealCurvedMirrorView", IdealCurvedMirrorView);
