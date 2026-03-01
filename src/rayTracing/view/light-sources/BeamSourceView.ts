/**
 * BeamSourceView.ts
 *
 * Scenery node for a parallel / divergent beam light source.
 * The beam aperture is the segment from p1 to p2. Rays emit perpendicular
 * to that segment (with optional divergence).
 *
 * Visual elements:
 *   • Shield (thick dark back-line)    – drag to translate the whole beam
 *   • Beam line (bright yellow)        – drag to translate the whole beam
 *   • Divergence indicator lines       – two dashed fans from the midpoint
 *   • Brightness arm + handle          – drag to adjust brightness (0.01–1.0)
 *   • Emission-angle arm + handle      – drag to adjust emisAngle (0–90°)
 *   • p1 / p2 endpoint handles         – drag to resize / rotate the aperture
 *
 * The brightness handle sits perpendicular to the beam at the midpoint.
 * The emission-angle handle shows the half-angle cone opening.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BeamSource } from "../../model/light-sources/BeamSource.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Visual constants ──────────────────────────────────────────────────────────
const SHIELD_STROKE = "rgba(120, 95, 30, 0.85)";
const SHIELD_WIDTH = 6;

const BEAM_STROKE = "rgba(255, 220, 80, 0.92)";
const BEAM_WIDTH = 3;

const DIV_STROKE = "rgba(255, 210, 60, 0.50)";
const DIV_LINE_WIDTH = 1.2;
const DIV_ARM_LENGTH = 80; // px, length of divergence indicator lines

const ARM_STROKE = "rgba(255, 210, 60, 0.55)";
const ARM_LINE_WIDTH = 1;

// Brightness arm – perpendicular to beam, from midpoint
const BRIGHTNESS_ARM_MIN = 20; // px when brightness ≈ 0
const BRIGHTNESS_ARM_MAX = 72; // px when brightness = 1

// Emission-angle handle – along the normal direction, tangentially offset
// to show half-angle. We fix the radial distance and let the tangential
// component encode the angle.
const EMIS_HANDLE_NORMAL_DIST = 55; // fixed radial distance from midpoint

// ── Helpers ───────────────────────────────────────────────────────────────────
function brightnessToArmLen(b: number): number {
  return BRIGHTNESS_ARM_MIN + b * (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN);
}

function armLenToBrightness(len: number): number {
  return Math.max(0.01, Math.min(1.0, (len - BRIGHTNESS_ARM_MIN) / (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN)));
}

// ── View class ────────────────────────────────────────────────────────────────
export class BeamSourceView extends Node {
  private readonly shieldPath: Path;
  private readonly beamPath: Path;
  private readonly divPath: Path;
  private readonly brightnessArmPath: Path;
  private readonly emisArmPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;
  private readonly handleBrightness: Circle;
  private readonly handleEmis: Circle;

  public constructor(private readonly source: BeamSource) {
    super();

    // ── Visual nodes ────────────────────────────────────────────────────────
    this.shieldPath = new Path(null, {
      stroke: SHIELD_STROKE,
      lineWidth: SHIELD_WIDTH,
      lineCap: "round",
      cursor: "grab",
    });
    this.beamPath = new Path(null, {
      stroke: BEAM_STROKE,
      lineWidth: BEAM_WIDTH,
      lineCap: "round",
      cursor: "grab",
    });
    this.divPath = new Path(null, {
      stroke: DIV_STROKE,
      lineWidth: DIV_LINE_WIDTH,
    });
    this.brightnessArmPath = new Path(null, {
      stroke: ARM_STROKE,
      lineWidth: ARM_LINE_WIDTH,
    });
    this.emisArmPath = new Path(null, {
      stroke: ARM_STROKE,
      lineWidth: ARM_LINE_WIDTH,
    });

    this.handle1 = createHandle(source.p1);
    this.handle2 = createHandle(source.p2);
    this.handleBrightness = createHandle(this.computeBrightnessHandlePos());
    this.handleEmis = createHandle(this.computeEmisHandlePos());

    // ── Scene graph ─────────────────────────────────────────────────────────
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

    // ── Body translation drag (on either the shield or beam line) ────────────
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

    attachTranslationDrag(this.shieldPath, translationPoints, rebuild);

    // ── Endpoint handles ─────────────────────────────────────────────────────
    attachEndpointDrag(
      this.handle1,
      () => source.p1,
      (p) => {
        source.p1 = p;
      },
      rebuild,
    );
    attachEndpointDrag(
      this.handle2,
      () => source.p2,
      (p) => {
        source.p2 = p;
      },
      rebuild,
    );

    // ── Brightness handle ────────────────────────────────────────────────────
    // Handle moves along the perpendicular to the beam; its distance from the
    // midpoint maps linearly to brightness.
    attachEndpointDrag(
      this.handleBrightness,
      () => this.computeBrightnessHandlePos(),
      (newP) => {
        const { mid, normal } = this.segmentGeometry();
        const proj = (newP.x - mid.x) * normal.x + (newP.y - mid.y) * normal.y;
        source.brightness = armLenToBrightness(Math.abs(proj));
      },
      rebuild,
    );

    // ── Emission-angle handle ────────────────────────────────────────────────
    // The handle sits at a fixed radial distance along the normal.
    // Dragging it tangentially (along the aperture direction) changes the
    // half-angle: tan(angle) = tangential / normal offset.
    attachEndpointDrag(
      this.handleEmis,
      () => this.computeEmisHandlePos(),
      (newP) => {
        const { mid, normal, along } = this.segmentGeometry();
        const projNormal = (newP.x - mid.x) * normal.x + (newP.y - mid.y) * normal.y;
        const projAlong = (newP.x - mid.x) * along.x + (newP.y - mid.y) * along.y;
        const refDist = Math.max(1, Math.abs(projNormal));
        const halfAngleDeg = (Math.atan2(Math.abs(projAlong), refDist) * 180) / Math.PI;
        source.emisAngle = Math.min(90, Math.max(0, halfAngleDeg));
      },
      rebuild,
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Returns the mid-point, unit normal (emission direction), and unit along-segment. */
  private segmentGeometry(): {
    mid: { x: number; y: number };
    normal: { x: number; y: number };
    along: { x: number; y: number };
  } {
    const { p1, p2 } = this.source;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const along = { x: dx / len, y: dy / len };
    // Normal rotated 90° CCW (conventional emission side)
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
    const { p1, p2, emisAngle } = this.source;
    const { mid, normal } = this.segmentGeometry();

    // Shield + beam aperture line
    const aperture = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);
    this.shieldPath.shape = aperture;
    this.beamPath.shape = aperture;

    // Divergence indicator – only rendered when emisAngle > 0
    if (emisAngle > 1e-4) {
      const halfAngle = (emisAngle / 180) * Math.PI;
      const baseAngle = Math.atan2(normal.y, normal.x);
      const divShape = new Shape();
      divShape
        .moveTo(mid.x, mid.y)
        .lineTo(
          mid.x + Math.cos(baseAngle + halfAngle) * DIV_ARM_LENGTH,
          mid.y + Math.sin(baseAngle + halfAngle) * DIV_ARM_LENGTH,
        );
      divShape
        .moveTo(mid.x, mid.y)
        .lineTo(
          mid.x + Math.cos(baseAngle - halfAngle) * DIV_ARM_LENGTH,
          mid.y + Math.sin(baseAngle - halfAngle) * DIV_ARM_LENGTH,
        );
      this.divPath.shape = divShape;
    } else {
      this.divPath.shape = null;
    }

    // Brightness arm
    const bPos = this.computeBrightnessHandlePos();
    this.brightnessArmPath.shape = new Shape().moveTo(mid.x, mid.y).lineTo(bPos.x, bPos.y);
    this.handleBrightness.x = bPos.x;
    this.handleBrightness.y = bPos.y;

    // Emission-angle arm
    const ePos = this.computeEmisHandlePos();
    this.emisArmPath.shape = new Shape().moveTo(mid.x, mid.y).lineTo(ePos.x, ePos.y);
    this.handleEmis.x = ePos.x;
    this.handleEmis.y = ePos.y;

    // Endpoint handles
    this.handle1.x = p1.x;
    this.handle1.y = p1.y;
    this.handle2.x = p2.x;
    this.handle2.y = p2.y;
  }
}

opticsLab.register("BeamSourceView", BeamSourceView);
