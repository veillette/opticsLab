import { EQUILATERAL_PRISM_DEFAULT_SIZE_M } from "../../../OpticsLabConstants.js";
import { type Point, polygonCentroid } from "../optics/Geometry.js";
import { Glass, type GlassPathPoint } from "./Glass.js";

const SIN_60 = Math.sin(Math.PI / 3);

function makeVertices(cx: number, cy: number, size: number): GlassPathPoint[] {
  return [
    { x: cx, y: cy + size },
    { x: cx - size * SIN_60, y: cy - size * 0.5 },
    { x: cx + size * SIN_60, y: cy - size * 0.5 },
  ];
}

export class EquilateralPrism extends Glass {
  public override readonly type: string = "EquilateralPrism";
  public size: number;

  public constructor(
    center: Point,
    size = EQUILATERAL_PRISM_DEFAULT_SIZE_M,
    refIndex = 1.5,
    cauchyB = 0.004,
    partialReflect = true,
  ) {
    super(makeVertices(center.x, center.y, size), refIndex, cauchyB, partialReflect);
    this.size = size;
  }

  public setSize(newSize: number): void {
    const c = polygonCentroid(this.path);
    this.size = newSize;
    const verts = makeVertices(c.x, c.y, newSize);
    for (let i = 0; i < 3; i++) {
      const p = this.path[i];
      const v = verts[i];
      if (p !== undefined && v !== undefined) {
        p.x = v.x;
        p.y = v.y;
      }
    }
  }

  public override serialize(): Record<string, unknown> {
    const c = polygonCentroid(this.path);
    return { type: this.type, cx: c.x, cy: c.y, size: this.size, refIndex: this.refIndex };
  }
}
