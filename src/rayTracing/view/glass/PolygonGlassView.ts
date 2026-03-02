/**
 * PolygonGlassView.ts
 *
 * Scenery node for a polygonal glass element (including SphericalLens,
 * which extends PolygonGlass). Renders the closed polygon path as a
 * translucent blue filled shape with a blue outline.
 * One handle per non-arc vertex lets the user reshape the polygon;
 * body drag repositions the whole element.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PolygonGlass, PolygonVertex } from "../../model/glass/PolygonGlass.js";
import type { Point } from "../../model/optics/Geometry.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const GLASS_FILL = "rgba(100, 180, 255, 0.22)";
const GLASS_STROKE = "rgba(60, 130, 210, 0.8)";
const GLASS_STROKE_WIDTH = 1.5;

export class PolygonGlassView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly glassPath: Path;
  private readonly handles: Circle[];
  private readonly handleVerts: PolygonVertex[];

  public constructor(
    private readonly glass: PolygonGlass,
    handleVerts?: PolygonVertex[],
  ) {
    super();

    this.glassPath = new Path(null, {
      fill: GLASS_FILL,
      stroke: GLASS_STROKE,
      lineWidth: GLASS_STROKE_WIDTH,
    });
    this.addChild(this.glassPath);

    // Use provided handle vertices, or fall back to all non-arc vertices.
    this.handleVerts = handleVerts ?? glass.path.filter((v) => !v.arc);
    this.handles = this.handleVerts.map((vert) => {
      const handle = createHandle({ x: vert.x, y: vert.y });
      attachEndpointDrag(
        handle,
        (): Point => ({ x: vert.x, y: vert.y }),
        (p) => {
          vert.x = p.x;
          vert.y = p.y;
        },
        () => {
          this.rebuild();
        },
      );
      this.addChild(handle);
      return handle;
    });

    this.rebuild();

    // Body drag: translate all vertices (including arc control points)
    const allVertPoints = glass.path.map((v) => ({
      get: (): Point => ({ x: v.x, y: v.y }),
      set: (p: Point): void => {
        v.x = p.x;
        v.y = p.y;
      },
    }));
    this.bodyDragListener = attachTranslationDrag(this.glassPath, allVertPoints, () => {
      this.rebuild();
    });
  }

  protected rebuild(): void {
    const allVerts = this.glass.path.filter((v) => !v.arc);

    const shape = new Shape();
    const first = allVerts[0];
    if (first) {
      shape.moveTo(first.x, first.y);
      for (let i = 1; i < allVerts.length; i++) {
        const v = allVerts[i];
        if (v) {
          shape.lineTo(v.x, v.y);
        }
      }
      shape.close();
    }
    this.glassPath.shape = shape;

    // Reposition handles using the stored handle vertices.
    for (let i = 0; i < this.handles.length; i++) {
      const v = this.handleVerts[i];
      const h = this.handles[i];
      if (v && h) {
        h.x = v.x;
        h.y = v.y;
      }
    }
  }
}

opticsLab.register("PolygonGlassView", PolygonGlassView);
