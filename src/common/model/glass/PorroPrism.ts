import type { Point } from "../optics/Geometry.js";
import { type GlassPathPoint, Glass } from "./Glass.js";

// Porro prism: right-angle (45-45-90) isosceles prism oriented with its
// hypotenuse as the left (entry) face. The 90° corner points to the right.
// Centroid derivation: place hypotenuse midpoint at origin, half-hyp = L/√2.
// 90° vertex at (L/√2, 0); centroid at (L/(3√2), 0).
// Shift left by L/(3√2) to centre at origin.
// Using L/4 ≈ L*0.25 and L*0.7 ≈ L/√2 as readable approximations that
// still keep the centroid exactly at cx,cy: (-L/4 + -L/4 + L/2)/3 = 0.
function makeVertices(cx: number, cy: number, legLength: number): GlassPathPoint[] {
  const L = legLength;
  return [
    { x: cx - L / 4, y: cy + L * 0.7 }, // 45° top
    { x: cx - L / 4, y: cy - L * 0.7 }, // 45° bottom
    { x: cx + L / 2, y: cy }, // 90° right
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

export class PorroPrism extends Glass {
  public override readonly type: string = "PorroPrism";
  public legLength: number;

  public constructor(center: Point, legLength = 0.6, refIndex = 1.5, cauchyB = 0.004, partialReflect = true) {
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
