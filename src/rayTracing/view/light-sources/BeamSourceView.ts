/**
 * BeamSourceView.ts – parallel/divergent beam light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import {
  BEAM_SOURCE_BEAM_WIDTH,
  BEAM_SOURCE_BRIGHTNESS_ARM_MAX_M,
  BEAM_SOURCE_BRIGHTNESS_ARM_MIN_M,
  BEAM_SOURCE_DIV_ARM_LENGTH_M,
  BEAM_SOURCE_DIV_LINE_WIDTH,
  BEAM_SOURCE_EMIS_HANDLE_DIST_M,
  BEAM_SOURCE_MAX_EMISSION_DEG,
  BEAM_SOURCE_MIN_EMISSION_THRESHOLD,
  BEAM_SOURCE_MIN_REF_DIST,
  BEAM_SOURCE_SHIELD_WIDTH,
  BRIGHTNESS_CLAMP_MAX,
  BRIGHTNESS_CLAMP_MIN,
  SOURCE_ARM_LINE_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BeamSource } from "../../model/light-sources/BeamSource.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const SHIELD_STROKE = "rgba(120, 95, 30, 0.85)";
const BEAM_STROKE = "rgba(255, 220, 80, 0.92)";
const DIV_STROKE = "rgba(255, 210, 60, 0.50)";
const ARM_STROKE = "rgba(255, 210, 60, 0.55)";

function brightnessToArmLen(b: number): number {
  return BEAM_SOURCE_BRIGHTNESS_ARM_MIN_M + b * (BEAM_SOURCE_BRIGHTNESS_ARM_MAX_M - BEAM_SOURCE_BRIGHTNESS_ARM_MIN_M);
}

function armLenToBrightness(len: number): number {
  return Math.max(
    BRIGHTNESS_CLAMP_MIN,
    Math.min(
      BRIGHTNESS_CLAMP_MAX,
      (len - BEAM_SOURCE_BRIGHTNESS_ARM_MIN_M) / (BEAM_SOURCE_BRIGHTNESS_ARM_MAX_M - BEAM_SOURCE_BRIGHTNESS_ARM_MIN_M),
    ),
  );
}

export class BeamSourceView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly shieldPath: Path;
  private readonly beamPath: Path;
  private readonly divPath: Path;
  private readonly brightnessArmPath: Path;
  private readonly emisArmPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;
  private readonly handleBrightness: Circle;
  private readonly handleEmis: Circle;

  public constructor(
    private readonly source: BeamSource,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.shieldPath = new Path(null, {
      stroke: SHIELD_STROKE,
      lineWidth: BEAM_SOURCE_SHIELD_WIDTH,
      lineCap: "round",
      cursor: "grab",
    });
    this.beamPath = new Path(null, {
      stroke: BEAM_STROKE,
      lineWidth: BEAM_SOURCE_BEAM_WIDTH,
      lineCap: "round",
      cursor: "grab",
    });
    this.divPath = new Path(null, { stroke: DIV_STROKE, lineWidth: BEAM_SOURCE_DIV_LINE_WIDTH });
    this.brightnessArmPath = new Path(null, { stroke: ARM_STROKE, lineWidth: SOURCE_ARM_LINE_WIDTH });
    this.emisArmPath = new Path(null, { stroke: ARM_STROKE, lineWidth: SOURCE_ARM_LINE_WIDTH });

    this.handle1 = createHandle(source.p1, modelViewTransform);
    this.handle2 = createHandle(source.p2, modelViewTransform);
    this.handleBrightness = createHandle(this.computeBrightnessHandlePos(), modelViewTransform);
    this.handleEmis = createHandle(this.computeEmisHandlePos(), modelViewTransform);

    this.addChild(this.shieldPath);
    this.addChild(this.beamPath);
    this.addChild(this.divPath);
    this.addChild(this.brightnessArmPath);
    this.addChild(this.emisArmPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handleBrightness);
    this.addChild(this.handleEmis);

    this.rebuild();

    const translationPoints = [
      {
        get: () => source.p1,
        set: (p: { x: number; y: number }) => {
          source.p1 = p;
        },
      },
      {
        get: () => source.p2,
        set: (p: { x: number; y: number }) => {
          source.p2 = p;
        },
      },
    ] as const;
    const rebuild = () => {
      this.rebuild();
    };

    this.bodyDragListener = attachTranslationDrag(this.shieldPath, translationPoints, rebuild, modelViewTransform);

    attachEndpointDrag(
      this.handle1,
      () => source.p1,
      (p) => {
        source.p1 = p;
      },
      rebuild,
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => source.p2,
      (p) => {
        source.p2 = p;
      },
      rebuild,
      modelViewTransform,
    );

    attachEndpointDrag(
      this.handleBrightness,
      () => this.computeBrightnessHandlePos(),
      (newP) => {
        const { mid, normal } = this.segmentGeometry();
        const proj = (newP.x - mid.x) * normal.x + (newP.y - mid.y) * normal.y;
        source.brightness = armLenToBrightness(Math.abs(proj));
      },
      rebuild,
      modelViewTransform,
    );

    attachEndpointDrag(
      this.handleEmis,
      () => this.computeEmisHandlePos(),
      (newP) => {
        const { mid, normal, along } = this.segmentGeometry();
        const projNormal = (newP.x - mid.x) * normal.x + (newP.y - mid.y) * normal.y;
        const projAlong = (newP.x - mid.x) * along.x + (newP.y - mid.y) * along.y;
        const refDist = Math.max(BEAM_SOURCE_MIN_REF_DIST, Math.abs(projNormal));
        const halfAngleDeg = (Math.atan2(Math.abs(projAlong), refDist) * 180) / Math.PI;
        source.emisAngle = Math.min(BEAM_SOURCE_MAX_EMISSION_DEG, Math.max(0, halfAngleDeg));
      },
      rebuild,
      modelViewTransform,
    );
  }

  private segmentGeometry(): {
    mid: { x: number; y: number };
    normal: { x: number; y: number };
    along: { x: number; y: number };
  } {
    const { p1, p2 } = this.source;
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const along = { x: dx / len, y: dy / len };
    const normal = { x: -along.y, y: along.x };
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    return { mid, normal, along };
  }

  private computeBrightnessHandlePos(): { x: number; y: number } {
    const { mid, normal } = this.segmentGeometry();
    const len = brightnessToArmLen(this.source.brightness);
    return { x: mid.x + normal.x * len, y: mid.y + normal.y * len };
  }

  private computeEmisHandlePos(): { x: number; y: number } {
    const { mid, normal, along } = this.segmentGeometry();
    const halfAngle = (this.source.emisAngle / 180) * Math.PI;
    const tangentialOffset = Math.tan(halfAngle) * BEAM_SOURCE_EMIS_HANDLE_DIST_M;
    return {
      x: mid.x + normal.x * BEAM_SOURCE_EMIS_HANDLE_DIST_M + along.x * tangentialOffset,
      y: mid.y + normal.y * BEAM_SOURCE_EMIS_HANDLE_DIST_M + along.y * tangentialOffset,
    };
  }

  private rebuild(): void {
    const modelViewTransform = this.modelViewTransform;
    const { p1, p2, emisAngle } = this.source;
    const { mid, normal } = this.segmentGeometry();

    const vx1 = modelViewTransform.modelToViewX(p1.x),
      vy1 = modelViewTransform.modelToViewY(p1.y);
    const vx2 = modelViewTransform.modelToViewX(p2.x),
      vy2 = modelViewTransform.modelToViewY(p2.y);
    const vmx = modelViewTransform.modelToViewX(mid.x),
      vmy = modelViewTransform.modelToViewY(mid.y);

    // Aperture line
    const aperture = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.shieldPath.shape = aperture;
    this.beamPath.shape = aperture;

    // Divergence indicator
    if (emisAngle > BEAM_SOURCE_MIN_EMISSION_THRESHOLD) {
      const halfAngle = (emisAngle / 180) * Math.PI;
      const baseAngle = Math.atan2(normal.y, normal.x);
      const divShape = new Shape();
      const p3mx = mid.x + Math.cos(baseAngle + halfAngle) * BEAM_SOURCE_DIV_ARM_LENGTH_M;
      const p3my = mid.y + Math.sin(baseAngle + halfAngle) * BEAM_SOURCE_DIV_ARM_LENGTH_M;
      const p4mx = mid.x + Math.cos(baseAngle - halfAngle) * BEAM_SOURCE_DIV_ARM_LENGTH_M;
      const p4my = mid.y + Math.sin(baseAngle - halfAngle) * BEAM_SOURCE_DIV_ARM_LENGTH_M;
      divShape.moveTo(vmx, vmy).lineTo(modelViewTransform.modelToViewX(p3mx), modelViewTransform.modelToViewY(p3my));
      divShape.moveTo(vmx, vmy).lineTo(modelViewTransform.modelToViewX(p4mx), modelViewTransform.modelToViewY(p4my));
      this.divPath.shape = divShape;
    } else {
      this.divPath.shape = null;
    }

    // Brightness arm
    const bPos = this.computeBrightnessHandlePos();
    const vbx = modelViewTransform.modelToViewX(bPos.x),
      vby = modelViewTransform.modelToViewY(bPos.y);
    this.brightnessArmPath.shape = new Shape().moveTo(vmx, vmy).lineTo(vbx, vby);
    this.handleBrightness.x = vbx;
    this.handleBrightness.y = vby;

    // Emission-angle arm
    const ePos = this.computeEmisHandlePos();
    const vex = modelViewTransform.modelToViewX(ePos.x),
      vey = modelViewTransform.modelToViewY(ePos.y);
    this.emisArmPath.shape = new Shape().moveTo(vmx, vmy).lineTo(vex, vey);
    this.handleEmis.x = vex;
    this.handleEmis.y = vey;

    // Endpoint handles
    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
  }
}

opticsLab.register("BeamSourceView", BeamSourceView);
