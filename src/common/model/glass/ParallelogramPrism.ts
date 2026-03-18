import type { Point } from "../optics/Geometry.js";
import { type GlassPathPoint, Glass } from "./Glass.js";

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

export class ParallelogramPrism extends Glass {
  public override readonly type: string = "ParallelogramPrism";
  public width: number;
  public height: number;

  public constructor(
    center: Point,
    width = 0.54,
    height = 0.42,
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
