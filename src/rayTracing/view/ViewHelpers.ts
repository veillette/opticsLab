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

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, type Node, RichDragListener } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import { HANDLE_LINE_WIDTH, HANDLE_RADIUS } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { Point } from "../model/optics/Geometry.js";
import { perpendicularBisector, projectPointOntoLine, segment } from "../model/optics/Geometry.js";

// ── Handle appearance ─────────────────────────────────────────────────────────
const HANDLE_FILL = "rgba(255, 255, 255, 0.88)";
const HANDLE_STROKE = "#333";

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
  attachEndpointDrag,
  attachCurvatureHandleDrag,
  attachTranslationDrag,
  projectPointOntoPerpendicularBisector,
});
