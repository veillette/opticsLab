/**
 * RayPropagationView.ts
 *
 * Scenery CanvasNode that renders the traced ray segments produced by the
 * ray-tracing engine. Each segment is drawn individually so that its
 * stroke alpha reflects the physical brightness (brighter ray = more opaque).
 *
 * Three visual layers are combined in a single paint pass:
 *   1. Forward rays  – solid green/yellow lines
 *   2. Extension rays – semi-transparent gray lines (virtual-image helpers)
 *   3. Observed rays  – highlighted bright lines (observer-mode only)
 *
 * The node must be told its drawable area via `canvasBounds` (typically the
 * ScreenView's layoutBounds). Call `setSegments()` whenever the simulation
 * produces a new TraceResult; the node will repaint on the next frame.
 */

import type { Bounds2 } from "scenerystack/dot";
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

  public constructor(canvasBounds: Bounds2, options?: CanvasNodeOptions) {
    super({
      canvasBounds,
      pickable: false, // rays are non-interactive
      ...options,
    });
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
      context.moveTo(seg.p1.x, seg.p1.y);
      context.lineTo(seg.p2.x, seg.p2.y);
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
      context.moveTo(seg.p1.x, seg.p1.y);
      context.lineTo(seg.p2.x, seg.p2.y);
      context.stroke();
    }
  }
}

opticsLab.register("RayPropagationView", RayPropagationView);
