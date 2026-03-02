/**
 * ViewHelpers.ts
 *
 * Shared utilities for building interactive optical-element views:
 *  - createHandle()            – a styled draggable control-point circle
 *  - attachEndpointDrag()      – wires a RichDragListener to a single handle
 *  - attachTranslationDrag()   – wires a RichDragListener for whole-element
 *                                translation to any pickable Node
 */

import { Circle, type Node, RichDragListener } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import opticsLab from "../../OpticsLabNamespace.js";
import type { Point } from "../model/optics/Geometry.js";

// ── Handle appearance ─────────────────────────────────────────────────────────
export const HANDLE_RADIUS = 6;
const HANDLE_FILL = "rgba(255, 255, 255, 0.88)";
const HANDLE_STROKE = "#333";
const HANDLE_LINE_WIDTH = 1.5;

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Creates a small control-point circle with drag-ready appearance.
 * Position the returned node by setting `.x` / `.y` to model coordinates.
 */
export function createHandle(p: Point): Circle {
  return new Circle(HANDLE_RADIUS, {
    x: p.x,
    y: p.y,
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
 */
export function attachEndpointDrag(
  handle: Circle,
  getPoint: () => Point,
  setPoint: (p: Point) => void,
  rebuild: () => void,
): void {
  handle.addInputListener(
    new RichDragListener({
      tandem: Tandem.OPT_OUT,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta;
        const p = getPoint();
        setPoint({ x: p.x + dx, y: p.y + dy });
        handle.x = getPoint().x;
        handle.y = getPoint().y;
        rebuild();
      },
    }),
  );
}

/**
 * Attaches a RichDragListener to `bodyNode` for whole-element translation.
 * `points` is an array of getter/setter pairs covering every model Point that
 * should move together.
 */
export function attachTranslationDrag(
  bodyNode: Node,
  points: ReadonlyArray<{ get: () => Point; set: (p: Point) => void }>,
  rebuild: () => void,
): RichDragListener {
  bodyNode.cursor = "grab";
  const richDragListener = new RichDragListener({
    tandem: Tandem.OPT_OUT,
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
  attachTranslationDrag,
});
