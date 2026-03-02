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
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
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
    protected readonly mvt: ModelViewTransform2,
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
      const handle = createHandle({ x: vert.x, y: vert.y }, mvt);
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
        mvt,
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
    this.bodyDragListener = attachTranslationDrag(
      this.glassPath,
      allVertPoints,
      () => {
        this.rebuild();
      },
      mvt,
    );
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
    shape.moveTo(this.mvt.modelToViewX(first.x), this.mvt.modelToViewY(first.y));

    for (let i = 0; i < n; i++) {
      const curr = pathPoints[i % n]!;
      const next = pathPoints[(i + 1) % n]!;

      if (next.arc && !curr.arc) {
        const after = pathPoints[(i + 2) % n]!;
        this.addArcToShape(shape, curr, next, after);
      } else if (!(next.arc || curr.arc)) {
        shape.lineTo(this.mvt.modelToViewX(next.x), this.mvt.modelToViewY(next.y));
      }
    }
    shape.close();

    this.glassPath.shape = shape;
    this.repositionHandles();
  }

  private addArcToShape(shape: Shape, p1pt: GlassPathPoint, ctrl: GlassPathPoint, p2pt: GlassPathPoint): void {
    // All geometry computed in model space
    const p1 = point(p1pt.x, p1pt.y);
    const p3 = point(ctrl.x, ctrl.y);
    const p2 = point(p2pt.x, p2pt.y);

    const center = linesIntersection(perpendicularBisector(segment(p1, p3)), perpendicularBisector(segment(p2, p3)));

    if (!(center && Number.isFinite(center.x) && Number.isFinite(center.y))) {
      shape.lineTo(this.mvt.modelToViewX(p2.x), this.mvt.modelToViewY(p2.y));
      return;
    }

    const r = distance(center, p3); // model radius
    const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
    const a3 = Math.atan2(p3.y - center.y, p3.x - center.x);

    // In canvas (y-down) the angle of a model point is -a_model.  Going
    // clockwise in canvas (anticlockwise=false) means increasing canvas angle.
    // The clockwise canvas distance from -a1 to an angle -aX equals
    // (a1 - aX + 2π) % 2π.  The arc reaches the control point via the short
    // (clockwise) route when that distance is less than the distance to the
    // end point; otherwise the counterclockwise route passes through it.
    const tau = 2 * Math.PI;
    const cwCanvas1ToCtrl = (((a1 - a3) % tau) + tau) % tau;
    const cwCanvas1ToEnd = (((a1 - a2) % tau) + tau) % tau;
    const acw = cwCanvas1ToCtrl >= cwCanvas1ToEnd;

    // Convert center and radius to view space; negate angles for y-inversion
    const vcx = this.mvt.modelToViewX(center.x);
    const vcy = this.mvt.modelToViewY(center.y);
    const vr = Math.abs(this.mvt.modelToViewDeltaX(r));
    shape.arc(vcx, vcy, vr, -a1, -a2, acw);
  }

  private repositionHandles(): void {
    for (let i = 0; i < this.handles.length; i++) {
      const v = this.handleVerts[i];
      const h = this.handles[i];
      if (v && h) {
        h.x = this.mvt.modelToViewX(v.x);
        h.y = this.mvt.modelToViewY(v.y);
      }
    }
  }
}

opticsLab.register("GlassView", GlassView);
