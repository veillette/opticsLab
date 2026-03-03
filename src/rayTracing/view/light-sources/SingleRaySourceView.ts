/**
 * SingleRaySourceView.ts – single directional ray source.
 * Model coords are in metres (y-up); view coords in pixels (y-down).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import {
  BRIGHTNESS_CLAMP_MAX,
  BRIGHTNESS_CLAMP_MIN,
  SINGLE_RAY_ARROW_ARM_FACTOR,
  SINGLE_RAY_ARROW_ARM_M,
  SINGLE_RAY_ARROW_LINE_WIDTH,
  SINGLE_RAY_BRIGHTNESS_ARM_MAX_M,
  SINGLE_RAY_BRIGHTNESS_ARM_MIN_M,
  SINGLE_RAY_DIR_LINE_WIDTH,
  SINGLE_RAY_ORIGIN_RADIUS_PX,
  SINGLE_RAY_ORIGIN_STROKE_WIDTH,
  SOURCE_ARM_LINE_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { SingleRaySource } from "../../model/light-sources/SingleRaySource.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const ORIGIN_FILL = "rgba(255, 220, 80, 0.35)";
const ORIGIN_STROKE = "rgba(255, 220, 80, 0.92)";

const DIR_STROKE = "rgba(255, 220, 80, 0.70)";

const ARROW_STROKE = "rgba(255, 220, 80, 0.90)";

const ARM_STROKE = "rgba(255, 210, 60, 0.55)";

function brightnessToArmLen(b: number): number {
  return SINGLE_RAY_BRIGHTNESS_ARM_MIN_M + b * (SINGLE_RAY_BRIGHTNESS_ARM_MAX_M - SINGLE_RAY_BRIGHTNESS_ARM_MIN_M);
}

function armLenToBrightness(len: number): number {
  return Math.max(
    BRIGHTNESS_CLAMP_MIN,
    Math.min(
      BRIGHTNESS_CLAMP_MAX,
      (len - SINGLE_RAY_BRIGHTNESS_ARM_MIN_M) / (SINGLE_RAY_BRIGHTNESS_ARM_MAX_M - SINGLE_RAY_BRIGHTNESS_ARM_MIN_M),
    ),
  );
}

export class SingleRaySourceView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly originPath: Path;
  private readonly dirPath: Path;
  private readonly arrowPath: Path;
  private readonly brightnessArmPath: Path;
  private readonly handleDirection: Circle;
  private readonly handleBrightness: Circle;

  public constructor(
    private readonly source: SingleRaySource,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.originPath = new Path(null, {
      fill: ORIGIN_FILL,
      stroke: ORIGIN_STROKE,
      lineWidth: SINGLE_RAY_ORIGIN_STROKE_WIDTH,
      cursor: "grab",
    });
    this.dirPath = new Path(null, { stroke: DIR_STROKE, lineWidth: SINGLE_RAY_DIR_LINE_WIDTH });
    this.arrowPath = new Path(null, { stroke: ARROW_STROKE, lineWidth: SINGLE_RAY_ARROW_LINE_WIDTH, lineCap: "round" });
    this.brightnessArmPath = new Path(null, { stroke: ARM_STROKE, lineWidth: SOURCE_ARM_LINE_WIDTH });

    this.handleDirection = createHandle(source.p2, modelViewTransform);
    this.handleBrightness = createHandle(this.computeBrightnessHandlePos(), modelViewTransform);

    this.addChild(this.dirPath);
    this.addChild(this.arrowPath);
    this.addChild(this.brightnessArmPath);
    this.addChild(this.originPath);
    this.addChild(this.handleDirection);
    this.addChild(this.handleBrightness);

    this.rebuild();

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
      modelViewTransform,
    );

    attachEndpointDrag(
      this.handleDirection,
      () => source.p2,
      (p) => {
        source.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );

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
      modelViewTransform,
    );
  }

  private rayDir(): { x: number; y: number } {
    const { p1, p2 } = this.source;
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / len, y: dy / len };
  }

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
    const modelViewTransform = this.modelViewTransform;
    const { p1, p2 } = this.source;

    const vx1 = modelViewTransform.modelToViewX(p1.x),
      vy1 = modelViewTransform.modelToViewY(p1.y);
    const vx2 = modelViewTransform.modelToViewX(p2.x),
      vy2 = modelViewTransform.modelToViewY(p2.y);

    // Origin disc (fixed pixel radius)
    this.originPath.shape = new Shape().circle(vx1, vy1, SINGLE_RAY_ORIGIN_RADIUS_PX);

    // Direction line
    this.dirPath.shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);

    // Arrowhead at p2 (SINGLE_RAY_ARROW_ARM_M in model metres)
    const dir = this.rayDir();
    const perp = this.perpUnit();
    // Recompute arrow tips using model-space logic then convert
    const tip1mx =
      p2.x - dir.x * SINGLE_RAY_ARROW_ARM_M + perp.x * SINGLE_RAY_ARROW_ARM_M * SINGLE_RAY_ARROW_ARM_FACTOR;
    const tip1my =
      p2.y - dir.y * SINGLE_RAY_ARROW_ARM_M + perp.y * SINGLE_RAY_ARROW_ARM_M * SINGLE_RAY_ARROW_ARM_FACTOR;
    const tip2mx =
      p2.x - dir.x * SINGLE_RAY_ARROW_ARM_M - perp.x * SINGLE_RAY_ARROW_ARM_M * SINGLE_RAY_ARROW_ARM_FACTOR;
    const tip2my =
      p2.y - dir.y * SINGLE_RAY_ARROW_ARM_M - perp.y * SINGLE_RAY_ARROW_ARM_M * SINGLE_RAY_ARROW_ARM_FACTOR;
    const arrowShape = new Shape();
    arrowShape
      .moveTo(vx2, vy2)
      .lineTo(modelViewTransform.modelToViewX(tip1mx), modelViewTransform.modelToViewY(tip1my));
    arrowShape
      .moveTo(vx2, vy2)
      .lineTo(modelViewTransform.modelToViewX(tip2mx), modelViewTransform.modelToViewY(tip2my));
    this.arrowPath.shape = arrowShape;

    // Brightness arm
    const bPos = this.computeBrightnessHandlePos();
    const vbx = modelViewTransform.modelToViewX(bPos.x),
      vby = modelViewTransform.modelToViewY(bPos.y);
    this.brightnessArmPath.shape = new Shape().moveTo(vx1, vy1).lineTo(vbx, vby);
    this.handleBrightness.x = vbx;
    this.handleBrightness.y = vby;

    this.handleDirection.x = vx2;
    this.handleDirection.y = vy2;
  }
}

opticsLab.register("SingleRaySourceView", SingleRaySourceView);
