/**
 * IdealLensView.ts
 *
 * Scenery node for an ideal thin lens. Rendered as a bold green line
 * with arrow heads at each end, indicating the converging or diverging
 * power encoded by the focal length.
 * Endpoint handles and a body-drag region let the user reposition the lens.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import {
  IDEAL_LENS_ARROW_ARM_FACTOR,
  IDEAL_LENS_ARROW_SIZE_M,
  IDEAL_LENS_ARROW_WIDTH_FACTOR,
  IDEAL_LENS_LINE_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { IdealLens } from "../../model/glass/IdealLens.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const LENS_STROKE = "#44cc88";

export class IdealLensView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly linePath: Path;
  private readonly arrowPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly lens: IdealLens,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.linePath = new Path(null, {
      stroke: LENS_STROKE,
      lineWidth: IDEAL_LENS_LINE_WIDTH,
      lineCap: "round",
    });
    this.arrowPath = new Path(null, {
      stroke: LENS_STROKE,
      lineWidth: IDEAL_LENS_LINE_WIDTH * IDEAL_LENS_ARROW_WIDTH_FACTOR,
      lineCap: "round",
    });
    this.handle1 = createHandle(lens.p1, modelViewTransform);
    this.handle2 = createHandle(lens.p2, modelViewTransform);

    this.addChild(this.linePath);
    this.addChild(this.arrowPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.linePath,
      [
        {
          get: () => lens.p1,
          set: (p) => {
            lens.p1 = p;
          },
        },
        {
          get: () => lens.p2,
          set: (p) => {
            lens.p2 = p;
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
      () => lens.p1,
      (p) => {
        lens.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => lens.p2,
      (p) => {
        lens.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private rebuild(): void {
    const { p1, p2, focalLength } = this.lens;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy); // model length

    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);

    this.linePath.shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);

    if (len > 1e-10) {
      // Unit vectors along and perpendicular to the lens, in model space
      const ux = dx / len;
      const uy = dy / len;
      // Normal to lens (perpendicular), model space
      const nx = -uy;
      const ny = ux;

      // Arrow direction: outward (converging) for focalLength > 0,
      //                 inward (diverging) for focalLength < 0
      const arrowSign = focalLength >= 0 ? 1 : -1;

      const arrowShape = new Shape();

      // Arrow at p1: tip in +normal direction (model space, then convert)
      const tip1Mx = p1.x - ux * IDEAL_LENS_ARROW_SIZE_M * arrowSign;
      const tip1My = p1.y - uy * IDEAL_LENS_ARROW_SIZE_M * arrowSign;
      arrowShape.moveTo(this.modelViewTransform.modelToViewX(tip1Mx), this.modelViewTransform.modelToViewY(tip1My));
      arrowShape.lineTo(
        this.modelViewTransform.modelToViewX(p1.x + nx * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
        this.modelViewTransform.modelToViewY(p1.y + ny * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
      );
      arrowShape.moveTo(this.modelViewTransform.modelToViewX(tip1Mx), this.modelViewTransform.modelToViewY(tip1My));
      arrowShape.lineTo(
        this.modelViewTransform.modelToViewX(p1.x - nx * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
        this.modelViewTransform.modelToViewY(p1.y - ny * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
      );

      // Arrow at p2: tip in -normal direction (model space, then convert)
      const tip2Mx = p2.x + ux * IDEAL_LENS_ARROW_SIZE_M * arrowSign;
      const tip2My = p2.y + uy * IDEAL_LENS_ARROW_SIZE_M * arrowSign;
      arrowShape.moveTo(this.modelViewTransform.modelToViewX(tip2Mx), this.modelViewTransform.modelToViewY(tip2My));
      arrowShape.lineTo(
        this.modelViewTransform.modelToViewX(p2.x + nx * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
        this.modelViewTransform.modelToViewY(p2.y + ny * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
      );
      arrowShape.moveTo(this.modelViewTransform.modelToViewX(tip2Mx), this.modelViewTransform.modelToViewY(tip2My));
      arrowShape.lineTo(
        this.modelViewTransform.modelToViewX(p2.x - nx * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
        this.modelViewTransform.modelToViewY(p2.y - ny * IDEAL_LENS_ARROW_SIZE_M * IDEAL_LENS_ARROW_ARM_FACTOR),
      );

      this.arrowPath.shape = arrowShape;
    } else {
      this.arrowPath.shape = null;
    }

    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
  }
}

opticsLab.register("IdealLensView", IdealLensView);
