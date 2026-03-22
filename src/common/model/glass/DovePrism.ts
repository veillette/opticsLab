import { DOVE_PRISM_DEFAULT_HEIGHT_M, DOVE_PRISM_DEFAULT_WIDTH_M } from "../../../OpticsLabConstants.js";
import type { Point } from "../optics/Geometry.js";
import { DimensionalGlass } from "./DimensionalGlass.js";
import type { GlassPathPoint } from "./Glass.js";

// Dove prism: isosceles trapezoid with 45° entry/exit faces.
// Bottom (entry face) is wide, top is narrower by H on each side.
// Centroid x: (-W/2 + W/2 + W/2-H/2 + -W/2+H/2) / 4 = 0 ✓
function makeVertices(cx: number, cy: number, width: number, height: number): GlassPathPoint[] {
  const hw = width / 2;
  const hh = height / 2;
  return [
    { x: cx - hw, y: cy - hh }, // bottom-left
    { x: cx + hw, y: cy - hh }, // bottom-right
    { x: cx + hw - hh, y: cy + hh }, // top-right (45° face)
    { x: cx - hw + hh, y: cy + hh }, // top-left (45° face)
  ];
}

export class DovePrism extends DimensionalGlass {
  public override readonly type: string = "DovePrism";

  public constructor(
    center: Point,
    width = DOVE_PRISM_DEFAULT_WIDTH_M,
    height = DOVE_PRISM_DEFAULT_HEIGHT_M,
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
