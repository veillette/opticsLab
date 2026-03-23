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
import type { TracedSegment } from "../model/optics/RayTracer.js";

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
  private readonly modelViewTransform: ModelViewTransform2;

  public constructor(canvasBounds: Bounds2, modelViewTransform: ModelViewTransform2, options?: CanvasNodeOptions) {
    super({
      canvasBounds,
      pickable: false, // rays are non-interactive
      ...options,
    });
    this.modelViewTransform = modelViewTransform;
  }

  /**
   * Supply new traced segments from the ray tracer. This replaces the
   * previous set and marks the node for repaint.
   */
  public setSegments(segments: TracedSegment[]): void {
    this.segments = segments;
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
    this.paintExtensionRays(context, segments, clipRect);
    this.paintForwardRays(context, segments, clipRect);
  }

  private paintExtensionRays(context: CanvasRenderingContext2D, segments: TracedSegment[], clipRect: ClipRect): void {
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

      // Quick reject: both endpoints on same side of clip rect
      if (
        (vx1 < clipRect.xmin && vx2 < clipRect.xmin) ||
        (vx1 > clipRect.xmax && vx2 > clipRect.xmax) ||
        (vy1 < clipRect.ymin && vy2 < clipRect.ymin) ||
        (vy1 > clipRect.ymax && vy2 > clipRect.ymax)
      ) {
        continue;
      }

      const c = VisibleColor.wavelengthToColor(seg.wavelength ?? 550);
      const obsAlpha = seg.isObserved ? Math.min(1, alpha * 1.4) : alpha;

      context.strokeStyle = `rgba(${c.r},${c.g},${c.b},${obsAlpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(vx1, vy1);
      context.lineTo(vx2, vy2);
      context.stroke();
    }
  }
}

opticsLab.register("RayPropagationView", RayPropagationView);
