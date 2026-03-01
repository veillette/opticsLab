/**
 * IdealCurvedMirrorView.ts
 *
 * Scenery node for an ideal curved mirror (obeys the mirror equation exactly).
 * Rendered as a golden line segment with small focal-length tick marks, visually
 * distinguishing it from a physical curved mirror.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { IdealCurvedMirror } from "../../model/mirrors/IdealCurvedMirror.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const MIRROR_STROKE = "#e8c000";
const MIRROR_WIDTH = 3;
const TICK_STROKE = "#b89000";
const TICK_WIDTH = 1.5;
const TICK_LENGTH = 6;
const TICK_COUNT = 5;

export class IdealCurvedMirrorView extends Node {
  public constructor(mirror: IdealCurvedMirror) {
    super();

    const { p1, p2 } = mirror;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Main mirror line
    const lineShape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);
    const linePath = new Path(lineShape, {
      stroke: MIRROR_STROKE,
      lineWidth: MIRROR_WIDTH,
      lineCap: "round",
    });
    this.addChild(linePath);

    // Tick marks along the mirror body (indicating an ideal element)
    if (len > 1e-10) {
      const ux = dx / len;
      const uy = dy / len;
      // Normal direction (perpendicular to mirror, pointing "back")
      const nx = -uy;
      const ny = ux;

      const tickShape = new Shape();
      for (let i = 0; i <= TICK_COUNT; i++) {
        const t = i / TICK_COUNT;
        const mx = p1.x + dx * t;
        const my = p1.y + dy * t;
        tickShape.moveTo(mx, my);
        tickShape.lineTo(mx + nx * TICK_LENGTH, my + ny * TICK_LENGTH);
      }

      const tickPath = new Path(tickShape, {
        stroke: TICK_STROKE,
        lineWidth: TICK_WIDTH,
        lineCap: "butt",
      });
      this.addChild(tickPath);
    }
  }
}

opticsLab.register("IdealCurvedMirrorView", IdealCurvedMirrorView);
