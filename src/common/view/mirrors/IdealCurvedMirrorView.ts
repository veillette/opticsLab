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
import { type Circle, Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  IDEAL_MIRROR_LINE_WIDTH,
  IDEAL_MIRROR_TICK_COUNT,
  IDEAL_MIRROR_TICK_LENGTH_M,
  IDEAL_MIRROR_TICK_LINE_WIDTH,
  MIRROR_FOCAL_MARKER_SIZE_M,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { IdealCurvedMirror } from "../../model/mirrors/IdealCurvedMirror.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachEndpointDrag,
  attachTranslationDrag,
  buildLineHitShape,
  createHandle,
  createLineBodyHitPath,
} from "../ViewHelpers.js";

export class IdealCurvedMirrorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly linePath: Path;
  private readonly tickPath: Path;
  private readonly bodyHitPath: Path;
  private readonly focalMarker1: Path;
  private readonly focalMarker2: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly mirror: IdealCurvedMirror,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.linePath = new Path(null, {
      stroke: OpticsLabColors.idealMirrorStrokeProperty,
      lineWidth: IDEAL_MIRROR_LINE_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.tickPath = new Path(null, {
      stroke: OpticsLabColors.idealMirrorTickStrokeProperty,
      lineWidth: IDEAL_MIRROR_TICK_LINE_WIDTH,
      lineCap: "butt",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.focalMarker1 = new Path(null, { fill: OpticsLabColors.focalMarkerFillProperty, pickable: false });
    this.focalMarker2 = new Path(null, { fill: OpticsLabColors.focalMarkerFillProperty, pickable: false });
    this.handle1 = createHandle(mirror.p1, modelViewTransform);
    this.handle2 = createHandle(mirror.p2, modelViewTransform);

    this.addChild(this.linePath);
    this.addChild(this.tickPath);
    this.addChild(this.focalMarker1);
    this.addChild(this.focalMarker2);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
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

  public override rebuild(): void {
    const { p1, p2 } = this.mirror;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy); // model length

    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);

    this.linePath.shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);

    if (len > 1e-10) {
      const ux = dx / len;
      const uy = dy / len;
      // Normal direction (perpendicular to mirror, pointing "back"), model space
      const nx = -uy;
      const ny = ux;

      const tickShape = new Shape();
      for (let i = 0; i <= IDEAL_MIRROR_TICK_COUNT; i++) {
        const t = i / IDEAL_MIRROR_TICK_COUNT;
        // Tick base and tip in model space
        const mx = p1.x + dx * t;
        const my = p1.y + dy * t;
        const tx = mx + nx * IDEAL_MIRROR_TICK_LENGTH_M;
        const ty = my + ny * IDEAL_MIRROR_TICK_LENGTH_M;
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

    // Focal-point markers on both sides of the mirror
    if (len > 1e-10) {
      const ux = dx / len;
      const uy = dy / len;
      const axisX = -uy; // normal to mirror (optical axis direction)
      const axisY = ux;
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const f = this.mirror.focalLength;
      const vs = Math.abs(this.modelViewTransform.modelToViewDeltaX(MIRROR_FOCAL_MARKER_SIZE_M));

      // Focal point on each side of the mirror
      const f1x = this.modelViewTransform.modelToViewX(cx + axisX * f);
      const f1y = this.modelViewTransform.modelToViewY(cy + axisY * f);
      const f2x = this.modelViewTransform.modelToViewX(cx - axisX * f);
      const f2y = this.modelViewTransform.modelToViewY(cy - axisY * f);

      this.focalMarker1.shape = new Shape()
        .moveTo(f1x - vs, f1y)
        .lineTo(f1x, f1y - vs)
        .lineTo(f1x + vs, f1y)
        .lineTo(f1x, f1y + vs)
        .close();
      this.focalMarker2.shape = new Shape()
        .moveTo(f2x - vs, f2y)
        .lineTo(f2x, f2y - vs)
        .lineTo(f2x + vs, f2y)
        .lineTo(f2x, f2y + vs)
        .close();
    } else {
      this.focalMarker1.shape = null;
      this.focalMarker2.shape = null;
    }

    this.rebuildEmitter.emit();
  }
}

opticsLab.register("IdealCurvedMirrorView", IdealCurvedMirrorView);
