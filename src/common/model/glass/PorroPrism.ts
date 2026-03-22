import { type Point, polygonCentroid } from "../optics/Geometry.js";
import { Glass, type GlassPathPoint } from "./Glass.js";

// Porro prism: right-angle (45-45-90) isosceles prism oriented with its
// hypotenuse as the left (entry) face. The 90° corner points to the right.
// Centroid derivation: place hypotenuse midpoint at origin, half-hyp = L/√2.
// 90° vertex at (L/√2, 0); centroid at (L/(3√2), 0).
// Shift left by L/(3√2) to centre at cx,cy.
// s = L/√2 = altitude from the 90° vertex to the hypotenuse = half-hypotenuse.
// offset = s/3 = L/(3√2); centroid check: (-s/3 - s/3 + 2s/3)/3 = 0 ✓
// Right-angle check: vec(right→top)=(-s,s), vec(right→bottom)=(-s,-s); dot = s²-s² = 0 ✓
function makeVertices(cx: number, cy: number, legLength: number): GlassPathPoint[] {
  const s = legLength / Math.SQRT2; // half-hypotenuse = altitude from 90° vertex
  const offset = s / 3; // = L/(3√2): centroid shift from hypotenuse midpoint
  return [
    { x: cx - offset, y: cy + s }, // 45° top
    { x: cx - offset, y: cy - s }, // 45° bottom
    { x: cx + 2 * offset, y: cy }, // 90° right
  ];
}

export class PorroPrism extends Glass {
  public override readonly type: string = "PorroPrism";
  public legLength: number;

  public constructor(center: Point, legLength = 0.6, refIndex = 1.5, cauchyB = 0.004, partialReflect = true) {
    super(makeVertices(center.x, center.y, legLength), refIndex, cauchyB, partialReflect);
    this.legLength = legLength;
  }

  public setLegLength(newLength: number): void {
    const c = polygonCentroid(this.path);
    this.legLength = newLength;
    const verts = makeVertices(c.x, c.y, newLength);
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
    return { type: this.type, cx: c.x, cy: c.y, legLength: this.legLength, refIndex: this.refIndex };
  }
}
