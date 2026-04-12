import {
  DEFAULT_CAUCHY_B,
  DEFAULT_REFRACTIVE_INDEX,
  RIGHT_ANGLE_PRISM_DEFAULT_LEG_LENGTH_M,
} from "../../../OpticsLabConstants.js";
import { ELEMENT_TYPE_RIGHT_ANGLE_PRISM } from "../../../OpticsLabStrings.js";
import { type Point, polygonCentroid } from "../optics/Geometry.js";
import { Glass, type GlassPathPoint } from "./Glass.js";

function makeVertices(cx: number, cy: number, legLength: number): GlassPathPoint[] {
  const L = legLength;
  return [
    { x: cx - L / 3, y: cy - L / 3 }, // 90° corner
    { x: cx + (2 * L) / 3, y: cy - L / 3 }, // 45° corner
    { x: cx - L / 3, y: cy + (2 * L) / 3 }, // 45° corner
  ];
}

export class RightAnglePrism extends Glass {
  public override readonly type: string = ELEMENT_TYPE_RIGHT_ANGLE_PRISM;
  public legLength: number;

  public constructor(
    center: Point,
    legLength = RIGHT_ANGLE_PRISM_DEFAULT_LEG_LENGTH_M,
    refIndex = DEFAULT_REFRACTIVE_INDEX,
    cauchyB = DEFAULT_CAUCHY_B,
    partialReflect = true,
  ) {
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
