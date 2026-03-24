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
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  HANDLE_LINE_WIDTH,
  HANDLE_RADIUS,
  ROTATION_HANDLE_RADIUS,
  ROTATION_INDICATOR_ARROW_SIZE,
  ROTATION_INDICATOR_LINE_WIDTH,
  ROTATION_INDICATOR_RADIUS,
  SEGMENT_LENGTH_MIN,
  SPHERICAL_CURVATURE_D_MIN,
  SPHERICAL_FOCAL_MARKER_SIZE_M,
  SPHERICAL_MIN_VERTEX_COUNT,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { GlassPathPoint } from "../../model/glass/Glass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import { createHandle } from "../ViewHelpers.js";
import { GlassView } from "./GlassView.js";

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
  protected readonly curvatureHandleR1: Circle; // path[5] – left surface
  protected readonly curvatureHandleR2: Circle; // path[2] – right surface

  public constructor(
    protected readonly lens: SphericalLens,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem = Tandem.OPT_OUT,
  ) {
    // Pass empty handleVerts → GlassView creates no default handles.
    super(lens, modelViewTransform, tandem, []);

    // ── Focal-point markers ────────────────────────────────────────────────
    this.focalFront = new Path(null, { fill: OpticsLabColors.focalMarkerFillProperty });
    this.focalBack = new Path(null, { fill: OpticsLabColors.focalMarkerFillProperty });
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
      // Left corners (TL, BL) sit in the -dpx direction; right corners in +dpx.
      const optSide: "left" | "right" = ci === CORNER_TOP_LEFT || ci === CORNER_BOTTOM_LEFT ? "left" : "right";
      this.attachHeightDrag(handle, side, optSide);
      return handle;
    });

    // ── Rotation handle ────────────────────────────────────────────────────
    const rotPos = corners[ROTATION_CORNER] ?? { x: 0, y: 0 };
    this.rotationHandle = new Circle(ROTATION_HANDLE_RADIUS, {
      x: modelViewTransform.modelToViewX(rotPos.x),
      y: modelViewTransform.modelToViewY(rotPos.y),
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

    // ── Curvature handles ──────────────────────────────────────────────────
    const v2 = this.lens.path[2] as GlassPathPoint | undefined;
    const v5 = this.lens.path[5] as GlassPathPoint | undefined;

    this.curvatureHandleR2 = new Circle(HANDLE_RADIUS, {
      x: v2 ? modelViewTransform.modelToViewX(v2.x) : 0,
      y: v2 ? modelViewTransform.modelToViewY(v2.y) : 0,
      fill: OpticsLabColors.curvatureHandleFillProperty,
      stroke: OpticsLabColors.curvatureHandleStrokeProperty,
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
      fill: OpticsLabColors.curvatureHandleFillProperty,
      stroke: OpticsLabColors.curvatureHandleStrokeProperty,
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
   * Attach a 2-axis drag to a corner handle:
   *   • Aperture-axis component → resizes height (p1↔p2 distance), keeping the
   *     optical-axis span constant by compensating d for curvature-shift changes.
   *   • Optical-axis component → changes thickness d while keeping r1, r2, and
   *     the aperture fixed (the lens grows/shrinks symmetrically about its centre).
   *
   * `side`    – "p1" for top corners, "p2" for bottom corners (aperture sign).
   * `optSide` – "left" or "right" (which optical side this corner sits on,
   *             determines sign of the d change for horizontal drag).
   */
  private attachHeightDrag(handle: Circle, side: "p1" | "p2", optSide: "left" | "right"): void {
    handle.addInputListener(
      new RichDragListener({
        tandem: this.glassTandem.createTandem(`heightDragListener${side}${optSide}`),
        transform: this.modelViewTransform,
        drag: (_event, listener) => {
          const { x: dx, y: dy } = listener.modelDelta;
          const p1 = this.lens.p1;
          const p2 = this.lens.p2;
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (len < 1e-10) {
            return;
          }

          // Aperture unit vector (from p1 toward p2) and optical-axis unit vector.
          const dax = (p2.x - p1.x) / len;
          const day = (p2.y - p1.y) / len;
          const dpx = day; // optical-axis unit vector (same convention as model)
          const dpy = -dax;

          // ── Aperture-axis component → height change ──────────────────────────
          const projAper = dx * dax + dy * day;
          const deltaAper = side === "p1" ? -projAper : projAper;
          const newLen = Math.max(SEGMENT_LENGTH_MIN, len + deltaAper);

          // Keep the lens centre fixed and move both ends symmetrically.
          const cx = (p1.x + p2.x) * 0.5;
          const cy = (p1.y + p2.y) * 0.5;
          const half = newLen * 0.5;
          this.lens.p1 = { x: cx - half * dax, y: cy - half * day };
          this.lens.p2 = { x: cx + half * dax, y: cy + half * day };

          // Get d, r1, r2 before aperture affects curveshifts.
          const { d, r1, r2 } = this.lens.getDR1R2();

          // Compensate d so the optical-axis span stays constant while aperture changes.
          // span = d − curveShift1 + curveShift2  must be invariant across height drags.
          const cs1Old = lensComputeCurveShift(r1, len);
          const cs2Old = lensComputeCurveShift(r2, len);
          const cs1New = lensComputeCurveShift(r1, newLen);
          const cs2New = lensComputeCurveShift(r2, newLen);
          const dAfterHeightFix =
            Number.isFinite(cs1Old) && Number.isFinite(cs2Old) && Number.isFinite(cs1New) && Number.isFinite(cs2New)
              ? d + (cs1New - cs1Old) - (cs2New - cs2Old)
              : d;

          // ── Optical-axis component → thickness change ────────────────────────
          // Dragging a right corner in +dpx direction (or a left corner in -dpx
          // direction) increases d. Both surfaces expand symmetrically, so each
          // corner moves by projOpt while d changes by 2 × projOpt.
          const projOpt = dx * dpx + dy * dpy;
          const deltaD = optSide === "right" ? 2 * projOpt : -2 * projOpt;

          this.lens.createLensWithDR1R2(Math.max(0.01, dAfterHeightFix + deltaD), r1, r2);
          this.rebuild();
        },
      }),
    );
  }

  /** Attach rotation drag to the rotation handle. */
  private attachRotationDrag(): void {
    this.rotationHandle.addInputListener(
      new RichDragListener({
        tandem: this.glassTandem.createTandem("rotationDragListener"),
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
   * Dragging moves the arc control point (path[2] or path[5]) along the
   * optical axis so the handle follows the cursor.  The corner points stay
   * fixed, so the top/bottom aperture edges don't move; only the curvature
   * of the dragged surface changes.
   *
   * Uses the stable corner-based optical axis direction (v4−v0 gives the
   * aperture direction; dp = perp(da)) so the drag projection is consistent
   * even if p1/p2 have temporarily drifted.
   *
   * The moved apex is clamped so it cannot cross the other apex (which would
   * make d < SPHERICAL_CURVATURE_D_MIN and cause a discontinuous sign-flip in rebuild).
   *
   * `surface` selects which control point to move: "r1" (left, path[5]) or "r2" (right, path[2]).
   */
  private attachCurvatureDrag(handle: Circle, surface: "r1" | "r2"): void {
    handle.addInputListener(
      new RichDragListener({
        tandem: this.glassTandem.createTandem(`curvatureDragListener${surface}`),
        transform: this.modelViewTransform,
        drag: (_event, listener) => {
          const { x: dx, y: dy } = listener.modelDelta;

          // Stable optical-axis direction from the corner pair (v4−v0 = p2−p1).
          const v0 = this.lens.path[0] as GlassPathPoint | undefined;
          const v4 = this.lens.path[4] as GlassPathPoint | undefined;
          if (!(v0 && v4)) {
            return;
          }
          const aax = v4.x - v0.x;
          const aay = v4.y - v0.y;
          const aalen = Math.hypot(aax, aay);
          if (aalen < 1e-10) {
            return;
          }
          const dpx = aay / aalen; // optical-axis unit vector (stable)
          const dpy = -aax / aalen;

          // Project drag delta onto the stable optical-axis direction.
          const proj = dx * dpx + dy * dpy;
          if (Math.abs(proj) < 1e-12) {
            return;
          }

          const pathIndex = surface === "r2" ? 2 : 5;
          const otherIndex = surface === "r2" ? 5 : 2;
          const v = this.lens.path[pathIndex] as GlassPathPoint | undefined;
          const vOther = this.lens.path[otherIndex] as GlassPathPoint | undefined;
          if (!(v && vOther)) {
            return;
          }

          // Tentatively move the apex.
          v.x += proj * dpx;
          v.y += proj * dpy;

          // Clamp: ensure the two apices stay at least SPHERICAL_CURVATURE_D_MIN apart
          // along the optical axis, keeping v2 on the positive-dp side of v5.
          // This prevents the direction vector (v2−v5) from flipping, which
          // would cause a discontinuous jump in the p1/p2 sync in rebuild().
          const v2 = surface === "r2" ? v : vOther;
          const v5 = surface === "r2" ? vOther : v;
          const dAlongOpt = v2.x * dpx + v2.y * dpy - (v5.x * dpx + v5.y * dpy);
          if (dAlongOpt < SPHERICAL_CURVATURE_D_MIN) {
            const excess = SPHERICAL_CURVATURE_D_MIN - dAlongOpt;
            v.x += excess * dpx;
            v.y += excess * dpy;
          }

          this.rebuild();
          this.onCurvatureDragged(surface);
        },
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Extension hook for subclasses
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Called after each curvature drag event and rebuild. Subclasses can
   * override this to enforce additional constraints (e.g., symmetry).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onCurvatureDragged(_surface: "r1" | "r2"): void {
    // no-op in base class
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Rebuild (draw)
  // ═══════════════════════════════════════════════════════════════════════════

  public override rebuild(): void {
    // Sync p1/p2 from path so that body-drag (which moves path[] directly)
    // keeps the aperture endpoints in sync.
    //
    // Strategy: use v4−v0 (corner pair) for the aperture direction — this is
    // always stable because corners are the one thing that does NOT move during
    // curvature drag.  Since v0 = p1 − dp·e1 and v4 = p2 − dp·e1 (same optical
    // offset), their difference equals p2 − p1 exactly, giving a direction that
    // never flips regardless of where the arc apices are.
    //
    // For the optical-axis position of the lens centre (cxOpt) we project the
    // apex midpoint onto the *stable* dp direction computed from the corners.
    // This avoids the sign-flip that occurred when computing dp from v2−v5
    // (which flips 180° if a curvature handle crosses to the wrong side).
    if (this.lens && this.lens.path.length >= SPHERICAL_MIN_VERTEX_COUNT) {
      const v0 = this.lens.path[0] as GlassPathPoint;
      const v2 = this.lens.path[2] as GlassPathPoint;
      const v4 = this.lens.path[4] as GlassPathPoint;
      const v5 = this.lens.path[5] as GlassPathPoint;

      // Aperture unit vector from the stable corner pair v0→v4 (= p1→p2 direction).
      const aax = v4.x - v0.x;
      const aay = v4.y - v0.y;
      const aalen = Math.hypot(aax, aay);
      if (aalen > 1e-10) {
        const daUx = aax / aalen; // aperture unit vector, x-component
        const daUy = aay / aalen; // aperture unit vector, y-component
        // Optical-axis unit vector (same convention as model: dp = perp(da))
        const dpxU = daUy;
        const dpyU = -daUx;
        // Optical-axis coordinate of the lens centre: project the apex midpoint
        // onto the stable dp.  Valid as long as neither apex has crossed the other.
        const cxOpt = ((v2.x + v5.x) * dpxU + (v2.y + v5.y) * dpyU) * 0.5;
        // Aperture-axis coordinates of p1 and p2 (from the left-side corners)
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

    this.rebuildEmitter.emit();
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
    const modelViewTransform = this.modelViewTransform;
    const vffx = modelViewTransform.modelToViewX(ffx);
    const vffy = modelViewTransform.modelToViewY(ffy);
    const vbfx = modelViewTransform.modelToViewX(bfx);
    const vbfy = modelViewTransform.modelToViewY(bfy);
    const vs = modelViewTransform.modelToViewDeltaX(SPHERICAL_FOCAL_MARKER_SIZE_M);

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

/**
 * Local mirror of SphericalLens.computeCurveShift (not exported from the model).
 * Returns the sagitta of a circular arc with radius `r` and chord half-width
 * `aperture / 2`, or NaN if the radius is too small for the aperture.
 */
function lensComputeCurveShift(r: number, aperture: number): number {
  if (!Number.isFinite(r) || Math.abs(r) > 1e15) {
    return 0;
  }
  const h2 = (aperture * aperture) / 4;
  const r2 = r * r;
  if (r2 < h2) {
    return Number.NaN;
  }
  return r - Math.sqrt(r2 - h2) * Math.sign(r);
}
