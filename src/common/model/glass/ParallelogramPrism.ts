import { ELEMENT_TYPE_PARALLELOGRAM_PRISM } from "../../../OpticsLabStrings.js";
import type { Point } from "../optics/Geometry.js";
import { DimensionalGlass } from "./DimensionalGlass.js";
import type { GlassPathPoint } from "./Glass.js";

// Fixed shear factor: each horizontal level shifts by ±shear/2 from centre.
// shear = height * 0.5 gives ~27° face angle.
function makeVertices(cx: number, cy: number, width: number, height: number): GlassPathPoint[] {
  const hw = width / 2;
  const hh = height / 2;
  const shear = height * 0.5;
  const hs = shear / 2;
  return [
    { x: cx - hw - hs, y: cy - hh }, // bottom-left
    { x: cx + hw - hs, y: cy - hh }, // bottom-right
    { x: cx + hw + hs, y: cy + hh }, // top-right
    { x: cx - hw + hs, y: cy + hh }, // top-left
  ];
}

export class ParallelogramPrism extends DimensionalGlass {
  public override readonly type: string = ELEMENT_TYPE_PARALLELOGRAM_PRISM;

  public constructor(
    center: Point,
    width = 0.54,
    height = 0.42,
    refIndex = 1.5,
    cauchyB = 0.004,
    partialReflect = true,
  ) {
    super(makeVertices(center.x, center.y, width, height), width, height, refIndex, cauchyB, partialReflect);
  }

  protected override makeVertices(cx: number, cy: number, width: number, height: number): GlassPathPoint[] {
    return makeVertices(cx, cy, width, height);
  }
}
