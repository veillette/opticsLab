/**
 * HalfPlaneGlassView.ts
 *
 * Scenery node for a half-plane glass element. Renders:
 *  - A wide semi-transparent fill covering the glass side (left of p1→p2)
 *  - A boundary line that extends far beyond the handles on both ends
 *  - Endpoint handles for rotating/resizing the boundary
 *  - An invisible body-drag hit path so dragging anywhere on the
 *    boundary line translates the whole element
 */

import { BooleanProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors, { glassFill } from "../../../OpticsLabColors.js";
import {
  HALF_PLANE_BORDER_WIDTH,
  HALF_PLANE_GLASS_DEPTH_PX,
  HALF_PLANE_LINE_EXTEND_PX,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { HalfPlaneGlass } from "../../model/glass/HalfPlaneGlass.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";

export class HalfPlaneGlassView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly glassPath: Path;
  private readonly borderPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

  private readonly glass: HalfPlaneGlass;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(
    glass: HalfPlaneGlass,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions?: ViewOptionsModel,
  ) {
    super();
    this.glass = glass;
    this.modelViewTransform = modelViewTransform;

    const handlesVisibleProperty = viewOptions?.handlesVisibleProperty ?? new BooleanProperty(true);

    this.glassPath = new Path(null, {
      fill: glassFill(glass.refIndex),
      pickable: false,
    });
    this.borderPath = new Path(null, {
      stroke: OpticsLabColors.glassBorderStrokeProperty,
      lineWidth: HALF_PLANE_BORDER_WIDTH,
      lineCap: "butt",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = makeEndpointHandle(
      () => glass.p1,
      (p) => {
        glass.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
      handlesVisibleProperty,
    );
    this.handle2 = makeEndpointHandle(
      () => glass.p2,
      (p) => {
        glass.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
      handlesVisibleProperty,
    );

    // Glass fill drawn first (behind everything)
    this.addChild(this.glassPath);
    this.addChild(this.borderPath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
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
      modelViewTransform,
      tandem.createTandem("bodyDragListener"),
    );
  }

  protected override _doRebuild(): void {
    // Update fill opacity to reflect current refractive index
    this.glassPath.fill = glassFill(this.glass.refIndex);

    const { p1, p2 } = this.glass;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);

    this.handle1.syncToModel();
    this.handle2.syncToModel();

    // Body hit path over the actual p1–p2 segment for drag interaction
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);

    if (len < 1e-10) {
      this.borderPath.shape = null;
      this.glassPath.shape = null;
      return;
    }

    // Normalised view-space direction along the boundary (p1→p2)
    const vdx = vx2 - vx1;
    const vdy = vy2 - vy1;
    const vLen = Math.sqrt(vdx * vdx + vdy * vdy);
    const ndx = vdx / vLen;
    const ndy = vdy / vLen;

    // Extended endpoints that reach "at infinity" on both ends
    const ex1 = vx1 - HALF_PLANE_LINE_EXTEND_PX * ndx;
    const ey1 = vy1 - HALF_PLANE_LINE_EXTEND_PX * ndy;
    const ex2 = vx2 + HALF_PLANE_LINE_EXTEND_PX * ndx;
    const ey2 = vy2 + HALF_PLANE_LINE_EXTEND_PX * ndy;

    this.borderPath.shape = new Shape().moveTo(ex1, ey1).lineTo(ex2, ey2);

    // Glass-side normal in view space.
    // The model left normal is (-dy/len, dx/len); convert to view by
    // transforming a delta from the segment midpoint.
    const midMx = (p1.x + p2.x) / 2;
    const midMy = (p1.y + p2.y) / 2;
    const leftNx = -dy / len; // model left-normal components
    const leftNy = dx / len;
    const leftVx = this.modelViewTransform.modelToViewX(midMx + leftNx) - this.modelViewTransform.modelToViewX(midMx);
    const leftVy = this.modelViewTransform.modelToViewY(midMy + leftNy) - this.modelViewTransform.modelToViewY(midMy);
    const leftVLen = Math.sqrt(leftVx * leftVx + leftVy * leftVy);
    const nlvx = leftVx / leftVLen;
    const nlvy = leftVy / leftVLen;

    // Fill polygon: extended boundary + deep offset on the glass side
    this.glassPath.shape = new Shape()
      .moveTo(ex1, ey1)
      .lineTo(ex2, ey2)
      .lineTo(ex2 + nlvx * HALF_PLANE_GLASS_DEPTH_PX, ey2 + nlvy * HALF_PLANE_GLASS_DEPTH_PX)
      .lineTo(ex1 + nlvx * HALF_PLANE_GLASS_DEPTH_PX, ey1 + nlvy * HALF_PLANE_GLASS_DEPTH_PX)
      .close();
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("HalfPlaneGlassView", HalfPlaneGlassView);
