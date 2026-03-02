/**
 * SingleRaySourceView.ts
 *
 * Scenery node for a single directional ray source.
 * The ray originates at p1 and travels toward (and past) p2.
 *
 * Visual elements:
 *   • Origin disc (glowing circle at p1)   – drag to translate entire source
 *   • Direction line (p1 → p2)             – thin dashed indicator
 *   • Arrow head (at p2)                   – shows ray direction
 *   • Brightness arm + handle              – drag to adjust brightness (0.01–1.0)
 *   • Direction handle (at p2)             – drag to aim / rotate the ray
 *
 * The brightness handle sits perpendicular to the ray direction at p1.
 * Its distance from p1 encodes brightness.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { SingleRaySource } from "../../model/light-sources/SingleRaySource.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Visual constants ──────────────────────────────────────────────────────────
const ORIGIN_RADIUS = 9;
const ORIGIN_FILL = "rgba(255, 220, 80, 0.35)";
const ORIGIN_STROKE = "rgba(255, 220, 80, 0.92)";
const ORIGIN_STROKE_WIDTH = 2;

const DIR_STROKE = "rgba(255, 220, 80, 0.70)";
const DIR_LINE_WIDTH = 1.5;

const ARROW_STROKE = "rgba(255, 220, 80, 0.90)";
const ARROW_LINE_WIDTH = 1.5;
const ARROW_ARM = 10; // half-length of arrowhead arms

const ARM_STROKE = "rgba(255, 210, 60, 0.55)";
const ARM_LINE_WIDTH = 1;

// Brightness arm – perpendicular to ray at p1
const BRIGHTNESS_ARM_MIN = 22; // px when brightness ≈ 0
const BRIGHTNESS_ARM_MAX = 66; // px when brightness = 1

// ── Helpers ───────────────────────────────────────────────────────────────────
function brightnessToArmLen(b: number): number {
  return BRIGHTNESS_ARM_MIN + b * (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN);
}

function armLenToBrightness(len: number): number {
  return Math.max(0.01, Math.min(1.0, (len - BRIGHTNESS_ARM_MIN) / (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN)));
}

// ── View class ────────────────────────────────────────────────────────────────
export class SingleRaySourceView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly originPath: Path;
  private readonly dirPath: Path;
  private readonly arrowPath: Path;
  private readonly brightnessArmPath: Path;
  private readonly handleDirection: Circle;
  private readonly handleBrightness: Circle;

  public constructor(private readonly source: SingleRaySource) {
    super();

    // ── Visual nodes ────────────────────────────────────────────────────────
    this.originPath = new Path(null, {
      fill: ORIGIN_FILL,
      stroke: ORIGIN_STROKE,
      lineWidth: ORIGIN_STROKE_WIDTH,
      cursor: "grab",
    });
    this.dirPath = new Path(null, {
      stroke: DIR_STROKE,
      lineWidth: DIR_LINE_WIDTH,
    });
    this.arrowPath = new Path(null, {
      stroke: ARROW_STROKE,
      lineWidth: ARROW_LINE_WIDTH,
      lineCap: "round",
    });
    this.brightnessArmPath = new Path(null, {
      stroke: ARM_STROKE,
      lineWidth: ARM_LINE_WIDTH,
    });

    this.handleDirection = createHandle(source.p2);
    this.handleBrightness = createHandle(this.computeBrightnessHandlePos());

    // ── Scene graph ─────────────────────────────────────────────────────────
    this.addChild(this.dirPath);
    this.addChild(this.arrowPath);
    this.addChild(this.brightnessArmPath);
    this.addChild(this.originPath);
    this.addChild(this.handleDirection);
    this.addChild(this.handleBrightness);

    this.rebuild();

    // ── Body translation drag – moves p1 AND p2 together ────────────────────
    this.bodyDragListener = attachTranslationDrag(
      this.originPath,
      [
        {
          get: () => source.p1,
          set: (p) => {
            source.p1 = p;
          },
        },
        {
          get: () => source.p2,
          set: (p) => {
            source.p2 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
    );

    // ── Direction handle – only p2 moves (rotates / aims the ray) ───────────
    attachEndpointDrag(
      this.handleDirection,
      () => source.p2,
      (p) => {
        source.p2 = p;
      },
      () => {
        this.rebuild();
      },
    );

    // ── Brightness handle ────────────────────────────────────────────────────
    // The handle is constrained to the perpendicular from p1.
    // Its projection distance onto that perpendicular encodes brightness.
    attachEndpointDrag(
      this.handleBrightness,
      () => this.computeBrightnessHandlePos(),
      (newP) => {
        const perp = this.perpUnit();
        const { p1 } = source;
        const proj = (newP.x - p1.x) * perp.x + (newP.y - p1.y) * perp.y;
        source.brightness = armLenToBrightness(Math.abs(proj));
      },
      () => {
        this.rebuild();
      },
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Unit vector along the ray direction (p1 → p2). */
  private rayDir(): { x: number; y: number } {
    const { p1, p2 } = this.source;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  /** Unit vector perpendicular to the ray (90° CCW rotation). */
  private perpUnit(): { x: number; y: number } {
    const d = this.rayDir();
    return { x: -d.y, y: d.x };
  }

  private computeBrightnessHandlePos(): { x: number; y: number } {
    const { p1 } = this.source;
    const perp = this.perpUnit();
    const len = brightnessToArmLen(this.source.brightness);
    return { x: p1.x + perp.x * len, y: p1.y + perp.y * len };
  }

  private rebuild(): void {
    const { p1, p2 } = this.source;

    // Origin disc
    this.originPath.shape = new Shape().circle(p1.x, p1.y, ORIGIN_RADIUS);

    // Direction line
    this.dirPath.shape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);

    // Arrowhead at p2
    const dir = this.rayDir();
    const perp = this.perpUnit();
    const arrowShape = new Shape();
    arrowShape
      .moveTo(p2.x, p2.y)
      .lineTo(p2.x - dir.x * ARROW_ARM + perp.x * ARROW_ARM * 0.4, p2.y - dir.y * ARROW_ARM + perp.y * ARROW_ARM * 0.4);
    arrowShape
      .moveTo(p2.x, p2.y)
      .lineTo(p2.x - dir.x * ARROW_ARM - perp.x * ARROW_ARM * 0.4, p2.y - dir.y * ARROW_ARM - perp.y * ARROW_ARM * 0.4);
    this.arrowPath.shape = arrowShape;

    // Brightness arm
    const bPos = this.computeBrightnessHandlePos();
    this.brightnessArmPath.shape = new Shape().moveTo(p1.x, p1.y).lineTo(bPos.x, bPos.y);
    this.handleBrightness.x = bPos.x;
    this.handleBrightness.y = bPos.y;

    // Direction handle
    this.handleDirection.x = p2.x;
    this.handleDirection.y = p2.y;
  }
}

opticsLab.register("SingleRaySourceView", SingleRaySourceView);
