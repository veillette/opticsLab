/**
 * TypedPrismView.ts
 *
 * View for typed prisms (EquilateralPrism, RightAnglePrism, PorroPrism,
 * SlabGlass, ParallelogramPrism, DovePrism).  Extends GlassView and adds:
 *
 *  - Scale handles at each vertex except one: dragging moves the vertex
 *    radially, scaling the entire prism uniformly about its centroid.
 *  - One rotation handle (with a curved-arrow indicator) at the last vertex:
 *    dragging rotates the entire prism about its centroid.
 *
 * Unlike the plain-Glass (polygon) view, no vertex add/remove buttons are
 * shown because typed prisms have a fixed number of vertices.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Path, RichDragListener } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  HANDLE_LINE_WIDTH,
  ROTATION_HANDLE_RADIUS,
  ROTATION_INDICATOR_ARROW_SIZE,
  ROTATION_INDICATOR_LINE_WIDTH,
  ROTATION_INDICATOR_RADIUS,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { Glass } from "../../model/glass/Glass.js";
import { createHandle } from "../ViewHelpers.js";
import { GlassView } from "./GlassView.js";

/** Minimum allowed distance from centroid to any vertex, in model metres. */
const MIN_VERTEX_DIST = 0.05;

export class TypedPrismView extends GlassView {
  private readonly scaleHandles: Circle[];
  private readonly rotationHandle: Circle;
  private readonly rotationIndicator: Path;

  public constructor(glass: Glass, modelViewTransform: ModelViewTransform2) {
    // Pass empty handleVerts so GlassView creates no default vertex handles.
    super(glass, modelViewTransform, []);

    const path = glass.path;
    const n = path.length;

    // ── Scale handles (all vertices except the last) ───────────────────────
    this.scaleHandles = [];
    for (let i = 0; i < n - 1; i++) {
      const vert = path[i];
      if (!vert) {
        continue;
      }
      const handle = createHandle({ x: vert.x, y: vert.y }, modelViewTransform);
      this.attachScaleDrag(handle, i);
      this.addChild(handle);
      this.scaleHandles.push(handle);
    }

    // ── Rotation handle (last vertex) ─────────────────────────────────────
    const lastVert = path[n - 1];
    const rotX = lastVert ? modelViewTransform.modelToViewX(lastVert.x) : 0;
    const rotY = lastVert ? modelViewTransform.modelToViewY(lastVert.y) : 0;

    this.rotationHandle = new Circle(ROTATION_HANDLE_RADIUS, {
      x: rotX,
      y: rotY,
      fill: OpticsLabColors.rotationHandleFillProperty,
      stroke: OpticsLabColors.rotationHandleStrokeProperty,
      lineWidth: HANDLE_LINE_WIDTH,
      cursor: "grab",
      tagName: "div",
      focusable: true,
    });
    this.addChild(this.rotationHandle);

    this.rotationIndicator = new Path(null, {
      stroke: OpticsLabColors.rotationIndicatorStrokeProperty,
      lineWidth: ROTATION_INDICATOR_LINE_WIDTH,
      pickable: false,
    });
    this.addChild(this.rotationIndicator);

    this.attachRotationDrag();

    // Initial draw
    this.rebuild();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Geometry helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /** Centroid of all vertices in model space. */
  private getCentroid(): { x: number; y: number } {
    const path = this.glass.path;
    const n = path.length;
    let sx = 0;
    let sy = 0;
    for (const p of path) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / n, y: sy / n };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drag wiring
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Scale drag: dragging the handle at vertexIndex moves that vertex radially,
   * and ALL other vertices are scaled by the same ratio so the prism shape is
   * preserved.
   */
  private attachScaleDrag(handle: Circle, vertexIndex: number): void {
    handle.addInputListener(
      new RichDragListener({
        tandem: Tandem.OPT_OUT,
        transform: this.modelViewTransform,
        drag: (_event, listener) => {
          const { x: dx, y: dy } = listener.modelDelta;
          const c = this.getCentroid();
          const path = this.glass.path;
          const v = path[vertexIndex];
          if (!v) {
            return;
          }

          const oldRelX = v.x - c.x;
          const oldRelY = v.y - c.y;
          const oldDist = Math.hypot(oldRelX, oldRelY);
          if (oldDist < 1e-10) {
            return;
          }

          // Project the drag delta onto the radial direction to get pure scaling.
          const radUx = oldRelX / oldDist;
          const radUy = oldRelY / oldDist;
          const proj = dx * radUx + dy * radUy;

          const newDist = Math.max(MIN_VERTEX_DIST, oldDist + proj);
          const scale = newDist / oldDist;

          // Scale all vertices about the centroid.
          for (const p of path) {
            p.x = c.x + (p.x - c.x) * scale;
            p.y = c.y + (p.y - c.y) * scale;
          }

          this.rebuild();
        },
      }),
    );
  }

  /**
   * Rotation drag: dragging the last-vertex handle rotates the entire prism
   * about its centroid.
   */
  private attachRotationDrag(): void {
    this.rotationHandle.addInputListener(
      new RichDragListener({
        tandem: Tandem.OPT_OUT,
        transform: this.modelViewTransform,
        drag: (_event, listener) => {
          const { x: dx, y: dy } = listener.modelDelta;
          if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) {
            return;
          }

          const c = this.getCentroid();

          // Current handle position in model space.
          const hx = this.modelViewTransform.viewToModelX(this.rotationHandle.x);
          const hy = this.modelViewTransform.viewToModelY(this.rotationHandle.y);

          // Angular change from handle position + drag.
          const prevA = Math.atan2(hy - c.y, hx - c.x);
          const nextA = Math.atan2(hy + dy - c.y, hx + dx - c.x);
          const deltaAngle = nextA - prevA;

          const cos = Math.cos(deltaAngle);
          const sin = Math.sin(deltaAngle);

          for (const p of this.glass.path) {
            const relX = p.x - c.x;
            const relY = p.y - c.y;
            p.x = c.x + relX * cos - relY * sin;
            p.y = c.y + relX * sin + relY * cos;
          }

          this.rebuild();
        },
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Rebuild (draw + reposition handles)
  // ═══════════════════════════════════════════════════════════════════════════

  public override rebuild(): void {
    // Draw the glass shape via the parent.
    super.rebuild();

    const path = this.glass.path;
    const n = path.length;

    // Reposition scale handles.
    for (let i = 0; i < this.scaleHandles.length; i++) {
      const v = path[i];
      const h = this.scaleHandles[i];
      if (v && h) {
        h.x = this.modelViewTransform.modelToViewX(v.x);
        h.y = this.modelViewTransform.modelToViewY(v.y);
      }
    }

    // Reposition rotation handle + indicator (last vertex).
    const lastV = path[n - 1];
    if (lastV) {
      const rx = this.modelViewTransform.modelToViewX(lastV.x);
      const ry = this.modelViewTransform.modelToViewY(lastV.y);
      this.rotationHandle.x = rx;
      this.rotationHandle.y = ry;
      this.drawRotationIndicator(rx, ry);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Rotation indicator (curved arrow)
  // ═══════════════════════════════════════════════════════════════════════════

  private drawRotationIndicator(cx: number, cy: number): void {
    const r = ROTATION_INDICATOR_RADIUS;
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;
    const a = ROTATION_INDICATOR_ARROW_SIZE;

    const shape = new Shape();
    shape.arc(cx, cy, r, startAngle, endAngle, false);

    // Arrowhead at the arc end.
    const ex = cx + r * Math.cos(endAngle);
    const ey = cy + r * Math.sin(endAngle);
    const tangent = endAngle + Math.PI / 2;
    shape.moveTo(ex, ey);
    shape.lineTo(ex + a * Math.cos(tangent + 0.5), ey + a * Math.sin(tangent + 0.5));
    shape.moveTo(ex, ey);
    shape.lineTo(ex + a * Math.cos(tangent - 0.5), ey + a * Math.sin(tangent - 0.5));

    this.rotationIndicator.shape = shape;
  }
}

opticsLab.register("TypedPrismView", TypedPrismView);
