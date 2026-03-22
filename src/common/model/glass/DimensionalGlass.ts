import { type Point, polygonCentroid } from "../optics/Geometry.js";
import { Glass, type GlassPathPoint } from "./Glass.js";

/**
 * Abstract base for polygon-glass elements described by a width and height.
 * Subclasses implement makeVertices() and provide the initial path via super().
 */
export abstract class DimensionalGlass extends Glass {
  public width: number;
  public height: number;

  public constructor(
    path: GlassPathPoint[],
    width: number,
    height: number,
    refIndex: number,
    cauchyB: number,
    partialReflect: boolean,
  ) {
    super(path, refIndex, cauchyB, partialReflect);
    this.width = width;
    this.height = height;
  }

  protected abstract makeVertices(cx: number, cy: number, width: number, height: number): GlassPathPoint[];

  public setWidth(newWidth: number): void {
    const c = polygonCentroid(this.path);
    this.width = newWidth;
    this._recompute(c);
  }

  public setHeight(newHeight: number): void {
    const c = polygonCentroid(this.path);
    this.height = newHeight;
    this._recompute(c);
  }

  protected _recompute(c: Point): void {
    const verts = this.makeVertices(c.x, c.y, this.width, this.height);
    for (let i = 0; i < verts.length; i++) {
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
    return { type: this.type, cx: c.x, cy: c.y, width: this.width, height: this.height, refIndex: this.refIndex };
  }
}
