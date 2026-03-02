/**
 * GlassView.ts
 *
 * Scenery node for a Glass element whose boundary may include both line
 * segments and circular arcs. Renders the closed path as a translucent
 * blue filled shape with a blue outline.
 *
 * Replaces the former PolygonGlassView (which only handled line segments).
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { Glass, GlassPathPoint } from "../../model/glass/Glass.js";
import {
  distance,
  linesIntersection,
  type Point,
  perpendicularBisector,
  point,
  segment,
} from "../../model/optics/Geometry.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const GLASS_FILL = "rgba(100, 180, 255, 0.22)";
const GLASS_STROKE = "rgba(60, 130, 210, 0.8)";
const GLASS_STROKE_WIDTH = 1.5;

export class GlassView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly glassPath: Path;
  private readonly handles: Circle[];
  private readonly handleVerts: GlassPathPoint[];

  public constructor(
    private readonly glass: Glass,
    handleVerts?: GlassPathPoint[],
  ) {
    super();

    this.glassPath = new Path(null, {
      fill: GLASS_FILL,
      stroke: GLASS_STROKE,
      lineWidth: GLASS_STROKE_WIDTH,
    });
    this.addChild(this.glassPath);

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
    const pathPoints = this.glass.path;
    const n = pathPoints.length;

    if (n < 3) {
      this.glassPath.shape = null;
      this.repositionHandles();
      return;
    }

    const shape = new Shape();
    const first = pathPoints[0]!;
    shape.moveTo(first.x, first.y);

    for (let i = 0; i < n; i++) {
      const curr = pathPoints[i % n]!;
      const next = pathPoints[(i + 1) % n]!;

      if (next.arc && !curr.arc) {
        const after = pathPoints[(i + 2) % n]!;
        this.addArcToShape(shape, curr, next, after);
      } else if (!(next.arc || curr.arc)) {
        shape.lineTo(next.x, next.y);
      }
    }
    shape.close();

    this.glassPath.shape = shape;
    this.repositionHandles();
  }

  private addArcToShape(shape: Shape, p1pt: GlassPathPoint, ctrl: GlassPathPoint, p2pt: GlassPathPoint): void {
    const p1 = point(p1pt.x, p1pt.y);
    const p3 = point(ctrl.x, ctrl.y);
    const p2 = point(p2pt.x, p2pt.y);

    const center = linesIntersection(perpendicularBisector(segment(p1, p3)), perpendicularBisector(segment(p2, p3)));

    if (!(center && Number.isFinite(center.x) && Number.isFinite(center.y))) {
      shape.lineTo(p2.x, p2.y);
      return;
    }

    const r = distance(center, p3);
    const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
    const a3 = Math.atan2(p3.y - center.y, p3.x - center.x);
    const acw = (a2 < a3 && a3 < a1) || (a1 < a2 && a2 < a3) || (a3 < a1 && a1 < a2);

    shape.arc(center.x, center.y, r, a1, a2, acw);
  }

  private repositionHandles(): void {
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

opticsLab.register("GlassView", GlassView);
