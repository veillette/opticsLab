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

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import { HALF_PLANE_BORDER_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { HalfPlaneGlass } from "../../model/glass/HalfPlaneGlass.js";
import {
  attachEndpointDrag,
  attachTranslationDrag,
  buildLineHitShape,
  createHandle,
  createLineBodyHitPath,
} from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BORDER_STROKE = "rgba(60, 130, 210, 0.95)";

/** Map refractive index to a fill opacity so denser glass looks more opaque. */
function glassOpacity(refIndex: number): number {
  // n=1 → ~0.05 (barely visible), n=3 → ~0.40
  return 0.05 + ((refIndex - 1.0) / 2.0) * 0.35;
}

function glassFill(refIndex: number): string {
  return `rgba(100, 160, 255, ${glassOpacity(refIndex).toFixed(3)})`;
}

// How far (px) the border line extends beyond the handles on each end
const LINE_EXTEND_PX = 5000;

// How far (px) the glass-side fill extends from the boundary
const GLASS_DEPTH_PX = 5000;

export class HalfPlaneGlassView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly glassPath: Path;
  private readonly borderPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly glass: HalfPlaneGlass,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.glassPath = new Path(null, {
      fill: glassFill(glass.refIndex),
      pickable: false,
    });
    this.borderPath = new Path(null, {
      stroke: BORDER_STROKE,
      lineWidth: HALF_PLANE_BORDER_WIDTH,
      lineCap: "butt",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = createHandle(glass.p1, modelViewTransform);
    this.handle2 = createHandle(glass.p2, modelViewTransform);

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
    );
    attachEndpointDrag(
      this.handle1,
      () => glass.p1,
      (p) => {
        glass.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => glass.p2,
      (p) => {
        glass.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private rebuild(): void {
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

    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;

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
    const ex1 = vx1 - LINE_EXTEND_PX * ndx;
    const ey1 = vy1 - LINE_EXTEND_PX * ndy;
    const ex2 = vx2 + LINE_EXTEND_PX * ndx;
    const ey2 = vy2 + LINE_EXTEND_PX * ndy;

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
      .lineTo(ex2 + nlvx * GLASS_DEPTH_PX, ey2 + nlvy * GLASS_DEPTH_PX)
      .lineTo(ex1 + nlvx * GLASS_DEPTH_PX, ey1 + nlvy * GLASS_DEPTH_PX)
      .close();
  }
}

opticsLab.register("HalfPlaneGlassView", HalfPlaneGlassView);
