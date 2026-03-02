/**
 * ParabolicMirrorView.ts
 *
 * Scenery node for a parabolic mirror. Replicates the model's polyline
 * approximation (80 segments) and renders it with mirror styling.
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ParabolicMirror } from "../../model/mirrors/ParabolicMirror.js";
import type { Point } from "../../model/optics/Geometry.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "#666";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#d8d8d8";
const FRONT_WIDTH = 2.5;
const NUM_SEGMENTS = 80;

/**
 * Compute the parabola's polyline approximation in model coordinates.
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

export class ParabolicMirrorView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;
  private readonly handle3: Circle;

  public constructor(
    private readonly mirror: ParabolicMirror,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.backPath = new Path(null, {
      stroke: BACK_STROKE,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });
    this.frontPath = new Path(null, {
      stroke: FRONT_STROKE,
      lineWidth: FRONT_WIDTH,
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
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle3,
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
    const { p1, p2, p3 } = this.mirror;
    // Compute parabola in model space, then convert to view space for the Shape
    const pts = computeParabolaPoints(p1, p2, p3);
    const parabolaShape = buildViewShape(pts, this.modelViewTransform);
    this.backPath.shape = parabolaShape;
    this.frontPath.shape = parabolaShape;
    this.handle1.x = this.modelViewTransform.modelToViewX(p1.x);
    this.handle1.y = this.modelViewTransform.modelToViewY(p1.y);
    this.handle2.x = this.modelViewTransform.modelToViewX(p2.x);
    this.handle2.y = this.modelViewTransform.modelToViewY(p2.y);
    this.handle3.x = this.modelViewTransform.modelToViewX(p3.x);
    this.handle3.y = this.modelViewTransform.modelToViewY(p3.y);
  }
}

opticsLab.register("ParabolicMirrorView", ParabolicMirrorView);
