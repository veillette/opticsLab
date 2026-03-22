import { SLAB_GLASS_DEFAULT_HEIGHT_M, SLAB_GLASS_DEFAULT_WIDTH_M } from "../../../OpticsLabConstants.js";
import type { Point } from "../optics/Geometry.js";
import { DimensionalGlass } from "./DimensionalGlass.js";
import type { GlassPathPoint } from "./Glass.js";

function makeVertices(cx: number, cy: number, width: number, height: number): GlassPathPoint[] {
  const hw = width / 2;
  const hh = height / 2;
  return [
    { x: cx - hw, y: cy + hh }, // top-left
    { x: cx + hw, y: cy + hh }, // top-right
    { x: cx + hw, y: cy - hh }, // bottom-right
    { x: cx - hw, y: cy - hh }, // bottom-left
  ];
}

export class SlabGlass extends DimensionalGlass {
  public override readonly type: string = "SlabGlass";

  public constructor(
    center: Point,
    width = SLAB_GLASS_DEFAULT_WIDTH_M,
    height = SLAB_GLASS_DEFAULT_HEIGHT_M,
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
