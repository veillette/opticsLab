/**
 * ArcMirrorView.ts
 *
 * Scenery node for a circular-arc mirror. Samples points along the arc
 * from p1 to p2 through p3 and renders the polyline with mirror styling.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ArcMirror } from "../../model/mirrors/ArcMirror.js";
import type { Point } from "../../model/optics/Geometry.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "#666";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#d8d8d8";
const FRONT_WIDTH = 2.5;
const ARC_SAMPLE_COUNT = 60;

/**
 * Compute the circumcenter of triangle (p1, p2, p3).
 * Returns null if the three points are collinear.
 */
function circumcenter(p1: Point, p2: Point, p3: Point): { center: Point; radius: number } | null {
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;

  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-10) {
    return null; // collinear
  }

  const a2 = ax * ax + ay * ay;
  const b2 = bx * bx + by * by;
  const c2 = cx * cx + cy * cy;

  const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / D;
  const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / D;

  const center = { x: ux, y: uy };
  const radius = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);
  return { center, radius };
}

/**
 * Sample points along the circular arc from p1 to p2 passing through p3.
 */
function sampleArcPoints(p1: Point, p2: Point, p3: Point, n: number): Point[] {
  const geo = circumcenter(p1, p2, p3);
  if (!geo) {
    // Collinear: draw a straight line
    const pts: Point[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });
    }
    return pts;
  }

  const { center, radius } = geo;
  const norm = (a: number): number => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const a1 = norm(Math.atan2(p1.y - center.y, p1.x - center.x));
  const a2 = norm(Math.atan2(p2.y - center.y, p2.x - center.x));
  const a3 = norm(Math.atan2(p3.y - center.y, p3.x - center.x));

  // CCW sweep from a1 to a2; check if a3 is within this sweep
  const ccwSweep12 = norm(a2 - a1);
  const ccwDist13 = norm(a3 - a1);

  // If a3 is within the CCW sweep from a1 to a2, go CCW; otherwise go CW
  const sweepAngle = ccwDist13 < ccwSweep12 ? ccwSweep12 : -(2 * Math.PI - ccwSweep12);

  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const angle = a1 + sweepAngle * (i / n);
    pts.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return pts;
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

export class ArcMirrorView extends Node {
  public constructor(mirror: ArcMirror) {
    super();

    const pts = sampleArcPoints(mirror.p1, mirror.p2, mirror.p3, ARC_SAMPLE_COUNT);
    const arcShape = buildPolylineShape(pts);

    const backPath = new Path(arcShape, {
      stroke: BACK_STROKE,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });

    const frontPath = new Path(arcShape, {
      stroke: FRONT_STROKE,
      lineWidth: FRONT_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });

    this.addChild(backPath);
    this.addChild(frontPath);
  }
}

opticsLab.register("ArcMirrorView", ArcMirrorView);
