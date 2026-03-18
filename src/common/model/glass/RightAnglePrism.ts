import type { Point } from "../optics/Geometry.js";
import { type GlassPathPoint, Glass } from "./Glass.js";

function makeVertices(cx: number, cy: number, legLength: number): GlassPathPoint[] {
  const L = legLength;
  return [
    { x: cx - L / 3, y: cy - L / 3 }, // 90° corner
    { x: cx + (2 * L) / 3, y: cy - L / 3 }, // 45° corner
    { x: cx - L / 3, y: cy + (2 * L) / 3 }, // 45° corner
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

export class RightAnglePrism extends Glass {
  public override readonly type: string = "RightAnglePrism";
  public legLength: number;

  public constructor(center: Point, legLength = 0.54, refIndex = 1.5, cauchyB = 0.004, partialReflect = true) {
    super(makeVertices(center.x, center.y, legLength), refIndex, cauchyB, partialReflect);
    this.legLength = legLength;
  }

  public setLegLength(newLength: number): void {
    const c = centroid(this.path);
    this.legLength = newLength;
    const verts = makeVertices(c.x, c.y, newLength);
    for (let i = 0; i < 3; i++) {
      this.path[i]!.x = verts[i]!.x;
      this.path[i]!.y = verts[i]!.y;
    }
  }

  public override serialize(): Record<string, unknown> {
    const c = centroid(this.path);
    return { type: this.type, cx: c.x, cy: c.y, legLength: this.legLength, refIndex: this.refIndex };
  }
}
