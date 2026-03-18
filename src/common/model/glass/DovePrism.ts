import type { Point } from "../optics/Geometry.js";
import { type GlassPathPoint, Glass } from "./Glass.js";

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

export class DovePrism extends Glass {
  public override readonly type: string = "DovePrism";
  public width: number;
  public height: number;

  public constructor(
    center: Point,
    width = 0.78,
    height = 0.36,
    refIndex = 1.5,
    cauchyB = 0.004,
    partialReflect = true,
  ) {
    super(makeVertices(center.x, center.y, width, height), refIndex, cauchyB, partialReflect);
    this.width = width;
    this.height = height;
  }

  public setWidth(newWidth: number): void {
    const c = centroid(this.path);
    this.width = newWidth;
    this._recompute(c);
  }

  public setHeight(newHeight: number): void {
    const c = centroid(this.path);
    this.height = newHeight;
    this._recompute(c);
  }

  private _recompute(c: Point): void {
    const verts = makeVertices(c.x, c.y, this.width, this.height);
    for (let i = 0; i < 4; i++) {
      this.path[i]!.x = verts[i]!.x;
      this.path[i]!.y = verts[i]!.y;
    }
  }

  public override serialize(): Record<string, unknown> {
    const c = centroid(this.path);
    return { type: this.type, cx: c.x, cy: c.y, width: this.width, height: this.height, refIndex: this.refIndex };
  }
}
