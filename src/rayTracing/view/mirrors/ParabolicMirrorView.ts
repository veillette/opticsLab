/**
 * ParabolicMirrorView.ts
 *
 * Scenery node for a parabolic mirror. Replicates the model's polyline
 * approximation (80 segments) and renders it with mirror styling.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ParabolicMirror } from "../../model/mirrors/ParabolicMirror.js";
import type { Point } from "../../model/optics/Geometry.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "#666";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#d8d8d8";
const FRONT_WIDTH = 2.5;
const NUM_SEGMENTS = 80;

/**
 * Compute the parabola's polyline approximation in scene coordinates.
 * Matches the logic in ParabolicMirror.computePoints().
 */
function computeParabolaPoints(p1: Point, p2: Point, p3: Point): Point[] {
  const chordMidX = (p1.x + p2.x) / 2;
  const chordMidY = (p1.y + p2.y) / 2;
  const chordLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

  if (chordLen < 1e-10) {
    return [p1, p2];
  }

  const tangentX = (p2.x - p1.x) / chordLen;
  const tangentY = (p2.y - p1.y) / chordLen;

  // Sagitta: signed distance of p3 from the chord midpoint in the normal direction
  const sagitta = (p3.x - chordMidX) * -tangentY + (p3.y - chordMidY) * tangentX;

  const halfAperture = chordLen / 2;
  const a = halfAperture ** 2 === 0 ? 0 : sagitta / halfAperture ** 2;

  const points: Point[] = [];
  for (let i = 0; i <= NUM_SEGMENTS; i++) {
    const t = -1 + (2 * i) / NUM_SEGMENTS;
    const u = t * halfAperture;
    const v = a * u * u;
    points.push({
      x: chordMidX + tangentX * u - tangentY * v,
      y: chordMidY + tangentY * u + tangentX * v,
    });
  }
  return points;
}

function buildPolylineShape(pts: Point[]): Shape {
  const shape = new Shape();
  const first = pts[0];
  if (!first) {
    return shape;
  }
  shape.moveTo(first.x, first.y);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p) {
      shape.lineTo(p.x, p.y);
    }
  }
  return shape;
}

export class ParabolicMirrorView extends Node {
  public constructor(mirror: ParabolicMirror) {
    super();

    const pts = computeParabolaPoints(mirror.p1, mirror.p2, mirror.p3);
    const parabolaShape = buildPolylineShape(pts);

    const backPath = new Path(parabolaShape, {
      stroke: BACK_STROKE,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });

    const frontPath = new Path(parabolaShape, {
      stroke: FRONT_STROKE,
      lineWidth: FRONT_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });

    this.addChild(backPath);
    this.addChild(frontPath);
  }
}

opticsLab.register("ParabolicMirrorView", ParabolicMirrorView);
