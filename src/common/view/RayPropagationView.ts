/**
 * RayPropagationView.ts
 *
 * Scenery CanvasNode that renders the traced ray segments produced by the
 * ray-tracing engine. Each segment is drawn individually so that its
 * stroke alpha reflects the physical brightness (brighter ray = more opaque).
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
  CONTINUOUS_RAY_DENSITY_THRESHOLD,
  CONTINUOUS_RAY_FILL_ALPHA_SCALE,
  CONTINUOUS_RAY_P1_PROXIMITY_SQ,
  DEFAULT_RAY_DENSITY,
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
  private rayDensity: number = DEFAULT_RAY_DENSITY;

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
   * Update the current ray density. When density >= CONTINUOUS_RAY_DENSITY_THRESHOLD,
   * point/arc source rays switch from individual lines to filled regions.
   */
  public setRayDensity(density: number): void {
    this.rayDensity = density;
  }

  /**
   * Custom canvas painting. Called by Scenery during the display update pass.
   * Must not mutate any Scenery node state.
   */
  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const segs = this.segments;
    if (segs.length === 0) {
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
    this.paintExtensionRays(context, segs, clipRect);

    const isContinuous = this.rayDensity >= CONTINUOUS_RAY_DENSITY_THRESHOLD;
    if (isContinuous) {
      // Split segments: those with sourceId get continuous fill, others get line rendering
      const continuousSegs: TracedSegment[] = [];
      const discreteSegs: TracedSegment[] = [];
      for (const seg of segs) {
        if (
          !seg.isExtension &&
          seg.sourceId !== null &&
          seg.sourceId !== undefined &&
          seg.rayIndex !== null &&
          seg.rayIndex !== undefined
        ) {
          continuousSegs.push(seg);
        } else {
          discreteSegs.push(seg);
        }
      }
      this.paintContinuousRays(context, continuousSegs, clipRect);
      this.paintForwardRays(context, discreteSegs, clipRect);
    } else {
      this.paintForwardRays(context, segs, clipRect);
    }
  }

  private paintExtensionRays(context: CanvasRenderingContext2D, segs: TracedSegment[], clipRect: ClipRect): void {
    const mvt = this.modelViewTransform;
    context.lineWidth = EXT_LINE_WIDTH;
    context.setLineDash(EXT_LINE_DASH);

    const extBuckets: Array<Array<[number, number, number, number]>> = new Array(RAY_ALPHA_BUCKETS + 1);

    for (const seg of segs) {
      if (!seg.isExtension) {
        continue;
      }
      const alpha = Math.min(1, (seg.brightnessS + seg.brightnessP) * EXT_ALPHA_SCALE);
      if (alpha < RAY_ALPHA_SKIP) {
        continue;
      }

      const clipped = clipSegment(
        mvt.modelToViewX(seg.p1.x),
        mvt.modelToViewY(seg.p1.y),
        mvt.modelToViewX(seg.p2.x),
        mvt.modelToViewY(seg.p2.y),
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

  /**
   * Render continuous filled regions between adjacent rays from point/arc sources.
   * Groups segments by sourceId, builds per-rayIndex chains, then fills polygons
   * between consecutive rayIndex pairs.
   */
  private paintContinuousRays(context: CanvasRenderingContext2D, segs: TracedSegment[], clipRect: ClipRect): void {
    if (segs.length === 0) {
      return;
    }

    const mvt = this.modelViewTransform;

    // Group segments by sourceId, then by rayIndex (preserving trace order within each chain).
    const bySource = new Map<string, Map<number, TracedSegment[]>>();
    for (const seg of segs) {
      const sid = seg.sourceId!;
      const idx = seg.rayIndex!;
      let idxMap = bySource.get(sid);
      if (!idxMap) {
        idxMap = new Map();
        bySource.set(sid, idxMap);
      }
      let chain = idxMap.get(idx);
      if (!chain) {
        chain = [];
        idxMap.set(idx, chain);
      }
      chain.push(seg);
    }

    // For each source, fill between consecutive rayIndex chains.
    for (const [, idxMap] of bySource) {
      const sortedIndices = Array.from(idxMap.keys()).sort((a, b) => a - b);
      if (sortedIndices.length < 2) {
        continue;
      }

      for (let k = 0; k < sortedIndices.length - 1; k++) {
        const idxA = sortedIndices[k]!;
        const idxB = sortedIndices[k + 1]!;
        const chainA = idxMap.get(idxA)!;
        const chainB = idxMap.get(idxB)!;
        const minLen = Math.min(chainA.length, chainB.length);

        for (let j = 0; j < minLen; j++) {
          const segA = chainA[j]!;
          const segB = chainB[j]!;

          // Proximity check on p1 endpoints (model coordinates).
          const dx1 = segA.p1.x - segB.p1.x;
          const dy1 = segA.p1.y - segB.p1.y;
          if (dx1 * dx1 + dy1 * dy1 > CONTINUOUS_RAY_P1_PROXIMITY_SQ) {
            break; // Chains diverged (different optical elements or diffraction orders)
          }

          // Convert to view coordinates.
          const ax1 = mvt.modelToViewX(segA.p1.x);
          const ay1 = mvt.modelToViewY(segA.p1.y);
          const ax2 = mvt.modelToViewX(segA.p2.x);
          const ay2 = mvt.modelToViewY(segA.p2.y);
          const bx1 = mvt.modelToViewX(segB.p1.x);
          const by1 = mvt.modelToViewY(segB.p1.y);
          const bx2 = mvt.modelToViewX(segB.p2.x);
          const by2 = mvt.modelToViewY(segB.p2.y);

          // Quick reject: all four corners on the same side of clip rect.
          const allLeft = ax1 < clipRect.xmin && ax2 < clipRect.xmin && bx1 < clipRect.xmin && bx2 < clipRect.xmin;
          const allRight = ax1 > clipRect.xmax && ax2 > clipRect.xmax && bx1 > clipRect.xmax && bx2 > clipRect.xmax;
          const allTop = ay1 < clipRect.ymin && ay2 < clipRect.ymin && by1 < clipRect.ymin && by2 < clipRect.ymin;
          const allBottom = ay1 > clipRect.ymax && ay2 > clipRect.ymax && by1 > clipRect.ymax && by2 > clipRect.ymax;
          if (allLeft || allRight || allTop || allBottom) {
            continue;
          }

          // Average brightness and wavelength for the fill colour.
          const avgBrightness = (segA.brightnessS + segA.brightnessP + segB.brightnessS + segB.brightnessP) * 0.5;
          const alpha = Math.min(1, avgBrightness * RAY_ALPHA_SCALE * CONTINUOUS_RAY_FILL_ALPHA_SCALE);
          if (alpha < RAY_ALPHA_SKIP) {
            continue;
          }

          const wavelength = segA.wavelength ?? segB.wavelength ?? 550;
          const c = VisibleColor.wavelengthToColor(wavelength);

          context.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha.toFixed(3)})`;
          context.beginPath();
          context.moveTo(ax1, ay1);
          context.lineTo(ax2, ay2);
          context.lineTo(bx2, by2);
          context.lineTo(bx1, by1);
          context.closePath();
          context.fill();
        }
      }
    }
  }

  private paintForwardRays(context: CanvasRenderingContext2D, segs: TracedSegment[], clipRect: ClipRect): void {
    const mvt = this.modelViewTransform;
    context.lineWidth = RAY_LINE_WIDTH;

    for (const seg of segs) {
      if (seg.isExtension) {
        continue;
      }
      const alpha = Math.min(1, (seg.brightnessS + seg.brightnessP) * RAY_ALPHA_SCALE);
      if (alpha < RAY_ALPHA_SKIP) {
        continue;
      }

      const vx1 = mvt.modelToViewX(seg.p1.x);
      const vy1 = mvt.modelToViewY(seg.p1.y);
      const vx2 = mvt.modelToViewX(seg.p2.x);
      const vy2 = mvt.modelToViewY(seg.p2.y);

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
