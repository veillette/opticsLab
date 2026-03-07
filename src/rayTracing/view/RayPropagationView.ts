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
  EXT_ALPHA_SCALE,
  EXT_B,
  EXT_G,
  EXT_LINE_WIDTH,
  EXT_R,
  RAY_ALPHA_SCALE,
  RAY_ALPHA_SKIP,
  RAY_LINE_WIDTH,
} from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { TracedSegment } from "../model/optics/RayTracer.js";

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
    const segs = this.segments;
    if (segs.length === 0) {
      return;
    }

    const modelViewTransform = this.modelViewTransform;
    context.lineCap = "round";

    // ── Pass 1: Extension rays (drawn first, behind everything) ───────────
    context.lineWidth = EXT_LINE_WIDTH;
    for (const seg of segs) {
      if (!seg.isExtension) {
        continue;
      }
      const brightness = seg.brightnessS + seg.brightnessP;
      const alpha = Math.min(1, brightness * EXT_ALPHA_SCALE);
      if (alpha < RAY_ALPHA_SKIP) {
        continue;
      }
      context.strokeStyle = `rgba(${EXT_R},${EXT_G},${EXT_B},${alpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(modelViewTransform.modelToViewX(seg.p1.x), modelViewTransform.modelToViewY(seg.p1.y));
      context.lineTo(modelViewTransform.modelToViewX(seg.p2.x), modelViewTransform.modelToViewY(seg.p2.y));
      context.stroke();
    }

    // ── Pass 2: Forward rays ──────────────────────────────────────────────
    context.lineWidth = RAY_LINE_WIDTH;
    for (const seg of segs) {
      if (seg.isExtension) {
        continue;
      }
      const brightness = seg.brightnessS + seg.brightnessP;
      const alpha = Math.min(1, brightness * RAY_ALPHA_SCALE);
      if (alpha < RAY_ALPHA_SKIP) {
        continue;
      }

      const wl = seg.wavelength ?? 550;
      const c = VisibleColor.wavelengthToColor(wl);
      const obsAlpha = seg.isObserved ? Math.min(1, alpha * 1.4) : alpha;

      context.strokeStyle = `rgba(${c.r},${c.g},${c.b},${obsAlpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(modelViewTransform.modelToViewX(seg.p1.x), modelViewTransform.modelToViewY(seg.p1.y));
      context.lineTo(modelViewTransform.modelToViewX(seg.p2.x), modelViewTransform.modelToViewY(seg.p2.y));
      context.stroke();
    }
  }
}

opticsLab.register("RayPropagationView", RayPropagationView);
