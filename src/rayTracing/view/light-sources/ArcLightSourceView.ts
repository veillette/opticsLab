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
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  ARC_SOURCE_BOUNDARY_LINE_WIDTH,
  ARC_SOURCE_FULL_CIRCLE_GAP,
  ARC_SOURCE_GLOW_RADIUS_PX,
  ARC_SOURCE_MIN_EMISSION_ANGLE,
  ARC_SOURCE_MIN_SPOKE_COUNT,
  ARC_SOURCE_RIM_LINE_WIDTH,
  ARC_SOURCE_RIM_RADIUS_M,
  ARC_SOURCE_SECTOR_LINE_WIDTH,
  ARC_SOURCE_SECTOR_SAMPLE_N,
  ARC_SOURCE_SPOKE_COUNT,
  ARC_SOURCE_SPOKE_LINE_WIDTH,
  ARC_SOURCE_SPOKE_OUTER_OFFSET_PX,
  SOURCE_GLOW_STROKE_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ArcLightSource } from "../../model/light-sources/ArcLightSource.js";
import { attachTranslationDrag, createHandle } from "../ViewHelpers.js";

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
        const hx = source.position.x + Math.cos(a) * ARC_SOURCE_RIM_RADIUS_M + dx;
        const hy = source.position.y + Math.sin(a) * ARC_SOURCE_RIM_RADIUS_M + dy;
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

    this.sectorPath = new Path(null, {
      fill: OpticsLabColors.arcSourceSectorFillProperty,
      stroke: OpticsLabColors.arcSourceSectorStrokeProperty,
      lineWidth: ARC_SOURCE_SECTOR_LINE_WIDTH,
    });
    this.rimPath = new Path(null, {
      stroke: OpticsLabColors.arcSourceRimStrokeProperty,
      lineWidth: ARC_SOURCE_RIM_LINE_WIDTH,
    });
    this.spokePath = new Path(null, {
      stroke: OpticsLabColors.arcSourceSpokeStrokeProperty,
      lineWidth: ARC_SOURCE_SPOKE_LINE_WIDTH,
    });
    this.boundaryPath = new Path(null, {
      stroke: OpticsLabColors.arcSourceBoundaryStrokeProperty,
      lineWidth: ARC_SOURCE_BOUNDARY_LINE_WIDTH,
      lineCap: "round",
    });
    this.glowPath = new Path(null, {
      fill: OpticsLabColors.arcSourceGlowFillProperty,
      stroke: OpticsLabColors.arcSourceGlowStrokeProperty,
      lineWidth: SOURCE_GLOW_STROKE_WIDTH,
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
        source.emissionAngle = Math.max(ARC_SOURCE_MIN_EMISSION_ANGLE, halfBeta * 2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private dirHandlePos(): { x: number; y: number } {
    return {
      x: this.source.position.x + Math.cos(this.source.direction) * ARC_SOURCE_RIM_RADIUS_M,
      y: this.source.position.y + Math.sin(this.source.direction) * ARC_SOURCE_RIM_RADIUS_M,
    };
  }

  private spreadHandlePos(): { x: number; y: number } {
    const angle = this.source.direction + this.source.emissionAngle / 2;
    return {
      x: this.source.position.x + Math.cos(angle) * ARC_SOURCE_RIM_RADIUS_M,
      y: this.source.position.y + Math.sin(angle) * ARC_SOURCE_RIM_RADIUS_M,
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
    const isFullCircle = beta >= 2 * Math.PI - ARC_SOURCE_FULL_CIRCLE_GAP;

    const vcx = modelViewTransform.modelToViewX(x);
    const vcy = modelViewTransform.modelToViewY(y);
    const vRim = Math.abs(modelViewTransform.modelToViewDeltaX(ARC_SOURCE_RIM_RADIUS_M)); // px

    // ── Rim circle ──────────────────────────────────────────────────────────
    this.rimPath.shape = new Shape().circle(vcx, vcy, vRim);

    // ── Emission sector ─────────────────────────────────────────────────────
    if (isFullCircle) {
      this.sectorPath.shape = new Shape().circle(vcx, vcy, vRim);
    } else {
      const sectorPts = arcPoints(x, y, ARC_SOURCE_RIM_RADIUS_M, startAngle, endAngle, ARC_SOURCE_SECTOR_SAMPLE_N);
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
          modelViewTransform.modelToViewX(x + Math.cos(startAngle) * ARC_SOURCE_RIM_RADIUS_M),
          modelViewTransform.modelToViewY(y + Math.sin(startAngle) * ARC_SOURCE_RIM_RADIUS_M),
        )
        .moveTo(vcx, vcy)
        .lineTo(
          modelViewTransform.modelToViewX(x + Math.cos(endAngle) * ARC_SOURCE_RIM_RADIUS_M),
          modelViewTransform.modelToViewY(y + Math.sin(endAngle) * ARC_SOURCE_RIM_RADIUS_M),
        );
      this.boundaryPath.shape = bShape;
    } else {
      this.boundaryPath.shape = null;
    }

    // ── Spokes ───────────────────────────────────────────────────────────────
    const fraction = Math.min(1, beta / (2 * Math.PI));
    const numSpokes = Math.max(ARC_SOURCE_MIN_SPOKE_COUNT, Math.round(ARC_SOURCE_SPOKE_COUNT * fraction));
    const step = beta / numSpokes;
    const scale = Math.abs(modelViewTransform.modelToViewDeltaX(1)); // px/m = 100
    const innerR = ARC_SOURCE_GLOW_RADIUS_PX / scale; // model metres for glow-radius px
    const outerR = (vRim - ARC_SOURCE_SPOKE_OUTER_OFFSET_PX) / scale; // model metres for (vRim-offset) px
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
    this.glowPath.shape = new Shape().circle(vcx, vcy, ARC_SOURCE_GLOW_RADIUS_PX);

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
