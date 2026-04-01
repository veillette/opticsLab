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
  DOVE_MIN_TOP_FACE_M,
  HANDLE_LINE_WIDTH,
  PRISM_DEGENERATE_DIST,
  PRISM_MIN_VERTEX_DIST_M,
  ROTATION_DRAG_DELTA_MIN,
  ROTATION_HANDLE_RADIUS,
  ROTATION_INDICATOR_ARROW_SIZE,
  ROTATION_INDICATOR_ARROW_SPREAD,
  ROTATION_INDICATOR_END_ANGLE,
  ROTATION_INDICATOR_LINE_WIDTH,
  ROTATION_INDICATOR_RADIUS,
  ROTATION_INDICATOR_START_ANGLE,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { Glass } from "../../model/glass/Glass.js";
import { handlesVisibleProperty } from "../HandlesVisibleProperty.js";
import { createHandle } from "../ViewHelpers.js";
import { GlassView } from "./GlassView.js";

/**
 * Duck-type interface for prisms that support independent width/height resizing.
 * Implemented by DovePrism, SlabGlass, and ParallelogramPrism.
 */
interface WidthHeightGlass {
  width: number;
  height: number;
  rotation: number;
  setWidth(w: number): void;
  setHeight(h: number): void;
}

function hasWidthHeight(g: { type: string }): g is { type: string } & WidthHeightGlass {
  return "setWidth" in g && typeof g.setWidth === "function";
}

export class TypedPrismView extends GlassView {
  private readonly scaleHandles: Circle[];
  private readonly rotationHandle: Circle;
  private readonly rotationIndicator: Path;

  public constructor(glass: Glass, modelViewTransform: ModelViewTransform2, tandem: Tandem = Tandem.OPT_OUT) {
    // Pass empty handleVerts so GlassView creates no default vertex handles.
    super(glass, modelViewTransform, tandem, []);

    const path = glass.path;
    const n = path.length;

    // ── Scale / resize handles (all vertices except the last) ─────────────
    this.scaleHandles = [];
    const wh = hasWidthHeight(glass) ? glass : null;
    const isDove = glass.type === "DovePrism";

    for (let i = 0; i < n - 1; i++) {
      const vert = path[i];
      if (!vert) {
        continue;
      }
      const handle = createHandle({ x: vert.x, y: vert.y }, modelViewTransform);
      if (wh !== null) {
        this.attachWidthHeightDrag(handle, i, wh, isDove);
      } else {
        this.attachScaleDrag(handle, i);
      }
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

    this.trackLinkAttribute(handlesVisibleProperty, this.rotationHandle, "visible");
    this.trackLinkAttribute(handlesVisibleProperty, this.rotationIndicator, "visible");

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
    const drag = new RichDragListener({
      tandem: this.glassTandem.createTandem(`scaleDragListener${vertexIndex}`),
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
        if (oldDist < PRISM_DEGENERATE_DIST) {
          return;
        }

        // Project the drag delta onto the radial direction to get pure scaling.
        const radUx = oldRelX / oldDist;
        const radUy = oldRelY / oldDist;
        const proj = dx * radUx + dy * radUy;

        const newDist = Math.max(PRISM_MIN_VERTEX_DIST_M, oldDist + proj);
        const scale = newDist / oldDist;

        // Scale all vertices about the centroid.
        for (const p of path) {
          p.x = c.x + (p.x - c.x) * scale;
          p.y = c.y + (p.y - c.y) * scale;
        }

        this.rebuild();
      },
    });
    handle.addInputListener(drag);
    handle.disposeEmitter.addListener(() => drag.dispose());
  }

  /**
   * Width/height drag for prisms that support independent width and height
   * (DovePrism, SlabGlass, ParallelogramPrism).
   *
   * The drag delta is projected onto the prism's local width axis (first edge,
   * v0→v1) and its perpendicular height axis.  Each vertex is on a specific
   * "side" of the centroid along each axis; that sign determines whether moving
   * the handle outward increases or decreases the dimension.  The factor of 2
   * accounts for the symmetric (centroid-preserving) resize so the handle
   * tracks the cursor exactly.
   *
   * For DovePrism an additional constraint enforces that the 45° entry/exit
   * faces keep a minimum positive width (width − height ≥ DOVE_MIN_TOP_FACE).
   */
  private attachWidthHeightDrag(handle: Circle, vertexIndex: number, wh: WidthHeightGlass, isDove: boolean): void {
    const drag = new RichDragListener({
      tandem: this.glassTandem.createTandem(`widthHeightDragListener${vertexIndex}`),
      transform: this.modelViewTransform,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta;
        const path = this.glass.path;
        const c = this.getCentroid();

        // Local width axis from the first edge (v0 → v1).
        const v0 = path[0];
        const v1 = path[1];
        if (!(v0 && v1)) {
          return;
        }
        const edgeDx = v1.x - v0.x;
        const edgeDy = v1.y - v0.y;
        const edgeLen = Math.hypot(edgeDx, edgeDy) || 1;
        const wux = edgeDx / edgeLen;
        const wuy = edgeDy / edgeLen;
        // Height axis: 90° CCW from width axis (y-up model space).
        const hux = -wuy;
        const huy = wux;

        // Determine which "side" this vertex lies on along each local axis.
        const vi = path[vertexIndex];
        if (!vi) {
          return;
        }
        const relX = vi.x - c.x;
        const relY = vi.y - c.y;
        const localX = relX * wux + relY * wuy;
        const localY = relX * hux + relY * huy;
        const wSign = localX >= 0 ? 1 : -1;
        const hSign = localY >= 0 ? 1 : -1;

        // Project drag onto local axes; ×2 because the resize is symmetric
        // about the centroid (both sides move, so the vertex travel is half
        // of the total dimensional change).
        const projW = dx * wux + dy * wuy;
        const projH = dx * hux + dy * huy;
        let newWidth = wh.width + 2 * projW * wSign;
        let newHeight = wh.height + 2 * projH * hSign;

        // Basic positivity clamp.
        newWidth = Math.max(PRISM_MIN_VERTEX_DIST_M * 2, newWidth);
        newHeight = Math.max(PRISM_MIN_VERTEX_DIST_M, newHeight);

        if (isDove) {
          // Dove prism: the top face width = width − height must stay ≥ minimum.
          // Clamp height first (it can only grow up to width − min), then
          // ensure width is wide enough to accommodate the clamped height.
          newHeight = Math.min(newHeight, newWidth - DOVE_MIN_TOP_FACE_M);
          newHeight = Math.max(newHeight, PRISM_MIN_VERTEX_DIST_M);
          newWidth = Math.max(newWidth, newHeight + DOVE_MIN_TOP_FACE_M);
        }

        wh.setWidth(newWidth);
        wh.setHeight(newHeight);
        this.rebuild();
      },
    });
    handle.addInputListener(drag);
    handle.disposeEmitter.addListener(() => drag.dispose());
  }

  /**
   * Rotation drag: dragging the last-vertex handle rotates the entire prism
   * about its centroid.
   */
  private attachRotationDrag(): void {
    const drag = new RichDragListener({
      tandem: this.glassTandem.createTandem("rotationDragListener"),
      transform: this.modelViewTransform,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta;
        if (Math.abs(dx) < ROTATION_DRAG_DELTA_MIN && Math.abs(dy) < ROTATION_DRAG_DELTA_MIN) {
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

        if (hasWidthHeight(this.glass)) {
          this.glass.rotation += deltaAngle;
        }

        this.rebuild();
      },
    });
    this.rotationHandle.addInputListener(drag);
    this.rotationHandle.disposeEmitter.addListener(() => drag.dispose());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Rebuild (draw + reposition handles)
  // ═══════════════════════════════════════════════════════════════════════════

  public override rebuild(): void {
    // Draw the glass shape via the parent.
    super.rebuild();

    // Guard: GlassView's constructor calls rebuild() before this subclass
    // finishes initializing its fields. Skip until construction is complete.
    if (!this.scaleHandles) {
      return;
    }

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
    const startAngle = ROTATION_INDICATOR_START_ANGLE;
    const endAngle = ROTATION_INDICATOR_END_ANGLE;
    const a = ROTATION_INDICATOR_ARROW_SIZE;

    const shape = new Shape();
    shape.arc(cx, cy, r, startAngle, endAngle, false);

    // Arrowhead at the arc end.
    const ex = cx + r * Math.cos(endAngle);
    const ey = cy + r * Math.sin(endAngle);
    const tangent = endAngle + Math.PI / 2;
    shape.moveTo(ex, ey);
    shape.lineTo(
      ex + a * Math.cos(tangent + ROTATION_INDICATOR_ARROW_SPREAD),
      ey + a * Math.sin(tangent + ROTATION_INDICATOR_ARROW_SPREAD),
    );
    shape.moveTo(ex, ey);
    shape.lineTo(
      ex + a * Math.cos(tangent - ROTATION_INDICATOR_ARROW_SPREAD),
      ey + a * Math.sin(tangent - ROTATION_INDICATOR_ARROW_SPREAD),
    );

    this.rotationIndicator.shape = shape;
  }
}

opticsLab.register("TypedPrismView", TypedPrismView);
