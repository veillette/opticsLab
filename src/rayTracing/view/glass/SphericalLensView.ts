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
  HANDLE_RADIUS,
  ROTATION_HANDLE_RADIUS,
  ROTATION_INDICATOR_ARROW_SIZE,
  ROTATION_INDICATOR_LINE_WIDTH,
  ROTATION_INDICATOR_RADIUS,
  SEGMENT_LENGTH_MIN,
  SPHERICAL_FOCAL_MARKER_SIZE_M,
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
const CURVATURE_HANDLE_FILL = "rgba(100, 220, 255, 0.9)";
const CURVATURE_HANDLE_STROKE = "#006090";

/**
 * Indices into the 4-element corners array (mapped from path indices 0,1,3,4).
 */
const CORNER_TOP_LEFT = 0; // path[0]
const CORNER_TOP_RIGHT = 1; // path[1]
const CORNER_BOTTOM_RIGHT = 2; // path[3]
const CORNER_BOTTOM_LEFT = 3; // path[4]

/**
 * Which corner carries the rotation handle (the rest are width handles).
 * CORNER_TOP_RIGHT = path[1] = screen bottom-right (y is inverted by MVT).
 */
const ROTATION_CORNER = CORNER_TOP_RIGHT;

export class SphericalLensView extends GlassView {
  /** Called after every geometry rebuild (drag or programmatic). Allows external observers to sync UI. */
  public onRebuild: (() => void) | null = null;

  private readonly focalFront: Path;
  private readonly focalBack: Path;

  /** 3 standard handles for changing lens thickness. */
  private readonly widthHandles: Circle[];
  /** The corner indices (into getCorners()) of the width handles. */
  private readonly widthCornerIndices: number[];

  /** Special rotation handle with visual indicator. */
  private readonly rotationHandle: Circle;
  private readonly rotationIndicator: Path;

  /** Curvature drag handles: cyan circles sitting at the arc apex of each surface. */
  private readonly curvatureHandleR1: Circle; // path[5] – left surface
  private readonly curvatureHandleR2: Circle; // path[2] – right surface

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
      // Top corners (near p1) drag in -da direction to increase height;
      // bottom corners (near p2) drag in +da direction.
      const side: "p1" | "p2" = ci === CORNER_TOP_LEFT || ci === CORNER_TOP_RIGHT ? "p1" : "p2";
      this.attachHeightDrag(handle, side);
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
      pickable: false,
    });
    this.addChild(this.rotationIndicator);
    this.attachRotationDrag();

    // ── Curvature handles ──────────────────────────────────────────────────
    const v2 = this.lens.path[2] as GlassPathPoint | undefined;
    const v5 = this.lens.path[5] as GlassPathPoint | undefined;

    this.curvatureHandleR2 = new Circle(HANDLE_RADIUS, {
      x: v2 ? modelViewTransform.modelToViewX(v2.x) : 0,
      y: v2 ? modelViewTransform.modelToViewY(v2.y) : 0,
      fill: CURVATURE_HANDLE_FILL,
      stroke: CURVATURE_HANDLE_STROKE,
      lineWidth: HANDLE_LINE_WIDTH,
      cursor: "pointer",
      tagName: "div",
      focusable: true,
    });
    this.addChild(this.curvatureHandleR2);
    this.attachCurvatureDrag(this.curvatureHandleR2, "r2");

    this.curvatureHandleR1 = new Circle(HANDLE_RADIUS, {
      x: v5 ? modelViewTransform.modelToViewX(v5.x) : 0,
      y: v5 ? modelViewTransform.modelToViewY(v5.y) : 0,
      fill: CURVATURE_HANDLE_FILL,
      stroke: CURVATURE_HANDLE_STROKE,
      lineWidth: HANDLE_LINE_WIDTH,
      cursor: "pointer",
      tagName: "div",
      focusable: true,
    });
    this.addChild(this.curvatureHandleR1);
    this.attachCurvatureDrag(this.curvatureHandleR1, "r1");

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
   * Attach a height-change drag to a corner handle.
   * Dragging along the aperture axis (perpendicular to the optical axis)
   * resizes the aperture (p1↔p2 distance) symmetrically about the lens centre.
   *
   * `side` is "p1" for top-side corners and "p2" for bottom-side corners, which
   * controls the sign convention: pulling a top corner upward (in the −da
   * direction) and pulling a bottom corner downward (+da) both increase height.
   */
  private attachHeightDrag(handle: Circle, side: "p1" | "p2"): void {
    handle.addInputListener(
      new RichDragListener({
        tandem: Tandem.OPT_OUT,
        transform: this.modelViewTransform,
        drag: (_event, listener) => {
          const { x: dx, y: dy } = listener.modelDelta;
          const p1 = this.lens.p1;
          const p2 = this.lens.p2;
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (len < 1e-10) {
            return;
          }

          // Aperture unit vector (from p1 toward p2)
          const dax = (p2.x - p1.x) / len;
          const day = (p2.y - p1.y) / len;

          // Project drag onto aperture axis; invert for the p1 side so that
          // dragging away from p2 (proj < 0) still increases the aperture.
          const proj = dx * dax + dy * day;
          const delta = side === "p1" ? -proj : proj;
          const newLen = Math.max(SEGMENT_LENGTH_MIN, len + delta);

          // Keep the lens centre fixed and move both ends symmetrically.
          const cx = (p1.x + p2.x) * 0.5;
          const cy = (p1.y + p2.y) * 0.5;
          const half = newLen * 0.5;
          this.lens.p1 = { x: cx - half * dax, y: cy - half * day };
          this.lens.p2 = { x: cx + half * dax, y: cy + half * day };

          // Rebuild the lens path keeping d, r1, r2 unchanged.
          const { d, r1, r2 } = this.lens.getDR1R2();
          this.lens.createLensWithDR1R2(d, r1, r2);
          this.rebuild();
        },
      }),
    );
  }

  /** Attach rotation drag to the rotation handle. */
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

          // Current handle position in model space
          const hx = this.modelViewTransform.viewToModelX(this.rotationHandle.x);
          const hy = this.modelViewTransform.viewToModelY(this.rotationHandle.y);

          // Lens centre (average of 4 corners, matching model's rotate pivot)
          const p = this.lens.path;
          const v0 = p[0];
          const v1 = p[1];
          const v3 = p[3];
          const v4 = p[4];
          if (v0 === undefined || v1 === undefined || v3 === undefined || v4 === undefined) {
            return;
          }
          const cx = (v0.x + v1.x + v3.x + v4.x) / 4;
          const cy = (v0.y + v1.y + v3.y + v4.y) / 4;

          // Angle before and after applying the drag delta
          const prevA = Math.atan2(hy - cy, hx - cx);
          const nextA = Math.atan2(hy + dy - cy, hx + dx - cx);
          const deltaAngle = nextA - prevA;

          this.lens.rotate(deltaAngle);
          const { d, r1, r2 } = this.lens.getDR1R2();
          this.lens.createLensWithDR1R2(d, r1, r2);
          this.rebuild();
        },
      }),
    );
  }

  /**
   * Attach a curvature-change drag to a surface handle.
   * Dragging along the optical axis (perpendicular to aperture) changes the
   * radius of curvature while keeping the lens thickness d fixed.
   *
   * `surface` selects which radius to modify: "r1" (left, path[5]) or "r2" (right, path[2]).
   */
  private attachCurvatureDrag(handle: Circle, surface: "r1" | "r2"): void {
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

          // Project drag delta onto optical-axis direction.
          // Positive proj → rightward (positive dpx), negative → leftward.
          const proj = dx * dpx + dy * dpy;
          const { d, r1, r2 } = this.lens.getDR1R2();

          if (surface === "r2") {
            const s = sagittaFromRadius(r2, len);
            const r2New = radiusFromSagitta(s + proj, len / 2);
            this.lens.createLensWithDR1R2(d, r1, r2New);
          } else {
            const s = sagittaFromRadius(r1, len);
            const r1New = radiusFromSagitta(s + proj, len / 2);
            this.lens.createLensWithDR1R2(d, r1New, r2);
          }
          this.rebuild();
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
    //
    // The naive midpoint of path[0] and path[1] is WRONG for curved surfaces:
    // those corners are shifted from p1 by different amounts along the optical
    // axis (edgeShift1 vs edgeShift2), so their midpoint drifts by
    // (curveShift1 + curveShift2)/2 from the true p1.
    //
    // Correct approach: decompose into aperture-axis and optical-axis components.
    //  • path[0] and path[4] lie on the aperture lines; their projection onto
    //    the aperture unit vector (da) equals that of p1 and p2 respectively,
    //    because the offset from p1/p2 is purely along the optical axis (dpx).
    //  • The optical-axis position of p1/p2 always equals that of cx, which is
    //    the midpoint of the two arc apices (path[2] and path[5]).  The apices
    //    do NOT move when only the radii change, so this component is stable.
    if (this.lens && this.lens.path.length >= SPHERICAL_MIN_VERTEX_COUNT) {
      const v0 = this.lens.path[0] as GlassPathPoint;
      const v2 = this.lens.path[2] as GlassPathPoint;
      const v4 = this.lens.path[4] as GlassPathPoint;
      const v5 = this.lens.path[5] as GlassPathPoint;

      // Optical-axis unit vector: from path[2] toward path[5] (or vice-versa).
      const ax = v2.x - v5.x;
      const ay = v2.y - v5.y;
      const alen = Math.hypot(ax, ay);
      if (alen > 1e-10) {
        const dpxU = ax / alen; // optical-axis unit vector, x-component
        const dpyU = ay / alen; // optical-axis unit vector, y-component
        // Aperture unit vector (perpendicular to optical axis)
        const daUx = dpyU;
        const daUy = -dpxU;
        // Optical-axis coordinate of the lens centre (midpoint of apices)
        const cxOpt = ((v2.x + v5.x) * dpxU + (v2.y + v5.y) * dpyU) * 0.5;
        // Aperture-axis coordinates of p1 and p2
        const p1Aper = v0.x * daUx + v0.y * daUy;
        const p2Aper = v4.x * daUx + v4.y * daUy;
        this.lens.p1 = { x: p1Aper * daUx + cxOpt * dpxU, y: p1Aper * daUy + cxOpt * dpyU };
        this.lens.p2 = { x: p2Aper * daUx + cxOpt * dpxU, y: p2Aper * daUy + cxOpt * dpyU };
      }
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
      const ci = this.widthCornerIndices[i];
      if (ci === undefined) {
        continue;
      }
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

    // ── Reposition curvature handles ─────────────────────────────────────
    const v2 = this.lens.path[2] as GlassPathPoint;
    const v5 = this.lens.path[5] as GlassPathPoint;
    if (v2) {
      this.curvatureHandleR2.x = this.modelViewTransform.modelToViewX(v2.x);
      this.curvatureHandleR2.y = this.modelViewTransform.modelToViewY(v2.y);
    }
    if (v5) {
      this.curvatureHandleR1.x = this.modelViewTransform.modelToViewX(v5.x);
      this.curvatureHandleR1.y = this.modelViewTransform.modelToViewY(v5.y);
    }

    this.onRebuild?.();
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

/**
 * Compute the signed sagitta of a lens surface given its radius r and aperture.
 * s = -(r - sqrt(r²-h²)·sign(r)), where h = aperture/2.
 * Positive s means the apex protrudes in the +dpx direction (right surface);
 * negative s means it protrudes in the -dpx direction (left surface).
 * Returns 0 for flat (|r|=∞) or degenerate surfaces.
 */
function sagittaFromRadius(r: number, aperture: number): number {
  if (!Number.isFinite(r) || Math.abs(r) > 1e15) {
    return 0;
  }
  const h = aperture / 2;
  const r2 = r * r;
  const h2 = h * h;
  if (r2 <= h2) {
    return 0; // degenerate – avoid NaN
  }
  return -(r - Math.sqrt(r2 - h2) * Math.sign(r));
}

/**
 * Compute the signed radius from a sagitta and half-aperture h.
 * r = -(h² + s²) / (2s)
 * Returns Infinity for |s| < ε (flat surface).
 */
function radiusFromSagitta(s: number, h: number): number {
  if (Math.abs(s) < 1e-10) {
    return Infinity;
  }
  return -(h * h + s * s) / (2 * s);
}

opticsLab.register("SphericalLensView", SphericalLensView);
