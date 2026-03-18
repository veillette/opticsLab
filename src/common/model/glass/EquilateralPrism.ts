import type { Point } from "../optics/Geometry.js";
import { type GlassPathPoint, Glass } from "./Glass.js";

const SIN_60 = Math.sin(Math.PI / 3);

function makeVertices(cx: number, cy: number, size: number): GlassPathPoint[] {
  return [
    { x: cx, y: cy + size },
    { x: cx - size * SIN_60, y: cy - size * 0.5 },
    { x: cx + size * SIN_60, y: cy - size * 0.5 },
  ];
}

function centroid(path: GlassPathPoint[]): Point {
  const n = path.length;
  let sx = 0;
  let sy = 0;
  for (const p of path) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / n, y: sy / n };
}

export class EquilateralPrism extends Glass {
  public override readonly type: string = "EquilateralPrism";
  public size: number;

  public constructor(center: Point, size = 0.5, refIndex = 1.5, cauchyB = 0.004, partialReflect = true) {
    super(makeVertices(center.x, center.y, size), refIndex, cauchyB, partialReflect);
    this.size = size;
  }

  public setSize(newSize: number): void {
    const c = centroid(this.path);
    this.size = newSize;
    const verts = makeVertices(c.x, c.y, newSize);
    for (let i = 0; i < 3; i++) {
      this.path[i]!.x = verts[i]!.x;
      this.path[i]!.y = verts[i]!.y;
    }
  }

  public override serialize(): Record<string, unknown> {
    const c = centroid(this.path);
    return { type: this.type, cx: c.x, cy: c.y, size: this.size, refIndex: this.refIndex };
  }
}
