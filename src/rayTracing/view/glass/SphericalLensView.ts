/**
 * SphericalLensView.ts
 *
 * Scenery node for a spherical lens. Extends GlassView to render the
 * lens path (line segments + circular arcs), and adds:
 *  - Focal-point markers (front and back) shown as small magenta squares.
 *  - 3 "width" drag handles (corners 0, 1, 3) that change the lens
 *    thickness `d` while keeping the two aperture edges parallel.
 *  - 1 rotation handle (corner 2 = path[4], bottom-left) with a curved-
 *    arrow indicator, allowing rotation of the lens about its centre.
 *
 * Handle vertices are the 4 non-arc path points (indices 0, 1, 3, 4).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Path, RichDragListener } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import {
  HANDLE_LINE_WIDTH,
  ROTATION_HANDLE_RADIUS,
  ROTATION_INDICATOR_ARROW_SIZE,
  ROTATION_INDICATOR_LINE_WIDTH,
  ROTATION_INDICATOR_RADIUS,
  SPHERICAL_FOCAL_MARKER_SIZE_M,
  SPHERICAL_MIN_THICKNESS_M,
  SPHERICAL_MIN_VERTEX_COUNT,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { GlassPathPoint } from "../../model/glass/Glass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import { createHandle } from "../ViewHelpers.js";
import { GlassView } from "./GlassView.js";

const FOCAL_FILL = "rgb(255,0,255)";
const ROTATION_HANDLE_FILL = "rgba(255, 200, 50, 0.9)";
const ROTATION_HANDLE_STROKE = "#996600";
const ROTATION_INDICATOR_STROKE = "rgba(150, 120, 0, 0.7)";

/**
 * Indices into the 4-element corners array (mapped from path indices 0,1,3,4).
 */
const CORNER_TOP_LEFT = 0; // path[0]
const CORNER_TOP_RIGHT = 1; // path[1]
const CORNER_BOTTOM_RIGHT = 2; // path[3]
const CORNER_BOTTOM_LEFT = 3; // path[4]

/** Which corner carries the rotation handle (the rest are width handles). */
const ROTATION_CORNER = CORNER_BOTTOM_LEFT;

export class SphericalLensView extends GlassView {
  private readonly focalFront: Path;
  private readonly focalBack: Path;

  /** 3 standard handles for changing lens thickness. */
  private readonly widthHandles: Circle[];
  /** The corner indices (into getCorners()) of the width handles. */
  private readonly widthCornerIndices: number[];

  /** Special rotation handle with visual indicator. */
  private readonly rotationHandle: Circle;
  private readonly rotationIndicator: Path;

  public constructor(
    private readonly lens: SphericalLens,
    modelViewTransform: ModelViewTransform2,
  ) {
    // Pass empty handleVerts → GlassView creates no default handles.
    super(lens, modelViewTransform, []);

    // ── Focal-point markers ────────────────────────────────────────────────
    this.focalFront = new Path(null, { fill: FOCAL_FILL });
    this.focalBack = new Path(null, { fill: FOCAL_FILL });
    this.addChild(this.focalFront);
    this.addChild(this.focalBack);

    // ── Corners ────────────────────────────────────────────────────────────
    const corners = this.getCorners();

    // ── Width handles (all corners except the rotation corner) ─────────────
    this.widthCornerIndices = [CORNER_TOP_LEFT, CORNER_TOP_RIGHT, CORNER_BOTTOM_RIGHT, CORNER_BOTTOM_LEFT].filter(
      (i) => i !== ROTATION_CORNER,
    );
    this.widthHandles = this.widthCornerIndices.map((ci) => {
      const pos = corners[ci] ?? { x: 0, y: 0 };
      const handle = createHandle(pos, modelViewTransform);
      this.addChild(handle);
      // Right-side corners → sign +1, left-side corners → sign −1
      const sign = ci === CORNER_TOP_RIGHT || ci === CORNER_BOTTOM_RIGHT ? 1 : -1;
      this.attachWidthDrag(handle, sign);
      return handle;
    });

    // ── Rotation handle ────────────────────────────────────────────────────
    const rotPos = corners[ROTATION_CORNER] ?? { x: 0, y: 0 };
    this.rotationHandle = new Circle(ROTATION_HANDLE_RADIUS, {
      x: modelViewTransform.modelToViewX(rotPos.x),
      y: modelViewTransform.modelToViewY(rotPos.y),
      fill: ROTATION_HANDLE_FILL,
      stroke: ROTATION_HANDLE_STROKE,
      lineWidth: HANDLE_LINE_WIDTH,
      cursor: "grab",
      tagName: "div",
      focusable: true,
    });
    this.addChild(this.rotationHandle);

    this.rotationIndicator = new Path(null, {
      stroke: ROTATION_INDICATOR_STROKE,
      lineWidth: ROTATION_INDICATOR_LINE_WIDTH,
    });
    this.addChild(this.rotationIndicator);
    this.attachRotationDrag();

    // Initial draw
    this.rebuild();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Geometry helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /** Return the 4 non-arc corners in order: TL, TR, BR, BL. */
  private getCorners(): { x: number; y: number }[] {
    const p = this.lens.path;
    if (p.length < SPHERICAL_MIN_VERTEX_COUNT) {
      return [];
    }
    return [
      { x: (p[0] as GlassPathPoint).x, y: (p[0] as GlassPathPoint).y },
      { x: (p[1] as GlassPathPoint).x, y: (p[1] as GlassPathPoint).y },
      { x: (p[3] as GlassPathPoint).x, y: (p[3] as GlassPathPoint).y },
      { x: (p[4] as GlassPathPoint).x, y: (p[4] as GlassPathPoint).y },
    ];
  }

  /** Perpendicular unit vector (model space) from surface-1 side → surface-2 side. */
  private getPerpendicular(): { dpx: number; dpy: number; len: number } {
    const p1 = this.lens.p1;
    const p2 = this.lens.p2;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (len < 1e-10) {
      return { dpx: 0, dpy: 0, len: 0 };
    }
    return {
      dpx: (p2.y - p1.y) / len,
      dpy: -(p2.x - p1.x) / len,
      len,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drag wiring
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Attach a width-change drag to a handle. `sign` is +1 for right-side
   * corners and −1 for left-side corners. Dragging perpendicular to the
   * aperture axis changes the thickness `d` while keeping edges parallel.
   */
  private attachWidthDrag(handle: Circle, sign: number): void {
    handle.addInputListener(
      new RichDragListener({
        tandem: Tandem.OPT_OUT,
        transform: this.modelViewTransform,
        drag: (_event, listener) => {
          const { x: dx, y: dy } = listener.modelDelta;
          const { dpx, dpy, len } = this.getPerpendicular();
          if (len < 1e-10) {
            return;
          }

          // Project drag delta onto perpendicular direction
          const proj = dx * dpx + dy * dpy;
          const { d, r1, r2 } = this.lens.getDR1R2();
          const newD = Math.max(SPHERICAL_MIN_THICKNESS_M, d + proj * sign * 2);
          this.lens.createLensWithDR1R2(newD, r1, r2);
          this.rebuild();
        },
      }),
    );
  }

  /** Attach rotation drag to the rotation handle. */
  private attachRotationDrag(): void {
    let prevAngle = 0;

    this.rotationHandle.addInputListener(
      new RichDragListener({
        tandem: Tandem.OPT_OUT,
        transform: this.modelViewTransform,
        start: (event) => {
          const viewPt = event.pointer.point;
          const mx = this.modelViewTransform.viewToModelX(viewPt.x);
          const my = this.modelViewTransform.viewToModelY(viewPt.y);
          const cx = (this.lens.p1.x + this.lens.p2.x) * 0.5;
          const cy = (this.lens.p1.y + this.lens.p2.y) * 0.5;
          prevAngle = Math.atan2(my - cy, mx - cx);
        },
        drag: (event) => {
          const viewPt = event.pointer.point;
          const mx = this.modelViewTransform.viewToModelX(viewPt.x);
          const my = this.modelViewTransform.viewToModelY(viewPt.y);
          const cx = (this.lens.p1.x + this.lens.p2.x) * 0.5;
          const cy = (this.lens.p1.y + this.lens.p2.y) * 0.5;
          const currAngle = Math.atan2(my - cy, mx - cx);
          const deltaAngle = currAngle - prevAngle;

          this.lens.rotate(deltaAngle);
          const { d, r1, r2 } = this.lens.getDR1R2();
          this.lens.createLensWithDR1R2(d, r1, r2);
          this.rebuild();

          prevAngle = currAngle;
        },
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Rebuild (draw)
  // ═══════════════════════════════════════════════════════════════════════════

  protected override rebuild(): void {
    // Sync p1/p2 from path so that body-drag (which moves path[] directly)
    // keeps the aperture endpoints in sync.
    if (this.lens && this.lens.path.length >= SPHERICAL_MIN_VERTEX_COUNT) {
      const v0 = this.lens.path[0] as GlassPathPoint;
      const v1 = this.lens.path[1] as GlassPathPoint;
      const v3 = this.lens.path[3] as GlassPathPoint;
      const v4 = this.lens.path[4] as GlassPathPoint;
      this.lens.p1 = { x: (v0.x + v1.x) * 0.5, y: (v0.y + v1.y) * 0.5 };
      this.lens.p2 = { x: (v3.x + v4.x) * 0.5, y: (v3.y + v4.y) * 0.5 };
    }

    // Parent draws the glass shape and repositions any default handles (none).
    super.rebuild();

    if (!this.lens || this.lens.path.length < SPHERICAL_MIN_VERTEX_COUNT) {
      return;
    }

    // ── Focal points ─────────────────────────────────────────────────────
    this.updateFocalPoints();

    // ── Reposition width handles ─────────────────────────────────────────
    const corners = this.getCorners();
    for (let i = 0; i < this.widthHandles.length; i++) {
      const ci = this.widthCornerIndices[i]!;
      const c = corners[ci];
      const h = this.widthHandles[i];
      if (c && h) {
        h.x = this.modelViewTransform.modelToViewX(c.x);
        h.y = this.modelViewTransform.modelToViewY(c.y);
      }
    }

    // ── Reposition rotation handle + indicator ───────────────────────────
    const rc = corners[ROTATION_CORNER];
    if (rc) {
      const rx = this.modelViewTransform.modelToViewX(rc.x);
      const ry = this.modelViewTransform.modelToViewY(rc.y);
      this.rotationHandle.x = rx;
      this.rotationHandle.y = ry;
      this.drawRotationIndicator(rx, ry);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Focal-point markers
  // ═══════════════════════════════════════════════════════════════════════════

  private updateFocalPoints(): void {
    const focal = this.lens.getDFfdBfd();
    if (!(Number.isFinite(focal.ffd) && Number.isFinite(focal.bfd))) {
      this.focalFront.shape = null;
      this.focalBack.shape = null;
      return;
    }

    const v2 = this.lens.path[2] as GlassPathPoint;
    const v5 = this.lens.path[5] as GlassPathPoint;

    // Perpendicular direction (model space)
    const { dpx, dpy, len } = this.getPerpendicular();
    if (len < 1e-10) {
      this.focalFront.shape = null;
      this.focalBack.shape = null;
      return;
    }

    const { ffd, bfd } = focal;

    // Focal-point positions in model space
    const bfx = v2.x + bfd * dpx;
    const bfy = v2.y + bfd * dpy;
    const ffx = v5.x - ffd * dpx;
    const ffy = v5.y - ffd * dpy;

    // Convert to view space
    const mvt = this.modelViewTransform;
    const vffx = mvt.modelToViewX(ffx);
    const vffy = mvt.modelToViewY(ffy);
    const vbfx = mvt.modelToViewX(bfx);
    const vbfy = mvt.modelToViewY(bfy);
    const vs = mvt.modelToViewDeltaX(SPHERICAL_FOCAL_MARKER_SIZE_M);

    this.focalFront.shape = new Shape()
      .moveTo(vffx - vs, vffy - vs)
      .lineTo(vffx + vs, vffy - vs)
      .lineTo(vffx + vs, vffy + vs)
      .lineTo(vffx - vs, vffy + vs)
      .close();
    this.focalBack.shape = new Shape()
      .moveTo(vbfx - vs, vbfy - vs)
      .lineTo(vbfx + vs, vbfy - vs)
      .lineTo(vbfx + vs, vbfy + vs)
      .lineTo(vbfx - vs, vbfy + vs)
      .close();
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
    // ~270° arc
    shape.arc(cx, cy, r, startAngle, endAngle, false);

    // Arrowhead at the arc end
    const ex = cx + r * Math.cos(endAngle);
    const ey = cy + r * Math.sin(endAngle);
    // Two arms of the arrowhead, tangent to the arc at the endpoint
    const tangent = endAngle + Math.PI / 2; // tangent direction (CCW)
    shape.moveTo(ex, ey);
    shape.lineTo(ex + a * Math.cos(tangent + 0.5), ey + a * Math.sin(tangent + 0.5));
    shape.moveTo(ex, ey);
    shape.lineTo(ex + a * Math.cos(tangent - 0.5), ey + a * Math.sin(tangent - 0.5));

    this.rotationIndicator.shape = shape;
  }
}

opticsLab.register("SphericalLensView", SphericalLensView);
