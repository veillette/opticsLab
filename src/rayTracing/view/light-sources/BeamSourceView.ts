/**
 * BeamSourceView.ts – parallel/divergent beam light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 */

import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BeamSource } from "../../model/light-sources/BeamSource.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const SHIELD_STROKE = "rgba(120, 95, 30, 0.85)";
const SHIELD_WIDTH = 6;
const BEAM_STROKE = "rgba(255, 220, 80, 0.92)";
const BEAM_WIDTH = 3;
const DIV_STROKE = "rgba(255, 210, 60, 0.50)";
const DIV_LINE_WIDTH = 1.2;
const ARM_STROKE = "rgba(255, 210, 60, 0.55)";
const ARM_LINE_WIDTH = 1;

// Model-space distances (metres)
const DIV_ARM_LENGTH = 0.80;       // m (was 80 px)
const BRIGHTNESS_ARM_MIN = 0.20;   // m (was 20 px)
const BRIGHTNESS_ARM_MAX = 0.72;   // m (was 72 px)
const EMIS_HANDLE_NORMAL_DIST = 0.55; // m (was 55 px)

function brightnessToArmLen(b: number): number {
  return BRIGHTNESS_ARM_MIN + b * (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN);
}

function armLenToBrightness(len: number): number {
  return Math.max(0.01, Math.min(1.0, (len - BRIGHTNESS_ARM_MIN) / (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN)));
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

  public constructor(private readonly source: BeamSource, private readonly mvt: ModelViewTransform2) {
    super();

    this.shieldPath = new Path(null, { stroke: SHIELD_STROKE, lineWidth: SHIELD_WIDTH, lineCap: "round", cursor: "grab" });
    this.beamPath = new Path(null, { stroke: BEAM_STROKE, lineWidth: BEAM_WIDTH, lineCap: "round", cursor: "grab" });
    this.divPath = new Path(null, { stroke: DIV_STROKE, lineWidth: DIV_LINE_WIDTH });
    this.brightnessArmPath = new Path(null, { stroke: ARM_STROKE, lineWidth: ARM_LINE_WIDTH });
    this.emisArmPath = new Path(null, { stroke: ARM_STROKE, lineWidth: ARM_LINE_WIDTH });

    this.handle1 = createHandle(source.p1, mvt);
    this.handle2 = createHandle(source.p2, mvt);
    this.handleBrightness = createHandle(this.computeBrightnessHandlePos(), mvt);
    this.handleEmis = createHandle(this.computeEmisHandlePos(), mvt);

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
      { get: () => source.p1, set: (p: { x: number; y: number }) => { source.p1 = p; } },
      { get: () => source.p2, set: (p: { x: number; y: number }) => { source.p2 = p; } },
    ] as const;
    const rebuild = () => { this.rebuild(); };

    this.bodyDragListener = attachTranslationDrag(this.shieldPath, translationPoints, rebuild, mvt);

    attachEndpointDrag(this.handle1, () => source.p1, (p) => { source.p1 = p; }, rebuild, mvt);
    attachEndpointDrag(this.handle2, () => source.p2, (p) => { source.p2 = p; }, rebuild, mvt);

    attachEndpointDrag(
      this.handleBrightness,
      () => this.computeBrightnessHandlePos(),
      (newP) => {
        const { mid, normal } = this.segmentGeometry();
        const proj = (newP.x - mid.x) * normal.x + (newP.y - mid.y) * normal.y;
        source.brightness = armLenToBrightness(Math.abs(proj));
      },
      rebuild,
      mvt,
    );

    attachEndpointDrag(
      this.handleEmis,
      () => this.computeEmisHandlePos(),
      (newP) => {
        const { mid, normal, along } = this.segmentGeometry();
        const projNormal = (newP.x - mid.x) * normal.x + (newP.y - mid.y) * normal.y;
        const projAlong = (newP.x - mid.x) * along.x + (newP.y - mid.y) * along.y;
        const refDist = Math.max(1e-6, Math.abs(projNormal));
        const halfAngleDeg = (Math.atan2(Math.abs(projAlong), refDist) * 180) / Math.PI;
        source.emisAngle = Math.min(90, Math.max(0, halfAngleDeg));
      },
      rebuild,
      mvt,
    );
  }

  private segmentGeometry(): { mid: { x: number; y: number }; normal: { x: number; y: number }; along: { x: number; y: number } } {
    const { p1, p2 } = this.source;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
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
    const tangentialOffset = Math.tan(halfAngle) * EMIS_HANDLE_NORMAL_DIST;
    return {
      x: mid.x + normal.x * EMIS_HANDLE_NORMAL_DIST + along.x * tangentialOffset,
      y: mid.y + normal.y * EMIS_HANDLE_NORMAL_DIST + along.y * tangentialOffset,
    };
  }

  private rebuild(): void {
    const mvt = this.mvt;
    const { p1, p2, emisAngle } = this.source;
    const { mid, normal } = this.segmentGeometry();

    const vx1 = mvt.modelToViewX(p1.x), vy1 = mvt.modelToViewY(p1.y);
    const vx2 = mvt.modelToViewX(p2.x), vy2 = mvt.modelToViewY(p2.y);
    const vmx = mvt.modelToViewX(mid.x), vmy = mvt.modelToViewY(mid.y);

    // Aperture line
    const aperture = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.shieldPath.shape = aperture;
    this.beamPath.shape = aperture;

    // Divergence indicator
    if (emisAngle > 1e-4) {
      const halfAngle = (emisAngle / 180) * Math.PI;
      const baseAngle = Math.atan2(normal.y, normal.x);
      const divShape = new Shape();
      const p3mx = mid.x + Math.cos(baseAngle + halfAngle) * DIV_ARM_LENGTH;
      const p3my = mid.y + Math.sin(baseAngle + halfAngle) * DIV_ARM_LENGTH;
      const p4mx = mid.x + Math.cos(baseAngle - halfAngle) * DIV_ARM_LENGTH;
      const p4my = mid.y + Math.sin(baseAngle - halfAngle) * DIV_ARM_LENGTH;
      divShape.moveTo(vmx, vmy).lineTo(mvt.modelToViewX(p3mx), mvt.modelToViewY(p3my));
      divShape.moveTo(vmx, vmy).lineTo(mvt.modelToViewX(p4mx), mvt.modelToViewY(p4my));
      this.divPath.shape = divShape;
    } else {
      this.divPath.shape = null;
    }

    // Brightness arm
    const bPos = this.computeBrightnessHandlePos();
    const vbx = mvt.modelToViewX(bPos.x), vby = mvt.modelToViewY(bPos.y);
    this.brightnessArmPath.shape = new Shape().moveTo(vmx, vmy).lineTo(vbx, vby);
    this.handleBrightness.x = vbx; this.handleBrightness.y = vby;

    // Emission-angle arm
    const ePos = this.computeEmisHandlePos();
    const vex = mvt.modelToViewX(ePos.x), vey = mvt.modelToViewY(ePos.y);
    this.emisArmPath.shape = new Shape().moveTo(vmx, vmy).lineTo(vex, vey);
    this.handleEmis.x = vex; this.handleEmis.y = vey;

    // Endpoint handles
    this.handle1.x = vx1; this.handle1.y = vy1;
    this.handle2.x = vx2; this.handle2.y = vy2;
  }
}

opticsLab.register("BeamSourceView", BeamSourceView);
