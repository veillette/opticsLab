/**
 * CircleGlassView.ts
 *
 * Scenery node for a circular glass element. Renders as a translucent
 * blue circle matching the model's center (p1) and boundary point (p2).
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { CircleGlass } from "../../model/glass/CircleGlass.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const GLASS_FILL = "rgba(100, 180, 255, 0.22)";
const GLASS_STROKE = "rgba(60, 130, 210, 0.8)";
const GLASS_STROKE_WIDTH = 1.5;

export class CircleGlassView extends Node {
  public constructor(glass: CircleGlass) {
    super();

    const cx = glass.p1.x;
    const cy = glass.p1.y;
    const radius = Math.sqrt((glass.p2.x - cx) ** 2 + (glass.p2.y - cy) ** 2);

    const shape = new Shape().circle(cx, cy, radius);
    const path = new Path(shape, {
      fill: GLASS_FILL,
      stroke: GLASS_STROKE,
      lineWidth: GLASS_STROKE_WIDTH,
    });

    this.addChild(path);
  }
}

opticsLab.register("CircleGlassView", CircleGlassView);
