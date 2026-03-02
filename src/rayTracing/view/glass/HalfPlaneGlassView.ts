/**
 * HalfPlaneGlassView.ts
 *
 * Scenery node for a half-plane glass element. Renders the boundary line
 * (p1 → p2) with short hatching strokes on the glass side (left when
 * looking from p1 toward p2), indicating the refractive medium.
 * Endpoint handles and a body-drag region let the user reposition the element.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { HalfPlaneGlass } from "../../model/glass/HalfPlaneGlass.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BORDER_STROKE = "rgba(60, 130, 210, 0.9)";
const BORDER_WIDTH = 2;
const HATCH_STROKE = "rgba(100, 180, 255, 0.45)";
const HATCH_WIDTH = 1;
const HATCH_SPACING = 20; // pixels between hatching lines
const HATCH_DEPTH = 18; // how far into the glass the hatching goes
const HATCH_COUNT = 8; // maximum number of hatch lines

export class HalfPlaneGlassView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly borderPath: Path;
  private readonly hatchPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(private readonly glass: HalfPlaneGlass) {
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
    this.handle1 = createHandle(glass.p1);
    this.handle2 = createHandle(glass.p2);

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
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.glass;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    this.borderPath.shape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);

    if (len > 1e-10) {
      // Unit along-edge vector and left-normal (into the glass)
      const ux = dx / len;
      const uy = dy / len;
      // Left normal (perpendicular, pointing into glass side)
      const leftNx = -uy;
      const leftNy = ux;

      const hatchShape = new Shape();
      const count = Math.min(HATCH_COUNT, Math.floor(len / HATCH_SPACING) + 1);
      for (let i = 0; i <= count; i++) {
        const t = count > 0 ? i / count : 0;
        const bx = p1.x + dx * t;
        const by = p1.y + dy * t;
        hatchShape.moveTo(bx, by);
        hatchShape.lineTo(bx + leftNx * HATCH_DEPTH, by + leftNy * HATCH_DEPTH);
      }
      this.hatchPath.shape = hatchShape;
    } else {
      this.hatchPath.shape = null;
    }

    this.handle1.x = p1.x;
    this.handle1.y = p1.y;
    this.handle2.x = p2.x;
    this.handle2.y = p2.y;
  }
}

opticsLab.register("HalfPlaneGlassView", HalfPlaneGlassView);
