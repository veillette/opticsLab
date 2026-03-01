/**
 * SegmentMirrorView.ts
 *
 * Scenery node for a flat (segment) mirror. Renders as a silver reflective
 * line with a dark backing, matching the classic optics-diagram style.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { SegmentMirror } from "../../model/mirrors/SegmentMirror.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "#666";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#d8d8d8";
const FRONT_WIDTH = 2.5;

export class SegmentMirrorView extends Node {
  public constructor(mirror: SegmentMirror) {
    super();

    // Dark backing (shadow side of the mirror)
    const backShape = new Shape().moveTo(mirror.p1.x, mirror.p1.y).lineTo(mirror.p2.x, mirror.p2.y);
    const backPath = new Path(backShape, {
      stroke: BACK_STROKE,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
    });

    // Bright reflective front surface
    const frontShape = new Shape().moveTo(mirror.p1.x, mirror.p1.y).lineTo(mirror.p2.x, mirror.p2.y);
    const frontPath = new Path(frontShape, {
      stroke: FRONT_STROKE,
      lineWidth: FRONT_WIDTH,
      lineCap: "round",
    });

    this.addChild(backPath);
    this.addChild(frontPath);
  }
}

opticsLab.register("SegmentMirrorView", SegmentMirrorView);
