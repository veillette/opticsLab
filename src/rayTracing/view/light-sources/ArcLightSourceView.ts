/**
 * ArcLightSourceView.ts
 *
 * Scenery node for an ArcLightSource — a point source that emits only within
 * a finite angular cone [α − β/2, α + β/2].
 *
 * Visual elements
 * ───────────────
 *   • Glow disc (center) .............. drag → translate source
 *   • Circle outline ................... shows the rim where handles live
 *   • Filled emission sector ........... highlights the active cone
 *   • Boundary radial lines ............ at α ± β/2
 *   • Spokes within the cone ........... mimics PointSourceView style
 *   • Direction handle (at angle α) .... drag along rim → rotate cone (changes α)
 *   • Spread handle (at angle α + β/2) . drag along rim → widen/narrow cone (changes β)
 *
 * Interaction model
 * ─────────────────
 * Both handles move freely under the pointer but their model interpretation is
 * always projected back onto the circle rim. On each drag step we read the
 * unconstrained cursor delta, add it to the current (rim-snapped) handle
 * position, compute the angle of that result relative to the source centre,
 * and update either α or β accordingly.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, RichDragListener, type RichDragListenerOptions } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ArcLightSource } from "../../model/light-sources/ArcLightSource.js";
import { attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Visual constants ──────────────────────────────────────────────────────────

/** Radius of the rim circle on which the drag handles sit. */
const RIM_RADIUS = 40;

const GLOW_RADIUS = 12;
const GLOW_FILL = "rgba(255, 220, 80, 0.28)";
const GLOW_STROKE = "rgba(255, 220, 80, 0.90)";
const GLOW_STROKE_WIDTH = 2;

/** Emission sector fill (warm yellow, semi-transparent). */
const SECTOR_FILL = "rgba(255, 215, 60, 0.13)";
const SECTOR_STROKE = "rgba(255, 215, 60, 0.65)";
const SECTOR_LINE_WIDTH = 1.5;

/** The full rim circle (shows where handles can move). */
const RIM_STROKE = "rgba(255, 215, 60, 0.25)";
const RIM_LINE_WIDTH = 1;

/** Radial boundary lines. */
const BOUNDARY_STROKE = "rgba(255, 215, 60, 0.55)";
const BOUNDARY_LINE_WIDTH = 1.2;

/** Spokes inside the emission zone. */
const SPOKE_STROKE = "rgba(255, 210, 60, 0.55)";
const SPOKE_LINE_WIDTH = 1.1;
const SPOKE_COUNT = 12; // max spokes across full circle; arc gets proportional count
const SPOKE_INNER = GLOW_RADIUS;
const SPOKE_OUTER = RIM_RADIUS - 4;

// ── Helper ────────────────────────────────────────────────────────────────────

/** Attach a drag listener that constrains a handle to the source circle rim. */
function attachCircleDrag(
  handle: Circle,
  source: ArcLightSource,
  getHandleAngle: () => number,
  onAngleChange: (newAngle: number) => void,
  rebuild: () => void,
): void {
  handle.cursor = "pointer";
  handle.addInputListener(
    new RichDragListener({
      tandem: Tandem.OPT_OUT,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta;
        // Current rim position of the handle
        const a = getHandleAngle();
        const hx = source.position.x + Math.cos(a) * RIM_RADIUS + dx;
        const hy = source.position.y + Math.sin(a) * RIM_RADIUS + dy;
        // Project back onto the circle to get the new angle
        const newAngle = Math.atan2(hy - source.position.y, hx - source.position.x);
        onAngleChange(newAngle);
        rebuild();
      },
    } as RichDragListenerOptions),
  );
}

// ── View class ────────────────────────────────────────────────────────────────

export class ArcLightSourceView extends Node {
  public readonly bodyDragListener: RichDragListener;

  private readonly glowPath: Path;
  private readonly rimPath: Path;
  private readonly sectorPath: Path;
  private readonly spokePath: Path;
  private readonly boundaryPath: Path;
  private readonly dirHandle: Circle;
  private readonly spreadHandle: Circle;

  public constructor(private readonly source: ArcLightSource) {
    super();

    // ── Visual nodes (back to front) ─────────────────────────────────────────
    this.sectorPath = new Path(null, {
      fill: SECTOR_FILL,
      stroke: SECTOR_STROKE,
      lineWidth: SECTOR_LINE_WIDTH,
    });
    this.rimPath = new Path(null, {
      stroke: RIM_STROKE,
      lineWidth: RIM_LINE_WIDTH,
    });
    this.spokePath = new Path(null, {
      stroke: SPOKE_STROKE,
      lineWidth: SPOKE_LINE_WIDTH,
    });
    this.boundaryPath = new Path(null, {
      stroke: BOUNDARY_STROKE,
      lineWidth: BOUNDARY_LINE_WIDTH,
      lineCap: "round",
    });
    this.glowPath = new Path(null, {
      fill: GLOW_FILL,
      stroke: GLOW_STROKE,
      lineWidth: GLOW_STROKE_WIDTH,
      cursor: "grab",
    });

    this.dirHandle = createHandle(this.dirHandlePos());
    this.spreadHandle = createHandle(this.spreadHandlePos());

    this.addChild(this.sectorPath);
    this.addChild(this.rimPath);
    this.addChild(this.spokePath);
    this.addChild(this.boundaryPath);
    this.addChild(this.glowPath);
    this.addChild(this.dirHandle);
    this.addChild(this.spreadHandle);

    this.rebuild();

    // ── Body drag → translate entire source ───────────────────────────────
    this.bodyDragListener = attachTranslationDrag(
      this.glowPath,
      [{ get: () => source.position, set: (p) => { source.position = p; } }],
      () => { this.rebuild(); },
    );

    // ── Direction handle drag → rotate α, keep β ─────────────────────────
    attachCircleDrag(
      this.dirHandle,
      source,
      () => source.direction,
      (newAlpha) => { source.direction = newAlpha; },
      () => { this.rebuild(); },
    );

    // ── Spread handle drag → widen/narrow β, keep α ──────────────────────
    // The handle sits at α + β/2. We compute how far it is (angularly) from α.
    attachCircleDrag(
      this.spreadHandle,
      source,
      () => source.direction + source.emissionAngle / 2,
      (newHandleAngle) => {
        // Angular distance from direction to new handle angle (always ≥ 0)
        let diff = newHandleAngle - source.direction;
        // Normalize to [0, 2π)
        diff = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        // Use the shorter arc so the handle stays on the nearest side
        const halfBeta = Math.min(diff, 2 * Math.PI - diff);
        source.emissionAngle = Math.max(0.01, halfBeta * 2);
      },
      () => { this.rebuild(); },
    );
  }

  // ── Geometry helpers ──────────────────────────────────────────────────────

  private dirHandlePos(): { x: number; y: number } {
    return {
      x: this.source.position.x + Math.cos(this.source.direction) * RIM_RADIUS,
      y: this.source.position.y + Math.sin(this.source.direction) * RIM_RADIUS,
    };
  }

  private spreadHandlePos(): { x: number; y: number } {
    const angle = this.source.direction + this.source.emissionAngle / 2;
    return {
      x: this.source.position.x + Math.cos(angle) * RIM_RADIUS,
      y: this.source.position.y + Math.sin(angle) * RIM_RADIUS,
    };
  }

  // ── Rebuild ───────────────────────────────────────────────────────────────

  public rebuild(): void {
    const { position: { x, y }, direction: alpha, emissionAngle: beta } = this.source;
    const halfBeta = beta / 2;
    const startAngle = alpha - halfBeta;
    const endAngle = alpha + halfBeta;
    const isFullCircle = beta >= 2 * Math.PI - 1e-4;

    // ── Rim circle ──────────────────────────────────────────────────────────
    this.rimPath.shape = new Shape().circle(x, y, RIM_RADIUS);

    // ── Emission sector (pie-slice) ─────────────────────────────────────────
    if (isFullCircle) {
      // Full circle — same shape as rim
      this.sectorPath.shape = new Shape().circle(x, y, RIM_RADIUS);
    } else {
      const sector = new Shape()
        .moveTo(x, y)
        // arc from startAngle to endAngle in the +angle direction (CW on screen)
        .arc(x, y, RIM_RADIUS, startAngle, endAngle, false)
        .close();
      this.sectorPath.shape = sector;
    }

    // ── Boundary lines (center → rim at α ± β/2) ───────────────────────────
    if (!isFullCircle) {
      const bShape = new Shape()
        .moveTo(x, y)
        .lineTo(x + Math.cos(startAngle) * RIM_RADIUS, y + Math.sin(startAngle) * RIM_RADIUS)
        .moveTo(x, y)
        .lineTo(x + Math.cos(endAngle) * RIM_RADIUS, y + Math.sin(endAngle) * RIM_RADIUS);
      this.boundaryPath.shape = bShape;
    } else {
      this.boundaryPath.shape = null;
    }

    // ── Spokes within emission zone ─────────────────────────────────────────
    const fraction = Math.min(1, beta / (2 * Math.PI));
    const numSpokes = Math.max(2, Math.round(SPOKE_COUNT * fraction));
    const step = beta / numSpokes;
    const spokeShape = new Shape();
    for (let i = 0; i <= numSpokes; i++) {
      const a = startAngle + i * step;
      spokeShape
        .moveTo(x + Math.cos(a) * SPOKE_INNER, y + Math.sin(a) * SPOKE_INNER)
        .lineTo(x + Math.cos(a) * SPOKE_OUTER, y + Math.sin(a) * SPOKE_OUTER);
    }
    this.spokePath.shape = spokeShape;

    // ── Glow disc ───────────────────────────────────────────────────────────
    this.glowPath.shape = new Shape().circle(x, y, GLOW_RADIUS);

    // ── Reposition handles ──────────────────────────────────────────────────
    const dp = this.dirHandlePos();
    this.dirHandle.x = dp.x;
    this.dirHandle.y = dp.y;

    const sp = this.spreadHandlePos();
    this.spreadHandle.x = sp.x;
    this.spreadHandle.y = sp.y;
  }
}

opticsLab.register("ArcLightSourceView", ArcLightSourceView);
