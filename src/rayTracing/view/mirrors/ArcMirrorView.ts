/**
 * ArcMirrorView.ts
 *
 * Scenery node for a circular-arc mirror. Samples points along the arc
 * from p1 to p2 through p3 and renders the polyline with mirror styling.
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import { ARC_MIRROR_SAMPLE_COUNT, MIRROR_BACK_WIDTH, MIRROR_FRONT_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ArcMirror } from "../../model/mirrors/ArcMirror.js";
import type { Point } from "../../model/optics/Geometry.js";
import {
  attachCurvatureHandleDrag,
  attachEndpointDrag,
  attachTranslationDrag,
  createHandle,
  projectPointOntoPerpendicularBisector,
} from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "#666";
const FRONT_STROKE = "#d8d8d8";

/**
 * Compute the circumcenter of triangle (p1, p2, p3).
 * Returns null if the three points are collinear.
 * All coordinates are in model space.
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
 * Returns model-space points.
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

/**
 * Build a view-space polyline Shape from model-space points, converting via modelViewTransform.
 */
function buildViewShape(pts: Point[], modelViewTransform: ModelViewTransform2): Shape {
  const shape = new Shape();
  const first = pts[0];
  if (!first) {
    return shape;
  }
  shape.moveTo(modelViewTransform.modelToViewX(first.x), modelViewTransform.modelToViewY(first.y));
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p) {
      shape.lineTo(modelViewTransform.modelToViewX(p.x), modelViewTransform.modelToViewY(p.y));
    }
  }
  return shape;
}

export class ArcMirrorView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;
  private readonly handle3: Circle;

  public constructor(
    private readonly mirror: ArcMirror,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.backPath = new Path(null, {
      stroke: BACK_STROKE,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });
    this.frontPath = new Path(null, {
      stroke: FRONT_STROKE,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });
    this.handle1 = createHandle(mirror.p1, modelViewTransform);
    this.handle2 = createHandle(mirror.p2, modelViewTransform);
    this.handle3 = createHandle(mirror.p3, modelViewTransform);

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.backPath,
      [
        {
          get: () => mirror.p1,
          set: (p) => {
            mirror.p1 = p;
          },
        },
        {
          get: () => mirror.p2,
          set: (p) => {
            mirror.p2 = p;
          },
        },
        {
          get: () => mirror.p3,
          set: (p) => {
            mirror.p3 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle1,
      () => mirror.p1,
      (p) => {
        mirror.p1 = p;
        mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => mirror.p2,
      (p) => {
        mirror.p2 = p;
        mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachCurvatureHandleDrag(
      this.handle3,
      () => mirror.p1,
      () => mirror.p2,
      () => mirror.p3,
      (p) => {
        mirror.p3 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.mirror;
    // Keep curvature handle at the vertex (on perpendicular bisector of chord)
    this.mirror.p3 = projectPointOntoPerpendicularBisector(this.mirror.p3, p1, p2);
    const p3 = this.mirror.p3;
    // Compute arc in model space, then convert to view space for the Shape
    const pts = sampleArcPoints(p1, p2, p3, ARC_MIRROR_SAMPLE_COUNT);
    const arcShape = buildViewShape(pts, this.modelViewTransform);
    this.backPath.shape = arcShape;
    this.frontPath.shape = arcShape;
    this.handle1.x = this.modelViewTransform.modelToViewX(p1.x);
    this.handle1.y = this.modelViewTransform.modelToViewY(p1.y);
    this.handle2.x = this.modelViewTransform.modelToViewX(p2.x);
    this.handle2.y = this.modelViewTransform.modelToViewY(p2.y);
    this.handle3.x = this.modelViewTransform.modelToViewX(p3.x);
    this.handle3.y = this.modelViewTransform.modelToViewY(p3.y);
  }
}

opticsLab.register("ArcMirrorView", ArcMirrorView);
