import { type Point, polygonCentroid } from "../optics/Geometry.js";
import { Glass, type GlassPathPoint } from "./Glass.js";

/**
 * Abstract base for polygon-glass elements described by a width and height.
 * Subclasses implement makeVertices() and provide the initial path via super().
 */
export abstract class DimensionalGlass extends Glass {
  public width: number;
  public height: number;
  public rotation: number;

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
    this.rotation = 0;
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

  public setRotation(angle: number): void {
    const c = polygonCentroid(this.path);
    this.rotation = angle;
    this._recompute(c);
  }

  protected _recompute(c: Point): void {
    const verts = this.makeVertices(c.x, c.y, this.width, this.height);
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    for (let i = 0; i < verts.length; i++) {
      const p = this.path[i];
      const v = verts[i];
      if (p !== undefined && v !== undefined) {
        const relX = v.x - c.x;
        const relY = v.y - c.y;
        p.x = c.x + relX * cos - relY * sin;
        p.y = c.y + relX * sin + relY * cos;
      }
    }
  }

  public override serialize(): Record<string, unknown> {
    const c = polygonCentroid(this.path);
    return {
      type: this.type,
      cx: c.x,
      cy: c.y,
      width: this.width,
      height: this.height,
      refIndex: this.refIndex,
      rotation: this.rotation,
    };
  }
}
