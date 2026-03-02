/**
 * PointSourceView.ts
 *
 * Scenery node for a 360° point light source. Rendered as a glowing disc
 * with decorative spokes showing omnidirectional emission.
 *
 * Interactive handles (via RichDragListener through ViewHelpers):
 *   • Drag the glow disc  → translate the source (position)
 *   • Drag the brightness handle (on the dashed arm) → adjust brightness (0.01 – 1.0)
 *
 * The brightness handle sits at a fixed 45° angle (NE) from the source
 * center. Its distance from center encodes brightness: closer = dimmer,
 * farther = brighter.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PointSourceElement } from "../../model/light-sources/PointSourceElement.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Visual constants ──────────────────────────────────────────────────────────
const GLOW_RADIUS = 14;
const GLOW_FILL = "rgba(255, 220, 80, 0.28)";
const GLOW_STROKE = "rgba(255, 220, 80, 0.90)";
const GLOW_STROKE_WIDTH = 2;

const SPOKE_STROKE = "rgba(255, 210, 60, 0.65)";
const SPOKE_LINE_WIDTH = 1.2;
const SPOKE_COUNT = 12;
const SPOKE_OUTER = 26; // outer tip radius

// Brightness handle arm
const ARM_STROKE = "rgba(255, 210, 60, 0.55)";
const ARM_LINE_WIDTH = 1;
// Fixed angle for the brightness arm (NE, avoids collision with spokes grid)
const BRIGHTNESS_ANGLE = -Math.PI / 4; // 45° above horizontal (up-right)
const BRIGHTNESS_ARM_MIN = 32; // px when brightness = 0
const BRIGHTNESS_ARM_MAX = 82; // px when brightness = 1

// ── Helpers ───────────────────────────────────────────────────────────────────
function brightnessToArmLength(b: number): number {
  return BRIGHTNESS_ARM_MIN + b * (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN);
}

function armLengthToBrightness(len: number): number {
  return Math.max(0.01, Math.min(1.0, (len - BRIGHTNESS_ARM_MIN) / (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN)));
}

// ── View class ────────────────────────────────────────────────────────────────
export class PointSourceView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly glowPath: Path;
  private readonly spokePath: Path;
  private readonly armPath: Path;
  private readonly handleBrightness: Circle;

  public constructor(private readonly source: PointSourceElement) {
    super();

    // ── Visual nodes ────────────────────────────────────────────────────────
    this.glowPath = new Path(null, {
      fill: GLOW_FILL,
      stroke: GLOW_STROKE,
      lineWidth: GLOW_STROKE_WIDTH,
      cursor: "grab",
    });

    this.spokePath = new Path(null, {
      stroke: SPOKE_STROKE,
      lineWidth: SPOKE_LINE_WIDTH,
    });

    this.armPath = new Path(null, {
      stroke: ARM_STROKE,
      lineWidth: ARM_LINE_WIDTH,
    });

    this.handleBrightness = createHandle(this.computeBrightnessHandlePos());

    // ── Scene graph ─────────────────────────────────────────────────────────
    this.addChild(this.spokePath);
    this.addChild(this.armPath);
    this.addChild(this.glowPath);
    this.addChild(this.handleBrightness);

    this.rebuild();

    // ── Translation drag on the glow disc ───────────────────────────────────
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
    );

    // ── Brightness handle drag ───────────────────────────────────────────────
    // getPoint returns the current handle position so RichDragListener can
    // accumulate deltas correctly. setPoint maps the new position back to a
    // brightness value by computing its distance from the source center.
    attachEndpointDrag(
      this.handleBrightness,
      () => this.computeBrightnessHandlePos(),
      (newP) => {
        const { x: cx, y: cy } = source.position;
        const dx = newP.x - cx;
        const dy = newP.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        source.brightness = armLengthToBrightness(dist);
      },
      () => {
        this.rebuild();
      },
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private computeBrightnessHandlePos(): { x: number; y: number } {
    const { x, y } = this.source.position;
    const len = brightnessToArmLength(this.source.brightness);
    return {
      x: x + Math.cos(BRIGHTNESS_ANGLE) * len,
      y: y + Math.sin(BRIGHTNESS_ANGLE) * len,
    };
  }

  private rebuild(): void {
    const { x, y } = this.source.position;
    const { brightness } = this.source;

    // Glow disc
    this.glowPath.shape = new Shape().circle(x, y, GLOW_RADIUS);

    // Spokes – show emission in all directions; opacity scales with brightness
    const spokeShape = new Shape();
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const angle = (i / SPOKE_COUNT) * Math.PI * 2;
      const innerX = x + Math.cos(angle) * GLOW_RADIUS;
      const innerY = y + Math.sin(angle) * GLOW_RADIUS;
      const outerLen = GLOW_RADIUS + (SPOKE_OUTER - GLOW_RADIUS) * brightness;
      spokeShape.moveTo(innerX, innerY);
      spokeShape.lineTo(x + Math.cos(angle) * outerLen, y + Math.sin(angle) * outerLen);
    }
    this.spokePath.shape = spokeShape;

    // Brightness arm
    const hPos = this.computeBrightnessHandlePos();
    this.armPath.shape = new Shape().moveTo(x, y).lineTo(hPos.x, hPos.y);

    // Sync handle position
    this.handleBrightness.x = hPos.x;
    this.handleBrightness.y = hPos.y;
  }
}

opticsLab.register("PointSourceView", PointSourceView);
