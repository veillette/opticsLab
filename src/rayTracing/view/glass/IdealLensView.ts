/**
 * IdealLensView.ts
 *
 * Scenery node for an ideal thin lens. Rendered as a bold green line
 * with arrow heads at each end, indicating the converging or diverging
 * power encoded by the focal length.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { IdealLens } from "../../model/glass/IdealLens.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const LENS_STROKE = "#44cc88";
const LENS_WIDTH = 3;
const ARROW_SIZE = 10; // half-length of each arrow head arm

export class IdealLensView extends Node {
  public constructor(lens: IdealLens) {
    super();

    const { p1, p2, focalLength } = lens;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Main lens line
    const lineShape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);
    const linePath = new Path(lineShape, {
      stroke: LENS_STROKE,
      lineWidth: LENS_WIDTH,
      lineCap: "round",
    });
    this.addChild(linePath);

    if (len < 1e-10) {
      return;
    }

    // Unit vectors along and perpendicular to the lens
    const ux = dx / len;
    const uy = dy / len;
    // Normal to lens (perpendicular)
    const nx = -uy;
    const ny = ux;

    // Arrow direction: outward (converging) for focalLength > 0,
    //                 inward (diverging) for focalLength < 0
    const arrowSign = focalLength >= 0 ? 1 : -1;

    // Draw arrow heads at p1 and p2
    const arrowShape = new Shape();

    for (const [px, py, tipDir] of [
      [p1.x, p1.y, 1] as const, // tip pointing in +normal direction at p1
      [p2.x, p2.y, -1] as const, // tip pointing in -normal direction at p2
    ]) {
      // Arrow tip
      const tipX = px + nx * ARROW_SIZE * arrowSign * tipDir;
      const tipY = py + ny * ARROW_SIZE * arrowSign * tipDir;

      // Arrow head arms (angled back 45° from tip toward the line)
      arrowShape.moveTo(tipX, tipY);
      arrowShape.lineTo(px + ux * ARROW_SIZE * 0.5, py + uy * ARROW_SIZE * 0.5);
      arrowShape.moveTo(tipX, tipY);
      arrowShape.lineTo(px - ux * ARROW_SIZE * 0.5, py - uy * ARROW_SIZE * 0.5);
    }

    const arrowPath = new Path(arrowShape, {
      stroke: LENS_STROKE,
      lineWidth: LENS_WIDTH * 0.75,
      lineCap: "round",
    });
    this.addChild(arrowPath);
  }
}

opticsLab.register("IdealLensView", IdealLensView);
