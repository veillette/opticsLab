/**
 * RayPropagationView.ts
 *
 * Scenery CanvasNode that renders the traced ray segments produced by the
 * ray-tracing engine. Each segment is drawn individually so that its
 * stroke alpha reflects the physical brightness (brighter ray = more opaque).
 *
 * At high ray density the overlapping semi-transparent strokes naturally
 * produce a continuous filled appearance (same approach as optics-template).
 *
 * Segment endpoints arrive in MODEL coordinates (metres, y-up). The
 * ModelViewTransform2 is used to convert them to canvas pixel coordinates
 * before drawing.
 */

import type { Bounds2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CanvasNode, type CanvasNodeOptions } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import {
  CONT_SPECTRUM_RAY_ALPHA_MULTIPLIER,
  EXT_ALPHA_SCALE,
  EXT_B,
  EXT_G,
  EXT_LINE_DASH,
  EXT_LINE_WIDTH,
  EXT_R,
  RAY_ALPHA_BUCKETS,
  RAY_ALPHA_SCALE,
  RAY_ALPHA_SKIP,
  RAY_CLIP_MARGIN_PX,
  RAY_LINE_WIDTH,
} from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { ViewMode } from "../model/optics/OpticsTypes.js";
import type { TracedSegment } from "../model/optics/RayTracer.js";
import type { ViewOptionsModel } from "./ViewOptionsModel.js";

// Cohen–Sutherland region codes
const CS_INSIDE = 0;
const CS_LEFT = 1;
const CS_RIGHT = 2;
const CS_BOTTOM = 4;
const CS_TOP = 8;

type ClipRect = { xmin: number; ymin: number; xmax: number; ymax: number };

function csOutcode(x: number, y: number, r: ClipRect): number {
  let code = CS_INSIDE;
  if (x < r.xmin) {
    code |= CS_LEFT;
  } else if (x > r.xmax) {
    code |= CS_RIGHT;
  }
  if (y < r.ymin) {
    code |= CS_TOP;
  } else if (y > r.ymax) {
    code |= CS_BOTTOM;
  }
  return code;
}

/**
 * Cohen–Sutherland line clipping. Returns clipped endpoints [x1,y1,x2,y2]
 * or null if the segment is entirely outside the rectangle.
 */
function clipSegment(
  inputX1: number,
  inputY1: number,
  inputX2: number,
  inputY2: number,
  r: ClipRect,
): [number, number, number, number] | null {
  let ax = inputX1,
    ay = inputY1,
    bx = inputX2,
    by = inputY2;
  let code1 = csOutcode(ax, ay, r);
  let code2 = csOutcode(bx, by, r);

  for (;;) {
    if ((code1 | code2) === 0) {
      return [ax, ay, bx, by];
    }
    if ((code1 & code2) !== 0) {
      return null;
    }

    const codeOut = code1 !== 0 ? code1 : code2;
    let x: number, y: number;

    if (codeOut & CS_BOTTOM) {
      x = ax + ((bx - ax) * (r.ymax - ay)) / (by - ay);
      y = r.ymax;
    } else if (codeOut & CS_TOP) {
      x = ax + ((bx - ax) * (r.ymin - ay)) / (by - ay);
      y = r.ymin;
    } else if (codeOut & CS_RIGHT) {
      y = ay + ((by - ay) * (r.xmax - ax)) / (bx - ax);
      x = r.xmax;
    } else {
      y = ay + ((by - ay) * (r.xmin - ax)) / (bx - ax);
      x = r.xmin;
    }

    if (codeOut === code1) {
      ax = x;
      ay = y;
      code1 = csOutcode(ax, ay, r);
    } else {
      bx = x;
      by = y;
      code2 = csOutcode(bx, by, r);
    }
  }
}

// ── View class ────────────────────────────────────────────────────────────────

export class RayPropagationView extends CanvasNode {
  private segments: TracedSegment[] = [];
  private mode: ViewMode = "rays";
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly viewOptions: ViewOptionsModel;
  /** Shared listener stored so it can be unlinked in dispose(). */
  private readonly _invalidatePaintListener = () => this.invalidatePaint();

  public constructor(
    canvasBounds: Bounds2,
    modelViewTransform: ModelViewTransform2,
    viewOptions: ViewOptionsModel,
    options?: CanvasNodeOptions,
  ) {
    super({
      canvasBounds,
      pickable: false, // rays are non-interactive
      ...options,
    });
    this.modelViewTransform = modelViewTransform;
    this.viewOptions = viewOptions;
    viewOptions.rayArrowsVisibleProperty.lazyLink(this._invalidatePaintListener);
    viewOptions.rayStubsEnabledProperty.lazyLink(this._invalidatePaintListener);
    viewOptions.rayStubLengthPxProperty.lazyLink(this._invalidatePaintListener);
  }

  public override dispose(): void {
    this.viewOptions.rayArrowsVisibleProperty.unlink(this._invalidatePaintListener);
    this.viewOptions.rayStubsEnabledProperty.unlink(this._invalidatePaintListener);
    this.viewOptions.rayStubLengthPxProperty.unlink(this._invalidatePaintListener);
    super.dispose();
  }

  /**
   * Supply new traced segments from the ray tracer. This replaces the
   * previous set and marks the node for repaint.
   */
  public setSegments(segments: TracedSegment[], mode?: ViewMode): void {
    const newMode = mode ?? "rays";
    if (segments === this.segments && newMode === this.mode) {
      return;
    }
    this.segments = segments;
    this.mode = newMode;
    this.invalidatePaint();
  }

  /**
   * Custom canvas painting. Called by Scenery during the display update pass.
   * Must not mutate any Scenery node state.
   */
  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const segments = this.segments;
    if (segments.length === 0) {
      return;
    }

    const bounds = this.canvasBounds;
    const clipRect: ClipRect = {
      xmin: bounds.minX - RAY_CLIP_MARGIN_PX,
      ymin: bounds.minY - RAY_CLIP_MARGIN_PX,
      xmax: bounds.maxX + RAY_CLIP_MARGIN_PX,
      ymax: bounds.maxY + RAY_CLIP_MARGIN_PX,
    };

    context.lineCap = "round";

    if (this.mode === "observer") {
      // In observer mode, don't draw regular forward/extension rays.
      // Only draw observer rays (from observer entry to apparent image).
      this.paintObserverRays(context, segments, clipRect);
    } else {
      this.paintExtensionRays(context, segments, clipRect);
      this.paintForwardRays(context, segments, clipRect);
      if (this.viewOptions.rayArrowsVisibleProperty.value && !this.viewOptions.rayStubsEnabledProperty.value) {
        this.paintArrowheads(context, segments, clipRect);
      }
    }
  }

  private paintExtensionRays(context: CanvasRenderingContext2D, segments: TracedSegment[], clipRect: ClipRect): void {
    // When ray stubs are enabled, suppress extension rays entirely.
    if (this.viewOptions.rayStubsEnabledProperty.value) {
      return;
    }
    const modelViewTransform = this.modelViewTransform;
    context.lineWidth = EXT_LINE_WIDTH;
    context.setLineDash(EXT_LINE_DASH);

    const extBuckets: Array<Array<[number, number, number, number]>> = new Array(RAY_ALPHA_BUCKETS + 1);

    for (const seg of segments) {
      if (!seg.isExtension) {
        continue;
      }
      const alpha = Math.min(1, (seg.brightnessS + seg.brightnessP) * EXT_ALPHA_SCALE);
      if (alpha < RAY_ALPHA_SKIP) {
        continue;
      }

      const clipped = clipSegment(
        modelViewTransform.modelToViewX(seg.p1.x),
        modelViewTransform.modelToViewY(seg.p1.y),
        modelViewTransform.modelToViewX(seg.p2.x),
        modelViewTransform.modelToViewY(seg.p2.y),
        clipRect,
      );
      if (!clipped) {
        continue;
      }

      const bucket = Math.min(RAY_ALPHA_BUCKETS, Math.round(alpha * RAY_ALPHA_BUCKETS));
      if (!extBuckets[bucket]) {
        extBuckets[bucket] = [];
      }
      extBuckets[bucket].push(clipped);
    }

    for (let b = 0; b <= RAY_ALPHA_BUCKETS; b++) {
      const lines = extBuckets[b];
      if (!lines || lines.length === 0) {
        continue;
      }
      context.strokeStyle = `rgba(${EXT_R},${EXT_G},${EXT_B},${(b / RAY_ALPHA_BUCKETS).toFixed(3)})`;
      context.beginPath();
      for (const [cx1, cy1, cx2, cy2] of lines) {
        context.moveTo(cx1, cy1);
        context.lineTo(cx2, cy2);
      }
      context.stroke();
    }

    context.setLineDash([]);
  }

  private paintForwardRays(context: CanvasRenderingContext2D, segments: TracedSegment[], clipRect: ClipRect): void {
    const modelViewTransform = this.modelViewTransform;
    context.lineWidth = RAY_LINE_WIDTH;

    const stubsEnabled = this.viewOptions.rayStubsEnabledProperty.value;
    const stubLengthPx = this.viewOptions.rayStubLengthPxProperty.value;

    const paintSegment = (seg: TracedSegment, additive: boolean): void => {
      // In stub mode, only draw segments emitted directly from a light source.
      if (stubsEnabled && !seg.isFromSource) {
        return;
      }

      const alpha = Math.min(1, (seg.brightnessS + seg.brightnessP) * RAY_ALPHA_SCALE);
      if (alpha < RAY_ALPHA_SKIP) {
        return;
      }

      const vx1 = modelViewTransform.modelToViewX(seg.p1.x);
      const vy1 = modelViewTransform.modelToViewY(seg.p1.y);
      let vx2 = modelViewTransform.modelToViewX(seg.p2.x);
      let vy2 = modelViewTransform.modelToViewY(seg.p2.y);

      // In stub mode, truncate only source segments to stubLengthPx from p1.
      if (stubsEnabled && seg.isFromSource) {
        const dx = vx2 - vx1;
        const dy = vy2 - vy1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > stubLengthPx) {
          const t = stubLengthPx / len;
          vx2 = vx1 + dx * t;
          vy2 = vy1 + dy * t;
        }
      }

      if (
        (vx1 < clipRect.xmin && vx2 < clipRect.xmin) ||
        (vx1 > clipRect.xmax && vx2 > clipRect.xmax) ||
        (vy1 < clipRect.ymin && vy2 < clipRect.ymin) ||
        (vy1 > clipRect.ymax && vy2 > clipRect.ymax)
      ) {
        return;
      }

      const c = VisibleColor.wavelengthToColor(seg.wavelength ?? 550);
      let obsAlpha = seg.isObserved ? Math.min(1, alpha * 1.4) : alpha;
      if (additive) {
        obsAlpha = Math.min(1, obsAlpha * CONT_SPECTRUM_RAY_ALPHA_MULTIPLIER);
      }

      context.strokeStyle = `rgba(${c.r},${c.g},${c.b},${obsAlpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(vx1, vy1);
      context.lineTo(vx2, vy2);
      context.stroke();
    };

    for (const seg of segments) {
      if (seg.isExtension || seg.spectrumAdditiveBlend) {
        continue;
      }
      paintSegment(seg, false);
    }

    const additiveSegments = segments.filter((s) => !s.isExtension && s.spectrumAdditiveBlend);
    if (additiveSegments.length > 0) {
      context.save();
      context.globalCompositeOperation = "lighter";
      for (const seg of additiveSegments) {
        paintSegment(seg, true);
      }
      context.restore();
    }
  }

  /**
   * Observer mode: draw observer ray segments from the observer entry point
   * back to the apparent source / image location. These are the rays that
   * the observer "sees" looking backward along the light path.
   */
  private paintObserverRays(context: CanvasRenderingContext2D, segments: TracedSegment[], clipRect: ClipRect): void {
    const modelViewTransform = this.modelViewTransform;

    // Observer rays are drawn as dashed lines (like extension rays but more visible)
    context.lineWidth = RAY_LINE_WIDTH + 0.5;
    context.setLineDash([6, 3]);

    for (const seg of segments) {
      if (!seg.isObserverRay) {
        continue;
      }

      const alpha = Math.min(1, (seg.brightnessS + seg.brightnessP) * RAY_ALPHA_SCALE * 1.5);
      if (alpha < RAY_ALPHA_SKIP) {
        continue;
      }

      const vx1 = modelViewTransform.modelToViewX(seg.p1.x);
      const vy1 = modelViewTransform.modelToViewY(seg.p1.y);
      const vx2 = modelViewTransform.modelToViewX(seg.p2.x);
      const vy2 = modelViewTransform.modelToViewY(seg.p2.y);

      const clipped = clipSegment(vx1, vy1, vx2, vy2, clipRect);
      if (!clipped) {
        continue;
      }

      const c = VisibleColor.wavelengthToColor(seg.wavelength ?? 550);
      context.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(clipped[0], clipped[1]);
      context.lineTo(clipped[2], clipped[3]);
      context.stroke();
    }

    context.setLineDash([]);
  }

  /**
   * Paints a small filled arrowhead on each forward ray segment to indicate
   * propagation direction (including after reflection/refraction).
   *
   * Placement: the arrowhead is placed at a fixed distance (ARROW_OFFSET_PX)
   * from p1 along the ray direction.  This ensures that rays which travel off-
   * screen without hitting anything still receive a visible arrowhead near
   * their origin, rather than at the (potentially off-screen) midpoint.
   * For short segments the arrowhead is placed at the midpoint instead.
   */
  private paintArrowheads(context: CanvasRenderingContext2D, segments: TracedSegment[], clipRect: ClipRect): void {
    const modelViewTransform = this.modelViewTransform;
    const ARROW_LENGTH = 10; // px – total arrowhead length
    const ARROW_HALF_WIDTH = 4; // px – half-width of arrowhead base
    const ARROW_OFFSET_PX = 70; // px from p1 at which to centre the arrowhead
    const MIN_SEGMENT_PX = 24; // don't draw on very short segments

    context.save();
    for (const seg of segments) {
      if (seg.isExtension) {
        continue;
      }
      const alpha = Math.min(1, (seg.brightnessS + seg.brightnessP) * RAY_ALPHA_SCALE);
      if (alpha < RAY_ALPHA_SKIP) {
        continue;
      }

      const vx1 = modelViewTransform.modelToViewX(seg.p1.x);
      const vy1 = modelViewTransform.modelToViewY(seg.p1.y);
      const vx2 = modelViewTransform.modelToViewX(seg.p2.x);
      const vy2 = modelViewTransform.modelToViewY(seg.p2.y);

      const dx = vx2 - vx1;
      const dy = vy2 - vy1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < MIN_SEGMENT_PX) {
        continue;
      }

      // Unit direction
      const ux = dx / len;
      const uy = dy / len;

      // Centre of the arrowhead: fixed offset from p1, capped at midpoint so
      // the arrowhead always stays on the segment.
      const offset = Math.min(ARROW_OFFSET_PX, len * 0.5);
      const mx = vx1 + ux * offset;
      const my = vy1 + uy * offset;

      // Skip if the arrowhead centre is outside the clip rect
      if (mx < clipRect.xmin || mx > clipRect.xmax || my < clipRect.ymin || my > clipRect.ymax) {
        continue;
      }

      // Perpendicular direction
      const px = -uy;
      const py = ux;

      // Arrowhead: tip forward, base behind
      const tipX = mx + ux * (ARROW_LENGTH * 0.5);
      const tipY = my + uy * (ARROW_LENGTH * 0.5);
      const baseX = mx - ux * (ARROW_LENGTH * 0.5);
      const baseY = my - uy * (ARROW_LENGTH * 0.5);

      const c = VisibleColor.wavelengthToColor(seg.wavelength ?? 550);
      context.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(tipX, tipY);
      context.lineTo(baseX + px * ARROW_HALF_WIDTH, baseY + py * ARROW_HALF_WIDTH);
      context.lineTo(baseX - px * ARROW_HALF_WIDTH, baseY - py * ARROW_HALF_WIDTH);
      context.closePath();
      context.fill();
    }
    context.restore();
  }
}

opticsLab.register("RayPropagationView", RayPropagationView);
