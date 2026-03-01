/**
 * HalfPlaneGlassView.ts
 *
 * Scenery node for a half-plane glass element. Renders the boundary line
 * (p1 → p2) with short hatching strokes on the glass side (left when
 * looking from p1 toward p2), indicating the refractive medium.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { HalfPlaneGlass } from "../../model/glass/HalfPlaneGlass.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BORDER_STROKE = "rgba(60, 130, 210, 0.9)";
const BORDER_WIDTH = 2;
const HATCH_STROKE = "rgba(100, 180, 255, 0.45)";
const HATCH_WIDTH = 1;
const HATCH_SPACING = 20; // pixels between hatching lines
const HATCH_DEPTH = 18; // how far into the glass the hatching goes
const HATCH_COUNT = 8; // maximum number of hatch lines

export class HalfPlaneGlassView extends Node {
  public constructor(glass: HalfPlaneGlass) {
    super();

    const { p1, p2 } = glass;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Boundary line
    const borderShape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);
    const borderPath = new Path(borderShape, {
      stroke: BORDER_STROKE,
      lineWidth: BORDER_WIDTH,
      lineCap: "round",
    });
    this.addChild(borderPath);

    if (len < 1e-10) {
      return;
    }

    // Unit along-edge vector and left-normal (into the glass)
    const ux = dx / len;
    const uy = dy / len;
    // Left normal (perpendicular, pointing into glass side)
    const leftNx = -uy;
    const leftNy = ux;

    // Draw hatching lines evenly spaced along the boundary
    const hatchShape = new Shape();
    const count = Math.min(HATCH_COUNT, Math.floor(len / HATCH_SPACING) + 1);
    for (let i = 0; i <= count; i++) {
      const t = count > 0 ? i / count : 0;
      const bx = p1.x + dx * t;
      const by = p1.y + dy * t;
      hatchShape.moveTo(bx, by);
      hatchShape.lineTo(bx + leftNx * HATCH_DEPTH, by + leftNy * HATCH_DEPTH);
    }

    const hatchPath = new Path(hatchShape, {
      stroke: HATCH_STROKE,
      lineWidth: HATCH_WIDTH,
      lineCap: "butt",
    });
    this.addChild(hatchPath);
  }
}

opticsLab.register("HalfPlaneGlassView", HalfPlaneGlassView);
