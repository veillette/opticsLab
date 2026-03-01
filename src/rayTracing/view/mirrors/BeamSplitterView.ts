/**
 * BeamSplitterView.ts
 *
 * Scenery node for a beam-splitter element. Rendered as a semi-transparent
 * amber line, visually indicating partial transmission and partial reflection.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BeamSplitterElement } from "../../model/mirrors/BeamSplitterElement.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "rgba(100, 90, 0, 0.5)";
const BACK_WIDTH = 5;
const FRONT_STROKE = "rgba(220, 200, 60, 0.85)";
const FRONT_WIDTH = 2.5;

export class BeamSplitterView extends Node {
  public constructor(splitter: BeamSplitterElement) {
    super();

    const { p1, p2 } = splitter;

    const shape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);

    // Subtle backing
    const backPath = new Path(shape, {
      stroke: BACK_STROKE,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
    });

    // Semi-transparent amber front — conveys partial reflectance
    const frontPath = new Path(shape, {
      stroke: FRONT_STROKE,
      lineWidth: FRONT_WIDTH,
      lineCap: "round",
    });

    this.addChild(backPath);
    this.addChild(frontPath);
  }
}

opticsLab.register("BeamSplitterView", BeamSplitterView);
