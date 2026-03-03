/**
 * PointSourceView.ts – 360° point light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import {
  BRIGHTNESS_CLAMP_MAX,
  BRIGHTNESS_CLAMP_MIN,
  POINT_SOURCE_BRIGHTNESS_ANGLE,
  POINT_SOURCE_BRIGHTNESS_ARM_MAX_M,
  POINT_SOURCE_BRIGHTNESS_ARM_MIN_M,
  POINT_SOURCE_GLOW_RADIUS_PX,
  POINT_SOURCE_SPOKE_COUNT,
  POINT_SOURCE_SPOKE_LINE_WIDTH,
  POINT_SOURCE_SPOKE_OUTER_PX,
  SOURCE_ARM_LINE_WIDTH,
  SOURCE_GLOW_STROKE_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PointSourceElement } from "../../model/light-sources/PointSourceElement.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const GLOW_FILL = "rgba(255, 220, 80, 0.28)";
const GLOW_STROKE = "rgba(255, 220, 80, 0.90)";
const SPOKE_STROKE = "rgba(255, 210, 60, 0.65)";
const ARM_STROKE = "rgba(255, 210, 60, 0.55)";

function brightnessToArmLength(b: number): number {
  return (
    POINT_SOURCE_BRIGHTNESS_ARM_MIN_M + b * (POINT_SOURCE_BRIGHTNESS_ARM_MAX_M - POINT_SOURCE_BRIGHTNESS_ARM_MIN_M)
  );
}

function armLengthToBrightness(len: number): number {
  return Math.max(
    BRIGHTNESS_CLAMP_MIN,
    Math.min(
      BRIGHTNESS_CLAMP_MAX,
      (len - POINT_SOURCE_BRIGHTNESS_ARM_MIN_M) /
        (POINT_SOURCE_BRIGHTNESS_ARM_MAX_M - POINT_SOURCE_BRIGHTNESS_ARM_MIN_M),
    ),
  );
}

export class PointSourceView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly glowPath: Path;
  private readonly spokePath: Path;
  private readonly armPath: Path;
  private readonly handleBrightness: Circle;

  public constructor(
    private readonly source: PointSourceElement,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.glowPath = new Path(null, {
      fill: GLOW_FILL,
      stroke: GLOW_STROKE,
      lineWidth: SOURCE_GLOW_STROKE_WIDTH,
      cursor: "grab",
    });
    this.spokePath = new Path(null, { stroke: SPOKE_STROKE, lineWidth: POINT_SOURCE_SPOKE_LINE_WIDTH });
    this.armPath = new Path(null, { stroke: ARM_STROKE, lineWidth: SOURCE_ARM_LINE_WIDTH });
    this.handleBrightness = createHandle(this.computeBrightnessHandlePos(), modelViewTransform);

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
      modelViewTransform,
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
      modelViewTransform,
    );
  }

  private computeBrightnessHandlePos(): { x: number; y: number } {
    const { x, y } = this.source.position;
    const len = brightnessToArmLength(this.source.brightness);
    return {
      x: x + Math.cos(POINT_SOURCE_BRIGHTNESS_ANGLE) * len,
      y: y + Math.sin(POINT_SOURCE_BRIGHTNESS_ANGLE) * len,
    };
  }

  private rebuild(): void {
    const modelViewTransform = this.modelViewTransform;
    const { x, y } = this.source.position;
    const { brightness } = this.source;

    const vcx = modelViewTransform.modelToViewX(x);
    const vcy = modelViewTransform.modelToViewY(y);

    // Glow disc (fixed pixel radius)
    this.glowPath.shape = new Shape().circle(vcx, vcy, POINT_SOURCE_GLOW_RADIUS_PX);

    // Spokes (fixed pixel outer radius, fixed pixel inner = POINT_SOURCE_GLOW_RADIUS_PX)
    const spokeShape = new Shape();
    for (let i = 0; i < POINT_SOURCE_SPOKE_COUNT; i++) {
      const angle = (i / POINT_SOURCE_SPOKE_COUNT) * Math.PI * 2;
      // Both inner and outer radii are in pixels (fixed visual sizes)
      const outerLen =
        POINT_SOURCE_GLOW_RADIUS_PX + (POINT_SOURCE_SPOKE_OUTER_PX - POINT_SOURCE_GLOW_RADIUS_PX) * brightness;
      // Angle in model (y-up) maps to view: we use the same angle but apply y-inversion
      // by computing model offsets and converting
      const cosMv = Math.cos(angle),
        sinMv = Math.sin(angle);
      // inner: POINT_SOURCE_GLOW_RADIUS_PX px from centre in view (use view deltas)
      const vDeltaX = modelViewTransform.modelToViewDeltaX(1); // = 100 px/m
      // For fixed pixel offsets, divide by scale to get model offset, then convert
      const scale = Math.abs(vDeltaX); // 100 px/m
      const innerMx = x + cosMv * (POINT_SOURCE_GLOW_RADIUS_PX / scale);
      const innerMy = y + sinMv * (POINT_SOURCE_GLOW_RADIUS_PX / scale);
      const outerMx = x + cosMv * (outerLen / scale);
      const outerMy = y + sinMv * (outerLen / scale);
      spokeShape.moveTo(modelViewTransform.modelToViewX(innerMx), modelViewTransform.modelToViewY(innerMy));
      spokeShape.lineTo(modelViewTransform.modelToViewX(outerMx), modelViewTransform.modelToViewY(outerMy));
    }
    this.spokePath.shape = spokeShape;

    // Brightness arm (model-space computation)
    const hPos = this.computeBrightnessHandlePos();
    const vhx = modelViewTransform.modelToViewX(hPos.x),
      vhy = modelViewTransform.modelToViewY(hPos.y);
    this.armPath.shape = new Shape().moveTo(vcx, vcy).lineTo(vhx, vhy);
    this.handleBrightness.x = vhx;
    this.handleBrightness.y = vhy;
  }
}

opticsLab.register("PointSourceView", PointSourceView);
