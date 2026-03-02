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
import opticsLab from "../../OpticsLabNamespace.js";
import type { TracedSegment } from "../model/optics/RayTracer.js";

// ── Visual constants ──────────────────────────────────────────────────────────

/** Forward-ray base colour (R, G, B). */
const RAY_R = 0;
const RAY_G = 210;
const RAY_B = 0;

/** Extension-ray (virtual image helper) colour. */
const EXT_R = 140;
const EXT_G = 140;
const EXT_B = 140;

/** Observed-ray highlight colour. */
const OBS_R = 60;
const OBS_G = 255;
const OBS_B = 60;

/** Line widths. */
const RAY_LINE_WIDTH = 1.5;
const EXT_LINE_WIDTH = 0.8;

// ── View class ────────────────────────────────────────────────────────────────

export class RayPropagationView extends CanvasNode {
  private segments: TracedSegment[] = [];
  private readonly mvt: ModelViewTransform2;

  public constructor(canvasBounds: Bounds2, mvt: ModelViewTransform2, options?: CanvasNodeOptions) {
    super({
      canvasBounds,
      pickable: false, // rays are non-interactive
      ...options,
    });
    this.mvt = mvt;
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

    const mvt = this.mvt;
    context.lineCap = "round";

    // ── Pass 1: Extension rays (drawn first, behind everything) ───────────
    context.lineWidth = EXT_LINE_WIDTH;
    for (const seg of segs) {
      if (!seg.isExtension) {
        continue;
      }
      const brightness = seg.brightnessS + seg.brightnessP;
      const alpha = Math.min(1, brightness * 0.35);
      if (alpha < 0.005) {
        continue;
      }
      context.strokeStyle = `rgba(${EXT_R},${EXT_G},${EXT_B},${alpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(mvt.modelToViewX(seg.p1.x), mvt.modelToViewY(seg.p1.y));
      context.lineTo(mvt.modelToViewX(seg.p2.x), mvt.modelToViewY(seg.p2.y));
      context.stroke();
    }

    // ── Pass 2: Forward rays ──────────────────────────────────────────────
    context.lineWidth = RAY_LINE_WIDTH;
    for (const seg of segs) {
      if (seg.isExtension) {
        continue;
      }
      const brightness = seg.brightnessS + seg.brightnessP;
      const alpha = Math.min(1, brightness * 1.2);
      if (alpha < 0.005) {
        continue;
      }

      let r = RAY_R;
      let g = RAY_G;
      let b = RAY_B;

      if (seg.isObserved) {
        r = OBS_R;
        g = OBS_G;
        b = OBS_B;
      }

      context.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      context.beginPath();
      context.moveTo(mvt.modelToViewX(seg.p1.x), mvt.modelToViewY(seg.p1.y));
      context.lineTo(mvt.modelToViewX(seg.p2.x), mvt.modelToViewY(seg.p2.y));
      context.stroke();
    }
  }
}

opticsLab.register("RayPropagationView", RayPropagationView);
