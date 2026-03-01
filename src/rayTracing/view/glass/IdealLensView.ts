/**
 * IdealLensView.ts
 *
 * Scenery node for an ideal thin lens. Rendered as a bold green line
 * with arrow heads at each end, indicating the converging or diverging
 * power encoded by the focal length.
 * Endpoint handles and a body-drag region let the user reposition the lens.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { IdealLens } from "../../model/glass/IdealLens.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const LENS_STROKE = "#44cc88";
const LENS_WIDTH = 3;
const ARROW_SIZE = 10; // half-length of each arrow head arm

export class IdealLensView extends Node {
  private readonly linePath: Path;
  private readonly arrowPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(private readonly lens: IdealLens) {
    super();

    this.linePath = new Path(null, {
      stroke: LENS_STROKE,
      lineWidth: LENS_WIDTH,
      lineCap: "round",
    });
    this.arrowPath = new Path(null, {
      stroke: LENS_STROKE,
      lineWidth: LENS_WIDTH * 0.75,
      lineCap: "round",
    });
    this.handle1 = createHandle(lens.p1);
    this.handle2 = createHandle(lens.p2);

    this.addChild(this.linePath);
    this.addChild(this.arrowPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    attachTranslationDrag(
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
    );
  }

  private rebuild(): void {
    const { p1, p2, focalLength } = this.lens;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    this.linePath.shape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);

    if (len > 1e-10) {
      // Unit vectors along and perpendicular to the lens
      const ux = dx / len;
      const uy = dy / len;
      // Normal to lens (perpendicular)
      const nx = -uy;
      const ny = ux;

      // Arrow direction: outward (converging) for focalLength > 0,
      //                 inward (diverging) for focalLength < 0
      const arrowSign = focalLength >= 0 ? 1 : -1;

      const arrowShape = new Shape();

      // Arrow at p1: tip in +normal direction
      const tip1X = p1.x + nx * ARROW_SIZE * arrowSign;
      const tip1Y = p1.y + ny * ARROW_SIZE * arrowSign;
      arrowShape.moveTo(tip1X, tip1Y);
      arrowShape.lineTo(p1.x + ux * ARROW_SIZE * 0.5, p1.y + uy * ARROW_SIZE * 0.5);
      arrowShape.moveTo(tip1X, tip1Y);
      arrowShape.lineTo(p1.x - ux * ARROW_SIZE * 0.5, p1.y - uy * ARROW_SIZE * 0.5);

      // Arrow at p2: tip in -normal direction
      const tip2X = p2.x - nx * ARROW_SIZE * arrowSign;
      const tip2Y = p2.y - ny * ARROW_SIZE * arrowSign;
      arrowShape.moveTo(tip2X, tip2Y);
      arrowShape.lineTo(p2.x + ux * ARROW_SIZE * 0.5, p2.y + uy * ARROW_SIZE * 0.5);
      arrowShape.moveTo(tip2X, tip2Y);
      arrowShape.lineTo(p2.x - ux * ARROW_SIZE * 0.5, p2.y - uy * ARROW_SIZE * 0.5);

      this.arrowPath.shape = arrowShape;
    } else {
      this.arrowPath.shape = null;
    }

    this.handle1.x = p1.x;
    this.handle1.y = p1.y;
    this.handle2.x = p2.x;
    this.handle2.y = p2.y;
  }
}

opticsLab.register("IdealLensView", IdealLensView);
