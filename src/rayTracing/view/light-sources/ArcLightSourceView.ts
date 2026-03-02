/**
 * ArcLightSourceView.ts – arc (cone) light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 *
 * Arc/spoke shapes are computed by sampling points in model space and
 * converting each point to view space via the modelViewTransform, which correctly handles
 * the y-axis inversion without requiring manual angle-sign adjustments.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, RichDragListener, type RichDragListenerOptions } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ArcLightSource } from "../../model/light-sources/ArcLightSource.js";
import { attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Visual constants ──────────────────────────────────────────────────────────

/** Rim radius in model metres (0.40 m = 40 px at 100 px/m). */
const RIM_RADIUS = 0.4;

const GLOW_RADIUS = 12; // px – fixed visual size
const GLOW_FILL = "rgba(255, 220, 80, 0.28)";
const GLOW_STROKE = "rgba(255, 220, 80, 0.90)";
const GLOW_STROKE_WIDTH = 2;

const SECTOR_FILL = "rgba(255, 215, 60, 0.13)";
const SECTOR_STROKE = "rgba(255, 215, 60, 0.65)";
const SECTOR_LINE_WIDTH = 1.5;

const RIM_STROKE = "rgba(255, 215, 60, 0.25)";
const RIM_LINE_WIDTH = 1;

const BOUNDARY_STROKE = "rgba(255, 215, 60, 0.55)";
const BOUNDARY_LINE_WIDTH = 1.2;

const SPOKE_STROKE = "rgba(255, 210, 60, 0.55)";
const SPOKE_LINE_WIDTH = 1.1;
const SPOKE_COUNT = 12;

/** Number of line segments used to approximate the emission sector arc. */
const SECTOR_SAMPLE_N = 48;

// ── Helper: build an arc (polyline) by sampling in model space ───────────────

function arcPoints(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  n: number,
): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= n; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / n);
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

// ── Helper: attach rim-constrained drag ─────────────────────────────────────

function attachCircleDrag(
  handle: Circle,
  source: ArcLightSource,
  getHandleAngle: () => number,
  onAngleChange: (newAngle: number) => void,
  rebuild: () => void,
  modelViewTransform: ModelViewTransform2,
): void {
  handle.cursor = "pointer";
  handle.addInputListener(
    new RichDragListener({
      tandem: Tandem.OPT_OUT,
      transform: modelViewTransform,
      drag: (_event, listener) => {
        const { x: dx, y: dy } = listener.modelDelta; // model metres
        const a = getHandleAngle();
        const hx = source.position.x + Math.cos(a) * RIM_RADIUS + dx;
        const hy = source.position.y + Math.sin(a) * RIM_RADIUS + dy;
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

  public constructor(
    private readonly source: ArcLightSource,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.sectorPath = new Path(null, { fill: SECTOR_FILL, stroke: SECTOR_STROKE, lineWidth: SECTOR_LINE_WIDTH });
    this.rimPath = new Path(null, { stroke: RIM_STROKE, lineWidth: RIM_LINE_WIDTH });
    this.spokePath = new Path(null, { stroke: SPOKE_STROKE, lineWidth: SPOKE_LINE_WIDTH });
    this.boundaryPath = new Path(null, { stroke: BOUNDARY_STROKE, lineWidth: BOUNDARY_LINE_WIDTH, lineCap: "round" });
    this.glowPath = new Path(null, {
      fill: GLOW_FILL,
      stroke: GLOW_STROKE,
      lineWidth: GLOW_STROKE_WIDTH,
      cursor: "grab",
    });

    this.dirHandle = createHandle(this.dirHandlePos(), modelViewTransform);
    this.spreadHandle = createHandle(this.spreadHandlePos(), modelViewTransform);

    this.addChild(this.sectorPath);
    this.addChild(this.rimPath);
    this.addChild(this.spokePath);
    this.addChild(this.boundaryPath);
    this.addChild(this.glowPath);
    this.addChild(this.dirHandle);
    this.addChild(this.spreadHandle);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.glowPath,
      [
        {
          get: () => source.position,
          set: (p) => {
            source.position = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );

    attachCircleDrag(
      this.dirHandle,
      source,
      () => source.direction,
      (newAlpha) => {
        source.direction = newAlpha;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );

    attachCircleDrag(
      this.spreadHandle,
      source,
      () => source.direction + source.emissionAngle / 2,
      (newHandleAngle) => {
        let diff = newHandleAngle - source.direction;
        diff = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const halfBeta = Math.min(diff, 2 * Math.PI - diff);
        source.emissionAngle = Math.max(0.01, halfBeta * 2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

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

  public rebuild(): void {
    const modelViewTransform = this.modelViewTransform;
    const {
      position: { x, y },
      direction: alpha,
      emissionAngle: beta,
    } = this.source;
    const halfBeta = beta / 2;
    const startAngle = alpha - halfBeta;
    const endAngle = alpha + halfBeta;
    const isFullCircle = beta >= 2 * Math.PI - 1e-4;

    const vcx = modelViewTransform.modelToViewX(x);
    const vcy = modelViewTransform.modelToViewY(y);
    const vRim = Math.abs(modelViewTransform.modelToViewDeltaX(RIM_RADIUS)); // px

    // ── Rim circle ──────────────────────────────────────────────────────────
    this.rimPath.shape = new Shape().circle(vcx, vcy, vRim);

    // ── Emission sector ─────────────────────────────────────────────────────
    if (isFullCircle) {
      this.sectorPath.shape = new Shape().circle(vcx, vcy, vRim);
    } else {
      const sectorPts = arcPoints(x, y, RIM_RADIUS, startAngle, endAngle, SECTOR_SAMPLE_N);
      const sShape = new Shape();
      sShape.moveTo(vcx, vcy);
      for (const p of sectorPts) {
        sShape.lineTo(modelViewTransform.modelToViewX(p.x), modelViewTransform.modelToViewY(p.y));
      }
      sShape.close();
      this.sectorPath.shape = sShape;
    }

    // ── Boundary lines ──────────────────────────────────────────────────────
    if (!isFullCircle) {
      const bShape = new Shape()
        .moveTo(vcx, vcy)
        .lineTo(
          modelViewTransform.modelToViewX(x + Math.cos(startAngle) * RIM_RADIUS),
          modelViewTransform.modelToViewY(y + Math.sin(startAngle) * RIM_RADIUS),
        )
        .moveTo(vcx, vcy)
        .lineTo(
          modelViewTransform.modelToViewX(x + Math.cos(endAngle) * RIM_RADIUS),
          modelViewTransform.modelToViewY(y + Math.sin(endAngle) * RIM_RADIUS),
        );
      this.boundaryPath.shape = bShape;
    } else {
      this.boundaryPath.shape = null;
    }

    // ── Spokes ───────────────────────────────────────────────────────────────
    const fraction = Math.min(1, beta / (2 * Math.PI));
    const numSpokes = Math.max(2, Math.round(SPOKE_COUNT * fraction));
    const step = beta / numSpokes;
    const scale = Math.abs(modelViewTransform.modelToViewDeltaX(1)); // px/m = 100
    const innerR = GLOW_RADIUS / scale; // model metres for GLOW_RADIUS px
    const outerR = (vRim - 4) / scale; // model metres for (vRim-4) px
    const spokeShape = new Shape();
    for (let i = 0; i <= numSpokes; i++) {
      const a = startAngle + i * step;
      const imx = x + Math.cos(a) * innerR,
        imy = y + Math.sin(a) * innerR;
      const omx = x + Math.cos(a) * outerR,
        omy = y + Math.sin(a) * outerR;
      spokeShape.moveTo(modelViewTransform.modelToViewX(imx), modelViewTransform.modelToViewY(imy));
      spokeShape.lineTo(modelViewTransform.modelToViewX(omx), modelViewTransform.modelToViewY(omy));
    }
    this.spokePath.shape = spokeShape;

    // ── Glow disc (fixed pixel radius) ─────────────────────────────────────
    this.glowPath.shape = new Shape().circle(vcx, vcy, GLOW_RADIUS);

    // ── Handles ─────────────────────────────────────────────────────────────
    const dp = this.dirHandlePos();
    this.dirHandle.x = modelViewTransform.modelToViewX(dp.x);
    this.dirHandle.y = modelViewTransform.modelToViewY(dp.y);

    const sp = this.spreadHandlePos();
    this.spreadHandle.x = modelViewTransform.modelToViewX(sp.x);
    this.spreadHandle.y = modelViewTransform.modelToViewY(sp.y);
  }
}

opticsLab.register("ArcLightSourceView", ArcLightSourceView);
