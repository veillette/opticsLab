import { SLAB_GLASS_DEFAULT_HEIGHT_M, SLAB_GLASS_DEFAULT_WIDTH_M } from "../../../OpticsLabConstants.js";
import type { Point } from "../optics/Geometry.js";
import { Glass, type GlassPathPoint } from "./Glass.js";

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

export class SlabGlass extends Glass {
  public override readonly type: string = "SlabGlass";
  public width: number;
  public height: number;

  public constructor(
    center: Point,
    width = SLAB_GLASS_DEFAULT_WIDTH_M,
    height = SLAB_GLASS_DEFAULT_HEIGHT_M,
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
      const p = this.path[i];
      const v = verts[i];
      if (p !== undefined && v !== undefined) {
        p.x = v.x;
        p.y = v.y;
      }
    }
  }

  public override serialize(): Record<string, unknown> {
    const c = centroid(this.path);
    return { type: this.type, cx: c.x, cy: c.y, width: this.width, height: this.height, refIndex: this.refIndex };
  }
}
