/**
 * ViewHelpers.ts
 *
 * Shared utilities for building interactive optical-element views:
 *  - createHandle()            – a styled draggable control-point circle
 *  - makeEndpointHandle()      – createHandle + attachEndpointDrag in one call
 *  - attachEndpointDrag()      – wires a RichDragListener to a single handle
 *  - attachTranslationDrag()   – wires a RichDragListener for whole-element
 *                                translation to any pickable Node
 *  - buildPolylineViewShape()  – converts model-space Point[] to a view-space polyline Shape
 *  - buildDiamondShape()       – builds a diamond (rhombus) Shape in view (pixel) space
 *
 * All coordinate arguments are in MODEL space (metres, y-up).
 * The ModelViewTransform2 (modelViewTransform) is used to convert to view (pixel) space for
 * rendering and is passed as the `transform` option to RichDragListener so
 * that `listener.modelDelta` is already in model units.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, type Node, Path, RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  GRID_SNAP_THRESHOLD_FRACTION,
  HANDLE_LINE_WIDTH,
  HANDLE_RADIUS,
  LINE_HIT_HALF_WIDTH_PX,
  TRACK_BREAK_DISTANCE_M,
  TRACK_SNAP_DISTANCE_M,
} from "../../OpticsLabConstants.js";
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
import { trackRegistry } from "./TrackRegistry.js";
import { viewSnapState } from "./ViewSnapState.js";

/**
 * Projects a point onto a line segment (clamped to segment bounds) and
 * returns the projected point and the perpendicular distance.
 */
function projectOntoSegmentClamped(p: Point, segP1: Point, segP2: Point): { projected: Point; perpDist: number } {
  const dx = segP2.x - segP1.x;
  const dy = segP2.y - segP1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-20) {
    const d = Math.hypot(p.x - segP1.x, p.y - segP1.y);
    return { projected: { x: segP1.x, y: segP1.y }, perpDist: d };
  }
  const t = Math.max(0, Math.min(1, ((p.x - segP1.x) * dx + (p.y - segP1.y) * dy) / lenSq));
  const proj = { x: segP1.x + t * dx, y: segP1.y + t * dy };
  const perpDist = Math.hypot(p.x - proj.x, p.y - proj.y);
  return { projected: proj, perpDist };
}

/** Snaps a single model coordinate to the nearest grid line if close enough. */
function snapCoord(v: number): number {
  const spacing = viewSnapState.gridSpacingM;
  const nearest = Math.round(v / spacing) * spacing;
  return Math.abs(v - nearest) <= spacing * GRID_SNAP_THRESHOLD_FRACTION ? nearest : v;
}

/** Returns the point snapped to the grid, or the original point when snap is off. */
function snapPoint(p: Point): Point {
  if (!viewSnapState.snapEnabled) {
    return p;
  }
  return { x: snapCoord(p.x), y: snapCoord(p.y) };
}

// ── Handle appearance ─────────────────────────────────────────────────────────

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * A draggable control-point handle: a Circle extended with syncToModel(),
 * which snaps the node's view position back to the current model point.
 * Returned by makeEndpointHandle().
 */
export type DragHandle = Circle & { syncToModel(): void };

/**
 * Creates a small control-point circle at the view position corresponding to
 * the given model point.
 */
export function createHandle(p: Point, modelViewTransform: ModelViewTransform2): Circle {
  return new Circle(HANDLE_RADIUS, {
    x: modelViewTransform.modelToViewX(p.x),
    y: modelViewTransform.modelToViewY(p.y),
    fill: OpticsLabColors.handleFillProperty,
    stroke: OpticsLabColors.handleStrokeProperty,
    lineWidth: HANDLE_LINE_WIDTH,
    cursor: "pointer",
    tagName: "div", // exposes to PDOM so keyboard drag works
    focusable: true,
  });
}

/**
 * Creates a DragHandle at getPoint()'s view position, wires endpoint drag to
 * it, and attaches syncToModel() so rebuild() can reposition the node in one
 * call instead of four lines.
 *
 * This is the preferred way to create a standard endpoint handle. Use the
 * lower-level createHandle() + attachEndpointDrag() only when the drag
 * interaction is non-standard (e.g. curvature-constrained or circle-rim drag).
 */
export function makeEndpointHandle(
  getPoint: () => Point,
  setPoint: (p: Point) => void,
  rebuild: () => void,
  modelViewTransform: ModelViewTransform2,
  tandem: Tandem,
): DragHandle {
  const handle = createHandle(getPoint(), modelViewTransform);
  attachEndpointDrag(handle, getPoint, setPoint, rebuild, modelViewTransform, tandem);
  return Object.assign(handle, {
    syncToModel(): void {
      const p = getPoint();
      handle.x = modelViewTransform.modelToViewX(p.x);
      handle.y = modelViewTransform.modelToViewY(p.y);
    },
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
  tandem: Tandem,
): void {
  handle.addInputListener(
    new RichDragListener({
      tandem: tandem,
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
  tandem: Tandem,
): void {
  handle.addInputListener(
    new RichDragListener({
      tandem: tandem,
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
  tandem: Tandem,
): void {
  handle.addInputListener(
    new RichDragListener({
      tandem: tandem,
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
  tandem: Tandem,
): RichDragListener {
  bodyNode.cursor = "grab";

  // Positions captured at the start of each press — used for snap calculations.
  let startPositions: Point[] = [];
  // Total accumulated drag displacement in model metres since press start.
  let accX = 0;
  let accY = 0;

  // Track-snap state: ID of the track we are currently snapped to, or null.
  let snappedTrackId: string | null = null;

  const richDragListener = new RichDragListener({
    tandem: tandem,
    transform: modelViewTransform,
    start: () => {
      startPositions = points.map(({ get }) => ({ ...get() }));
      accX = 0;
      accY = 0;
      snappedTrackId = null;
    },
    drag: (_event, listener) => {
      const { x: dx, y: dy } = listener.modelDelta;
      accX += dx;
      accY += dy;

      // Snap the reference point's absolute position (start + total displacement)
      // so the snap threshold is evaluated against the grid, not against the
      // previous frame.  This lets elements freely cross grid lines.
      const refStart = startPositions[0] ?? { x: 0, y: 0 };
      const tentative = { x: refStart.x + accX, y: refStart.y + accY };
      const snapped = snapPoint(tentative);
      let snapOffsetX = snapped.x - tentative.x;
      let snapOffsetY = snapped.y - tentative.y;

      // ── Track snap ──────────────────────────────────────────────────────
      // Compute center of element as average of all point positions (tentative).
      const n = points.length;
      if (n > 0) {
        let cx = 0;
        let cy = 0;
        for (let i = 0; i < n; i++) {
          const sp = startPositions[i] ?? { x: 0, y: 0 };
          cx += sp.x + accX;
          cy += sp.y + accY;
        }
        cx /= n;
        cy /= n;

        const tracks = trackRegistry.getAllTracks();
        let bestTrack: (typeof tracks)[number] | null = null;
        let bestDist = Number.POSITIVE_INFINITY;
        let bestProj: Point = { x: cx, y: cy };

        for (const track of tracks) {
          const { projected, perpDist } = projectOntoSegmentClamped({ x: cx, y: cy }, track.p1, track.p2);
          if (perpDist < bestDist) {
            bestDist = perpDist;
            bestTrack = track;
            bestProj = projected;
          }
        }

        const threshold = snappedTrackId !== null ? TRACK_BREAK_DISTANCE_M : TRACK_SNAP_DISTANCE_M;

        if (bestTrack && bestDist < threshold) {
          // Snap center onto the track — this overrides the grid snap offset.
          snapOffsetX = bestProj.x - cx;
          snapOffsetY = bestProj.y - cy;
          snappedTrackId = bestTrack.id;
        } else {
          snappedTrackId = null;
        }
      }

      for (let i = 0; i < points.length; i++) {
        const startP = startPositions[i] ?? { x: 0, y: 0 };
        points[i]?.set({
          x: startP.x + accX + snapOffsetX,
          y: startP.y + accY + snapOffsetY,
        });
      }
      rebuild();
    },
  });
  bodyNode.addInputListener(richDragListener);
  return richDragListener;
}

/**
 * Converts an array of model-space points to a view-space polyline Shape by
 * mapping each point through modelViewTransform. Returns an empty Shape for
 * an empty array.
 *
 * Used by curved-mirror views (ArcMirrorView, ParabolicMirrorView) to render
 * their sampled polyline approximations.
 */
export function buildPolylineViewShape(modelSpacePoints: Point[], modelViewTransform: ModelViewTransform2): Shape {
  const shape = new Shape();
  const first = modelSpacePoints[0];
  if (!first) {
    return shape;
  }
  shape.moveTo(modelViewTransform.modelToViewX(first.x), modelViewTransform.modelToViewY(first.y));
  for (let i = 1; i < modelSpacePoints.length; i++) {
    const p = modelSpacePoints[i];
    if (p) {
      shape.lineTo(modelViewTransform.modelToViewX(p.x), modelViewTransform.modelToViewY(p.y));
    }
  }
  return shape;
}

/**
 * Builds a diamond (axis-aligned rhombus) Shape centred at (cx, cy) with
 * half-diagonal `size` pixels.  Used for focal-point markers in mirror and
 * lens views.
 */
export function buildDiamondShape(cx: number, cy: number, size: number): Shape {
  return new Shape()
    .moveTo(cx - size, cy)
    .lineTo(cx, cy - size)
    .lineTo(cx + size, cy)
    .lineTo(cx, cy + size)
    .close();
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
  buildPolylineViewShape,
  buildDiamondShape,
});
