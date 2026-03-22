/**
 * TransmissionGratingView.ts
 *
 * View for a transmission diffraction grating. Rendered as a line segment
 * with short perpendicular tick marks to represent the periodic groove structure.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  GLASS_STROKE_WIDTH,
  TRANSMISSION_GRATING_TICK_COUNT,
  TRANSMISSION_GRATING_TICK_HALF_PX,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { TransmissionGrating } from "../../model/gratings/TransmissionGrating.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";

export class TransmissionGratingView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;

  private readonly bodyPath: Path;
  private readonly tickPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

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
    this.handle1 = makeEndpointHandle(
      () => grating.p1,
      (p) => {
        grating.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    this.handle2 = makeEndpointHandle(
      () => grating.p2,
      (p) => {
        grating.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );

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
  }

  public override rebuild(): void {
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
      for (let i = 1; i <= TRANSMISSION_GRATING_TICK_COUNT; i++) {
        const t = i / (TRANSMISSION_GRATING_TICK_COUNT + 1);
        const cx = vx1 + dx * t;
        const cy = vy1 + dy * t;
        tickShape.moveTo(cx - nx * TRANSMISSION_GRATING_TICK_HALF_PX, cy - ny * TRANSMISSION_GRATING_TICK_HALF_PX);
        tickShape.lineTo(cx + nx * TRANSMISSION_GRATING_TICK_HALF_PX, cy + ny * TRANSMISSION_GRATING_TICK_HALF_PX);
      }
      this.tickPath.shape = tickShape;
    }

    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("TransmissionGratingView", TransmissionGratingView);
