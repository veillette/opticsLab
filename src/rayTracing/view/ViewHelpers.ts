/**
 * ViewHelpers.ts
 *
 * Shared utilities for building interactive optical-element views:
 *  - createHandle()            – a styled draggable control-point circle
 *  - attachEndpointDrag()      – wires a RichDragListener to a single handle
 *  - attachTranslationDrag()   – wires a RichDragListener for whole-element
 *                                translation to any pickable Node
 *
 * All coordinate arguments are in MODEL space (metres, y-up).
 * The ModelViewTransform2 (modelViewTransform) is used to convert to view (pixel) space for
 * rendering and is passed as the `transform` option to RichDragListener so
 * that `listener.modelDelta` is already in model units.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, type Node, Path, RichDragListener } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import { HANDLE_LINE_WIDTH, HANDLE_RADIUS } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { Point } from "../model/optics/Geometry.js";
import {
  dot,
  normalize,
  perpendicularBisector,
  projectPointOntoLine,
  segment,
  subtract,
} from "../model/optics/Geometry.js";

// ── Handle appearance ─────────────────────────────────────────────────────────
const HANDLE_FILL = "rgba(255, 255, 255, 0.88)";
const HANDLE_STROKE = "#333";

// ── Line-body hit area ────────────────────────────────────────────────────────
// Half-width (px) of the invisible filled rectangle used as the drag target
// for line-segment elements.  10 px gives a comfortable ±10 px click zone.
const LINE_HIT_HALF_WIDTH_PX = 10;

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Creates a small control-point circle at the view position corresponding to
 * the given model point.
 */
export function createHandle(p: Point, modelViewTransform: ModelViewTransform2): Circle {
  return new Circle(HANDLE_RADIUS, {
    x: modelViewTransform.modelToViewX(p.x),
    y: modelViewTransform.modelToViewY(p.y),
    fill: HANDLE_FILL,
    stroke: HANDLE_STROKE,
    lineWidth: HANDLE_LINE_WIDTH,
    cursor: "pointer",
    tagName: "div", // exposes to PDOM so keyboard drag works
    focusable: true,
  });
}

/**
 * Attaches a RichDragListener to `handle` so that dragging (mouse or keyboard)
 * updates a single model Point via the supplied getter/setter, then calls
 * `rebuild` to refresh the view.
 *
 * Passing `transform: modelViewTransform` makes `listener.modelDelta` return deltas in model
 * units (metres) so the setter receives metres-based coordinates directly.
 */
export function attachEndpointDrag(
  handle: Circle,
  getPoint: () => Point,
  setPoint: (p: Point) => void,
  rebuild: () => void,
  modelViewTransform: ModelViewTransform2,
): void {
  handle.addInputListener(
    new RichDragListener({
      tandem: Tandem.OPT_OUT,
      transform: modelViewTransform,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta;
        const p = getPoint();
        setPoint({ x: p.x + dx, y: p.y + dy });
        handle.x = modelViewTransform.modelToViewX(getPoint().x);
        handle.y = modelViewTransform.modelToViewY(getPoint().y);
        rebuild();
      },
    }),
  );
}

/**
 * Creates a filled rectangular Shape centred on the line segment from
 * (vx1,vy1) to (vx2,vy2) in view (pixel) coordinates.  Because it is a
 * closed, filled polygon, Scenery's containsPoint() works correctly for
 * hit-testing — unlike an open stroke-only path whose fill interior is empty.
 *
 * Use this as the shape for a body-drag hit node so that clicking anywhere
 * within halfWidth pixels of the line triggers the drag.
 */
export function buildLineHitShape(
  vx1: number,
  vy1: number,
  vx2: number,
  vy2: number,
  halfWidth = LINE_HIT_HALF_WIDTH_PX,
): Shape {
  const dx = vx2 - vx1;
  const dy = vy2 - vy1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = (-dy / len) * halfWidth;
  const ny = (dx / len) * halfWidth;
  return new Shape()
    .moveTo(vx1 + nx, vy1 + ny)
    .lineTo(vx2 + nx, vy2 + ny)
    .lineTo(vx2 - nx, vy2 - ny)
    .lineTo(vx1 - nx, vy1 - ny)
    .close();
}

/**
 * Creates a Path node intended as an invisible body-drag hit target for
 * line-segment elements.  Set its shape each rebuild via buildLineHitShape(),
 * then pass it to attachTranslationDrag().
 *
 * All visual sibling paths that overlap this node must have pickable:false so
 * that Scenery's hit-test reaches this node rather than stopping at them.
 */
export function createLineBodyHitPath(): Path {
  return new Path(null, {
    // A very slightly non-zero alpha so the paint is non-null and Scenery
    // includes the fill area in hit-testing, yet the path is visually invisible.
    fill: "rgba(0,0,0,0.001)",
  });
}

/**
 * Projects a point onto the perpendicular bisector of the segment p1–p2.
 * Used to constrain the curvature handle to the mirror's vertex/apex.
 */
export function projectPointOntoPerpendicularBisector(p: Point, p1: Point, p2: Point): Point {
  const perp = perpendicularBisector(segment(p1, p2));
  return projectPointOntoLine(p, perp.p1, perp.p2);
}

/**
 * Attaches a RichDragListener to `handle` so that dragging updates the curvature
 * point (p3) but constrains it to the perpendicular bisector of p1–p2.
 * This keeps the handle at the mirror's vertex/apex (the curvature).
 */
export function attachCurvatureHandleDrag(
  handle: Circle,
  getP1: () => Point,
  getP2: () => Point,
  getP3: () => Point,
  setP3: (p: Point) => void,
  rebuild: () => void,
  modelViewTransform: ModelViewTransform2,
): void {
  handle.addInputListener(
    new RichDragListener({
      tandem: Tandem.OPT_OUT,
      transform: modelViewTransform,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta;
        const p3 = getP3();
        const proposed = { x: p3.x + dx, y: p3.y + dy };
        const p1 = getP1();
        const p2 = getP2();
        const constrained = projectPointOntoPerpendicularBisector(proposed, p1, p2);
        setP3(constrained);
        handle.x = modelViewTransform.modelToViewX(constrained.x);
        handle.y = modelViewTransform.modelToViewY(constrained.y);
        rebuild();
      },
    }),
  );
}

/**
 * Projects a point onto the plane through planeOrigin perpendicular to axisDir.
 */
function projectPointOntoPlane(p: Point, planeOrigin: Point, axisDir: Point): Point {
  const d = subtract(p, planeOrigin);
  const axis = normalize(axisDir);
  const alongAxis = dot(d, axis);
  return {
    x: p.x - alongAxis * axis.x,
    y: p.y - alongAxis * axis.y,
  };
}

/**
 * Attaches a RichDragListener for edge handles (p1, p2) that are displayed at the
 * vertex level. Constrains drag to the vertex plane (perpendicular to axis from p3 to chord).
 * Maps the drag back to update p1 or p2. whichEdge is 1 or 2 for the left/right handle.
 */
export function attachVertexPlaneEdgeDrag(
  handle: Circle,
  whichEdge: 1 | 2,
  getP1: () => Point,
  getP2: () => Point,
  getP3: () => Point,
  setP1: (p: Point) => void,
  setP2: (p: Point) => void,
  rebuild: () => void,
  modelViewTransform: ModelViewTransform2,
): void {
  handle.addInputListener(
    new RichDragListener({
      tandem: Tandem.OPT_OUT,
      transform: modelViewTransform,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta;
        const p1 = getP1();
        const p2 = getP2();
        const p3 = getP3();
        const chordMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const p = whichEdge === 1 ? p1 : p2;
        const displayPos = { x: p3.x + (p.x - chordMid.x), y: p3.y + (p.y - chordMid.y) };
        const proposed = { x: displayPos.x + dx, y: displayPos.y + dy };
        const axis = subtract(chordMid, p3);
        const len = Math.hypot(axis.x, axis.y);
        if (len < 1e-10) {
          return;
        }
        const projected = projectPointOntoPlane(proposed, p3, axis);
        const newP = { x: chordMid.x + (projected.x - p3.x), y: chordMid.y + (projected.y - p3.y) };
        if (whichEdge === 1) {
          setP1(newP);
        } else {
          setP2(newP);
        }
        rebuild();
      },
    }),
  );
}

/**
 * Attaches a RichDragListener to `bodyNode` for whole-element translation.
 * `points` is an array of getter/setter pairs covering every model Point that
 * should move together.
 *
 * Passing `transform: modelViewTransform` makes `listener.modelDelta` return deltas in model
 * units (metres).
 */
export function attachTranslationDrag(
  bodyNode: Node,
  points: ReadonlyArray<{ get: () => Point; set: (p: Point) => void }>,
  rebuild: () => void,
  modelViewTransform: ModelViewTransform2,
): RichDragListener {
  bodyNode.cursor = "grab";
  const richDragListener = new RichDragListener({
    tandem: Tandem.OPT_OUT,
    transform: modelViewTransform,
    drag: (_event, listener) => {
      const { x: dx, y: dy } = listener.modelDelta;
      for (const { get, set } of points) {
        const p = get();
        set({ x: p.x + dx, y: p.y + dy });
      }
      rebuild();
    },
  });
  bodyNode.addInputListener(richDragListener);
  return richDragListener;
}

opticsLab.register("ViewHelpers", {
  createHandle,
  buildLineHitShape,
  createLineBodyHitPath,
  attachEndpointDrag,
  attachCurvatureHandleDrag,
  attachTranslationDrag,
  attachVertexPlaneEdgeDrag,
  projectPointOntoPerpendicularBisector,
});
