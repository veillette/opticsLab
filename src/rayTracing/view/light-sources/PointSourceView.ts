/**
 * PointSourceView.ts – 360° point light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PointSourceElement } from "../../model/light-sources/PointSourceElement.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const GLOW_RADIUS = 14; // px – fixed visual size
const GLOW_FILL = "rgba(255, 220, 80, 0.28)";
const GLOW_STROKE = "rgba(255, 220, 80, 0.90)";
const GLOW_STROKE_WIDTH = 2;

const SPOKE_STROKE = "rgba(255, 210, 60, 0.65)";
const SPOKE_LINE_WIDTH = 1.2;
const SPOKE_COUNT = 12;
const SPOKE_OUTER = 26; // px – fixed visual size

const ARM_STROKE = "rgba(255, 210, 60, 0.55)";
const ARM_LINE_WIDTH = 1;
const BRIGHTNESS_ANGLE = -Math.PI / 4; // fixed arm direction (NE)

// Brightness arm distances in model metres (0.32 m = 32 px at 100 px/m)
const BRIGHTNESS_ARM_MIN = 0.32;
const BRIGHTNESS_ARM_MAX = 0.82;

function brightnessToArmLength(b: number): number {
  return BRIGHTNESS_ARM_MIN + b * (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN);
}

function armLengthToBrightness(len: number): number {
  return Math.max(0.01, Math.min(1.0, (len - BRIGHTNESS_ARM_MIN) / (BRIGHTNESS_ARM_MAX - BRIGHTNESS_ARM_MIN)));
}

export class PointSourceView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly glowPath: Path;
  private readonly spokePath: Path;
  private readonly armPath: Path;
  private readonly handleBrightness: Circle;

  public constructor(
    private readonly source: PointSourceElement,
    private readonly mvt: ModelViewTransform2,
  ) {
    super();

    this.glowPath = new Path(null, {
      fill: GLOW_FILL,
      stroke: GLOW_STROKE,
      lineWidth: GLOW_STROKE_WIDTH,
      cursor: "grab",
    });
    this.spokePath = new Path(null, { stroke: SPOKE_STROKE, lineWidth: SPOKE_LINE_WIDTH });
    this.armPath = new Path(null, { stroke: ARM_STROKE, lineWidth: ARM_LINE_WIDTH });
    this.handleBrightness = createHandle(this.computeBrightnessHandlePos(), mvt);

    this.addChild(this.spokePath);
    this.addChild(this.armPath);
    this.addChild(this.glowPath);
    this.addChild(this.handleBrightness);

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
      mvt,
    );

    attachEndpointDrag(
      this.handleBrightness,
      () => this.computeBrightnessHandlePos(),
      (newP) => {
        const { x: cx, y: cy } = source.position;
        const dx = newP.x - cx,
          dy = newP.y - cy;
        source.brightness = armLengthToBrightness(Math.sqrt(dx * dx + dy * dy));
      },
      () => {
        this.rebuild();
      },
      mvt,
    );
  }

  private computeBrightnessHandlePos(): { x: number; y: number } {
    const { x, y } = this.source.position;
    const len = brightnessToArmLength(this.source.brightness);
    return { x: x + Math.cos(BRIGHTNESS_ANGLE) * len, y: y + Math.sin(BRIGHTNESS_ANGLE) * len };
  }

  private rebuild(): void {
    const mvt = this.mvt;
    const { x, y } = this.source.position;
    const { brightness } = this.source;

    const vcx = mvt.modelToViewX(x);
    const vcy = mvt.modelToViewY(y);

    // Glow disc (fixed pixel radius)
    this.glowPath.shape = new Shape().circle(vcx, vcy, GLOW_RADIUS);

    // Spokes (fixed pixel outer radius, fixed pixel inner = GLOW_RADIUS)
    const spokeShape = new Shape();
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const angle = (i / SPOKE_COUNT) * Math.PI * 2;
      // Both inner and outer radii are in pixels (fixed visual sizes)
      const outerLen = GLOW_RADIUS + (SPOKE_OUTER - GLOW_RADIUS) * brightness;
      // Angle in model (y-up) maps to view: we use the same angle but apply y-inversion
      // by computing model offsets and converting
      const cosMv = Math.cos(angle),
        sinMv = Math.sin(angle);
      // inner: GLOW_RADIUS px from centre in view (use view deltas)
      const vDeltaX = mvt.modelToViewDeltaX(1); // = 100 px/m
      // For fixed pixel offsets, divide by scale to get model offset, then convert
      const scale = Math.abs(vDeltaX); // 100 px/m
      const innerMx = x + cosMv * (GLOW_RADIUS / scale);
      const innerMy = y + sinMv * (GLOW_RADIUS / scale);
      const outerMx = x + cosMv * (outerLen / scale);
      const outerMy = y + sinMv * (outerLen / scale);
      spokeShape.moveTo(mvt.modelToViewX(innerMx), mvt.modelToViewY(innerMy));
      spokeShape.lineTo(mvt.modelToViewX(outerMx), mvt.modelToViewY(outerMy));
    }
    this.spokePath.shape = spokeShape;

    // Brightness arm (model-space computation)
    const hPos = this.computeBrightnessHandlePos();
    const vhx = mvt.modelToViewX(hPos.x),
      vhy = mvt.modelToViewY(hPos.y);
    this.armPath.shape = new Shape().moveTo(vcx, vcy).lineTo(vhx, vhy);
    this.handleBrightness.x = vhx;
    this.handleBrightness.y = vhy;
  }
}

opticsLab.register("PointSourceView", PointSourceView);
