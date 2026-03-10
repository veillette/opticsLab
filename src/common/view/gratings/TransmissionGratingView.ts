/**
 * TransmissionGratingView.ts
 *
 * View for a transmission diffraction grating. Rendered as a line segment
 * with short perpendicular tick marks to represent the periodic groove structure.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import { GLASS_STROKE_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { TransmissionGrating } from "../../model/gratings/TransmissionGrating.js";
import {
  attachEndpointDrag,
  attachTranslationDrag,
  buildLineHitShape,
  createHandle,
  createLineBodyHitPath,
} from "../ViewHelpers.js";

/** Number of groove ticks drawn on the grating visual. */
const TICK_COUNT = 12;
/** Half-length of each tick mark in pixels. */
const TICK_HALF_PX = 4;

export class TransmissionGratingView extends Node {
  public readonly bodyDragListener: RichDragListener;
  public onRebuild: (() => void) | null = null;

  private readonly bodyPath: Path;
  private readonly tickPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly grating: TransmissionGrating,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.bodyPath = new Path(null, {
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: GLASS_STROKE_WIDTH + 1,
      lineCap: "round",
      pickable: false,
    });
    this.tickPath = new Path(null, {
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1,
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = createHandle(grating.p1, modelViewTransform);
    this.handle2 = createHandle(grating.p2, modelViewTransform);

    this.addChild(this.bodyPath);
    this.addChild(this.tickPath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      [
        {
          get: () => grating.p1,
          set: (p) => {
            grating.p1 = p;
          },
        },
        {
          get: () => grating.p2,
          set: (p) => {
            grating.p2 = p;
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
      () => grating.p1,
      (p) => {
        grating.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => grating.p2,
      (p) => {
        grating.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.grating;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);

    // Main body line
    const bodyShape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.bodyPath.shape = bodyShape;
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);

    // Tick marks perpendicular to the grating line
    const dx = vx2 - vx1;
    const dy = vy2 - vy1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const nx = -dy / len;
      const ny = dx / len;
      const tickShape = new Shape();
      for (let i = 1; i <= TICK_COUNT; i++) {
        const t = i / (TICK_COUNT + 1);
        const cx = vx1 + dx * t;
        const cy = vy1 + dy * t;
        tickShape.moveTo(cx - nx * TICK_HALF_PX, cy - ny * TICK_HALF_PX);
        tickShape.lineTo(cx + nx * TICK_HALF_PX, cy + ny * TICK_HALF_PX);
      }
      this.tickPath.shape = tickShape;
    }

    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
    this.onRebuild?.();
  }
}

opticsLab.register("TransmissionGratingView", TransmissionGratingView);
