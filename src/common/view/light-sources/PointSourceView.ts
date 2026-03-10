/**
 * PointSourceView.ts – 360° point light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Path, type RichDragListener } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import {
  POINT_SOURCE_GLOW_RADIUS_PX,
  POINT_SOURCE_SPOKE_COUNT,
  POINT_SOURCE_SPOKE_LINE_WIDTH,
  POINT_SOURCE_SPOKE_OUTER_PX,
  SOURCE_GLOW_STROKE_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PointSourceElement } from "../../model/light-sources/PointSourceElement.js";
import { attachTranslationDrag } from "../ViewHelpers.js";

function wavelengthToRgb(nm: number): { r: number; g: number; b: number } {
  const c = VisibleColor.wavelengthToColor(nm);
  return { r: c.r, g: c.g, b: c.b };
}

export class PointSourceView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly glowPath: Path;
  private readonly spokePath: Path;

  public constructor(
    private readonly source: PointSourceElement,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.glowPath = new Path(null, {
      lineWidth: SOURCE_GLOW_STROKE_WIDTH,
      cursor: "grab",
    });
    this.spokePath = new Path(null, { lineWidth: POINT_SOURCE_SPOKE_LINE_WIDTH });

    this.addChild(this.spokePath);
    this.addChild(this.glowPath);

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
  }

  private rebuild(): void {
    const modelViewTransform = this.modelViewTransform;
    const { x, y } = this.source.position;
    const { brightness, wavelength } = this.source;

    const { r, g, b } = wavelengthToRgb(wavelength);
    this.glowPath.fill = `rgba(${r},${g},${b},0.28)`;
    this.glowPath.stroke = `rgba(${r},${g},${b},0.90)`;
    this.spokePath.stroke = `rgba(${r},${g},${b},0.65)`;

    const vcx = modelViewTransform.modelToViewX(x);
    const vcy = modelViewTransform.modelToViewY(y);

    // Glow disc (fixed pixel radius)
    this.glowPath.shape = new Shape().circle(vcx, vcy, POINT_SOURCE_GLOW_RADIUS_PX);

    // Spokes (fixed pixel outer radius, fixed pixel inner = POINT_SOURCE_GLOW_RADIUS_PX)
    const spokeShape = new Shape();
    for (let i = 0; i < POINT_SOURCE_SPOKE_COUNT; i++) {
      const angle = (i / POINT_SOURCE_SPOKE_COUNT) * Math.PI * 2;
      const outerLen =
        POINT_SOURCE_GLOW_RADIUS_PX + (POINT_SOURCE_SPOKE_OUTER_PX - POINT_SOURCE_GLOW_RADIUS_PX) * brightness;
      const cosMv = Math.cos(angle),
        sinMv = Math.sin(angle);
      const vDeltaX = modelViewTransform.modelToViewDeltaX(1); // = 100 px/m
      const scale = Math.abs(vDeltaX); // 100 px/m
      const innerMx = x + cosMv * (POINT_SOURCE_GLOW_RADIUS_PX / scale);
      const innerMy = y + sinMv * (POINT_SOURCE_GLOW_RADIUS_PX / scale);
      const outerMx = x + cosMv * (outerLen / scale);
      const outerMy = y + sinMv * (outerLen / scale);
      spokeShape.moveTo(modelViewTransform.modelToViewX(innerMx), modelViewTransform.modelToViewY(innerMy));
      spokeShape.lineTo(modelViewTransform.modelToViewX(outerMx), modelViewTransform.modelToViewY(outerMy));
    }
    this.spokePath.shape = spokeShape;
  }
}

opticsLab.register("PointSourceView", PointSourceView);
