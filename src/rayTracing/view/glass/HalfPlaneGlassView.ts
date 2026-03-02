/**
 * HalfPlaneGlassView.ts
 *
 * Scenery node for a half-plane glass element. Renders the boundary line
 * (p1 → p2) with short hatching strokes on the glass side (left when
 * looking from p1 toward p2), indicating the refractive medium.
 * Endpoint handles and a body-drag region let the user reposition the element.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { HalfPlaneGlass } from "../../model/glass/HalfPlaneGlass.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BORDER_STROKE = "rgba(60, 130, 210, 0.9)";
const BORDER_WIDTH = 2;
const HATCH_STROKE = "rgba(100, 180, 255, 0.45)";
const HATCH_WIDTH = 1;
const HATCH_SPACING = 0.2; // metres between hatching lines
const HATCH_DEPTH = 0.18; // how far into the glass the hatching goes (metres)
const HATCH_COUNT = 8; // maximum number of hatch lines

export class HalfPlaneGlassView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly borderPath: Path;
  private readonly hatchPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly glass: HalfPlaneGlass,
    private readonly mvt: ModelViewTransform2,
  ) {
    super();

    this.borderPath = new Path(null, {
      stroke: BORDER_STROKE,
      lineWidth: BORDER_WIDTH,
      lineCap: "round",
    });
    this.hatchPath = new Path(null, {
      stroke: HATCH_STROKE,
      lineWidth: HATCH_WIDTH,
      lineCap: "butt",
    });
    this.handle1 = createHandle(glass.p1, mvt);
    this.handle2 = createHandle(glass.p2, mvt);

    this.addChild(this.borderPath);
    this.addChild(this.hatchPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.borderPath,
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
      mvt,
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
      mvt,
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
      mvt,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.glass;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy); // model length

    const vx1 = this.mvt.modelToViewX(p1.x);
    const vy1 = this.mvt.modelToViewY(p1.y);
    const vx2 = this.mvt.modelToViewX(p2.x);
    const vy2 = this.mvt.modelToViewY(p2.y);

    this.borderPath.shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);

    if (len > 1e-10) {
      // Unit along-edge vector and left-normal (into the glass), in model space
      const ux = dx / len;
      const uy = dy / len;
      // Left normal (perpendicular, pointing into glass side), model space
      const leftNx = -uy;
      const leftNy = ux;

      const hatchShape = new Shape();
      const count = Math.min(HATCH_COUNT, Math.floor(len / HATCH_SPACING) + 1);
      for (let i = 0; i <= count; i++) {
        const t = count > 0 ? i / count : 0;
        // Hatch base and tip in model space
        const bx = p1.x + dx * t;
        const by = p1.y + dy * t;
        const tx = bx + leftNx * HATCH_DEPTH;
        const ty = by + leftNy * HATCH_DEPTH;
        // Convert to view space
        hatchShape.moveTo(this.mvt.modelToViewX(bx), this.mvt.modelToViewY(by));
        hatchShape.lineTo(this.mvt.modelToViewX(tx), this.mvt.modelToViewY(ty));
      }
      this.hatchPath.shape = hatchShape;
    } else {
      this.hatchPath.shape = null;
    }

    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
  }
}

opticsLab.register("HalfPlaneGlassView", HalfPlaneGlassView);
