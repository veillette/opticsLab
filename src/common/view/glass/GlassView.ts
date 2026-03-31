/**
 * GlassView.ts
 *
 * Scenery node for a Glass element whose boundary may include both line
 * segments and circular arcs. Renders the closed path as a translucent
 * blue filled shape with a blue outline.
 *
 * For plain prisms (no arc points), supports adding vertices on edges and
 * removing vertices via on-screen controls.
 *
 * Replaces the former PolygonGlassView (which only handled line segments).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import OpticsLabColors, { glassFill } from "../../../OpticsLabColors.js";
import {
  GLASS_STROKE_WIDTH,
  HANDLE_RADIUS,
  PRISM_EDGE_ADD_RADIUS,
  PRISM_VERTEX_REMOVE_RADIUS,
} from "../../../OpticsLabConstants.js";
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
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { attachTranslationDrag, type DragHandle, makeEndpointHandle } from "../ViewHelpers.js";

export class GlassView extends BaseOpticalElementView {
  private _bodyDragListener!: RichDragListener;
  private readonly glassPath: Path;
  private readonly handlesContainer: Node;
  private handles: DragHandle[] = [];
  private handleVerts: GlassPathPoint[] = [];
  private addButtons: Node[] = [];
  private addButtonEdgeIndices: number[] = [];
  private readonly isPrism: boolean;
  private readonly handleVertsOption: GlassPathPoint[] | undefined;
  protected readonly glassTandem: Tandem;

  public get bodyDragListener(): RichDragListener {
    return this._bodyDragListener;
  }

  protected readonly glass: Glass;
  protected readonly modelViewTransform: ModelViewTransform2;
  public constructor(
    glass: Glass,
    modelViewTransform: ModelViewTransform2,
    tandem?: Tandem,
    handleVerts?: GlassPathPoint[],
  ) {
    super();
    this.glass = glass;
    this.modelViewTransform = modelViewTransform;
    this.glassTandem = tandem ?? Tandem.OPT_OUT;

    this.glassPath = new Path(null, {
      fill: glassFill(glass.refIndex),
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: GLASS_STROKE_WIDTH,
    });
    this.addChild(this.glassPath);

    this.handlesContainer = new Node();
    this.addChild(this.handlesContainer);

    this.handleVertsOption = handleVerts;
    // Enable free vertex handles only for plain (untyped) Glass polygons.
    // Typed prisms (RightAnglePrism, SlabGlass, etc.) expose dimension sliders
    // instead, so vertex dragging is intentionally disabled for them.
    this.isPrism = handleVerts === undefined && glass.type === "Glass";
    this.rebuildHandlesAndDragListener();

    this.rebuild();
  }

  /**
   * Rebuild handles, add/remove buttons (for prisms), and body drag listener
   * from the current glass.path. Call when path length changes.
   */
  protected rebuildHandlesAndDragListener(): void {
    this.handlesContainer.removeAllChildren();

    if (this._bodyDragListener) {
      this.glassPath.removeInputListener(this._bodyDragListener);
    }

    this.handleVerts = this.isPrism ? [...this.glass.path] : (this.handleVertsOption ?? []);
    this.handles = this.handleVerts.map((vert, index) => {
      const handle = makeEndpointHandle(
        (): Point => ({ x: vert.x, y: vert.y }),
        (p) => {
          vert.x = p.x;
          vert.y = p.y;
        },
        () => {
          this.rebuild();
        },
        this.modelViewTransform,
        this.glassTandem.createTandem(`vertexDragListener${index}`),
      );
      if (this.isPrism && this.glass.path.length > 3) {
        const removeBtn = this.createRemoveButton();
        this.attachRemoveButtonListener(removeBtn, vert);
        handle.addChild(removeBtn);
      }
      this.handlesContainer.addChild(handle);

      return handle;
    });

    if (this.isPrism) {
      const path = this.glass.path;
      const n = path.length;
      this.addButtons = [];
      this.addButtonEdgeIndices = [];
      for (let i = 0; i < n; i++) {
        const addBtn = this.createAddButton(i);
        this.addButtons.push(addBtn);
        this.addButtonEdgeIndices.push(i);
        this.handlesContainer.addChild(addBtn);
      }
    }

    const allVertPoints = this.glass.path.map((v) => ({
      get: (): Point => ({ x: v.x, y: v.y }),
      set: (p: Point): void => {
        v.x = p.x;
        v.y = p.y;
      },
    }));
    this._bodyDragListener = attachTranslationDrag(
      this.glassPath,
      allVertPoints,
      () => {
        this.rebuild();
      },
      this.modelViewTransform,
      this.glassTandem.createTandem("bodyDragListener"),
    );
  }

  private createAddButton(edgeIndex: number): Node {
    const path = this.glass.path;
    const n = path.length;
    const i = edgeIndex % n;
    const current = path[i];
    const next = path[(i + 1) % n];
    const midX = current && next ? (current.x + next.x) / 2 : 0;
    const midY = current && next ? (current.y + next.y) / 2 : 0;

    const plusShape = new Shape().moveTo(-3, 0).lineTo(3, 0).moveTo(0, -3).lineTo(0, 3);

    const addEdgeButton = new Node({
      x: this.modelViewTransform.modelToViewX(midX),
      y: this.modelViewTransform.modelToViewY(midY),
      cursor: "pointer",
      children: [
        new Circle(PRISM_EDGE_ADD_RADIUS, {
          fill: OpticsLabColors.prismAddFillProperty,
          stroke: OpticsLabColors.prismAddStrokeProperty,
          lineWidth: 1.5,
        }),
        new Path(plusShape, { stroke: OpticsLabColors.prismAddStrokeProperty, lineWidth: 1.5 }),
      ],
    });

    addEdgeButton.addInputListener({
      down: (event: { handle: () => void }) => {
        event.handle();
        const glassPath = this.glass.path;
        const len = glassPath.length;
        const idx = edgeIndex % len;
        const a = glassPath[idx];
        const b = glassPath[(idx + 1) % len];
        if (a && b) {
          const clickMidX = (a.x + b.x) / 2;
          const clickMidY = (a.y + b.y) / 2;
          this.glass.addVertexOnEdge(edgeIndex, { x: clickMidX, y: clickMidY });
          this.rebuildHandlesAndDragListener();
          this.rebuild();
        }
      },
    });

    return addEdgeButton;
  }

  private createRemoveButton(): Node {
    const xShape = new Shape().moveTo(-2.5, -2.5).lineTo(2.5, 2.5).moveTo(2.5, -2.5).lineTo(-2.5, 2.5);

    const removeVertexButton = new Node({
      x: HANDLE_RADIUS + PRISM_VERTEX_REMOVE_RADIUS,
      y: -HANDLE_RADIUS - PRISM_VERTEX_REMOVE_RADIUS,
      cursor: "pointer",
      children: [
        new Circle(PRISM_VERTEX_REMOVE_RADIUS, {
          fill: OpticsLabColors.prismRemoveFillProperty,
          stroke: OpticsLabColors.prismRemoveStrokeProperty,
          lineWidth: 1.5,
        }),
        new Path(xShape, { stroke: OpticsLabColors.prismRemoveStrokeProperty, lineWidth: 1.5 }),
      ],
    });

    return removeVertexButton;
  }

  private attachRemoveButtonListener(removeBtn: Node, vert: GlassPathPoint): void {
    removeBtn.addInputListener({
      down: (event: { handle: () => void }) => {
        event.handle();
        const idx = this.glass.path.indexOf(vert);
        if (idx >= 0 && this.glass.removeVertex(idx)) {
          this.rebuildHandlesAndDragListener();
          this.rebuild();
        }
      },
    });
  }

  public override rebuild(): void {
    const pathPoints = this.glass.path;
    const n = pathPoints.length;

    if (n < 3) {
      this.glassPath.shape = null;
      this.repositionHandles();
      return;
    }

    const shape = new Shape();
    const first = pathPoints[0] as GlassPathPoint;
    shape.moveTo(this.modelViewTransform.modelToViewX(first.x), this.modelViewTransform.modelToViewY(first.y));

    for (let i = 0; i < n; i++) {
      const current = pathPoints[i % n] as GlassPathPoint;
      const next = pathPoints[(i + 1) % n] as GlassPathPoint;

      if (next.arc && !current.arc) {
        const after = pathPoints[(i + 2) % n] as GlassPathPoint;
        this.addArcToShape(shape, current, next, after);
      } else if (!(next.arc || current.arc)) {
        shape.lineTo(this.modelViewTransform.modelToViewX(next.x), this.modelViewTransform.modelToViewY(next.y));
      }
    }
    shape.close();

    this.glassPath.fill = glassFill(this.glass.refIndex);
    this.glassPath.shape = shape;
    this.repositionHandles();
  }

  private addArcToShape(
    shape: Shape,
    p1pt: GlassPathPoint,
    arcControlPoint: GlassPathPoint,
    p2pt: GlassPathPoint,
  ): void {
    // All geometry computed in model space
    const p1 = point(p1pt.x, p1pt.y);
    const p3 = point(arcControlPoint.x, arcControlPoint.y);
    const p2 = point(p2pt.x, p2pt.y);

    const center = linesIntersection(perpendicularBisector(segment(p1, p3)), perpendicularBisector(segment(p2, p3)));

    if (!(center && Number.isFinite(center.x) && Number.isFinite(center.y))) {
      shape.lineTo(this.modelViewTransform.modelToViewX(p2.x), this.modelViewTransform.modelToViewY(p2.y));
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
    const vcx = this.modelViewTransform.modelToViewX(center.x);
    const vcy = this.modelViewTransform.modelToViewY(center.y);
    const vr = Math.abs(this.modelViewTransform.modelToViewDeltaX(r));
    shape.arc(vcx, vcy, vr, -a1, -a2, acw);
  }

  private repositionHandles(): void {
    for (const h of this.handles) {
      h.syncToModel();
    }
    for (let i = 0; i < this.addButtons.length; i++) {
      const addEdgeButton = this.addButtons[i];
      const edgeIdx = this.addButtonEdgeIndices[i];
      if (addEdgeButton !== undefined && edgeIdx !== undefined) {
        const path = this.glass.path;
        const n = path.length;
        const idx = edgeIdx % n;
        const current = path[idx];
        const next = path[(idx + 1) % n];
        if (current && next) {
          const midX = (current.x + next.x) / 2;
          const midY = (current.y + next.y) / 2;
          addEdgeButton.x = this.modelViewTransform.modelToViewX(midX);
          addEdgeButton.y = this.modelViewTransform.modelToViewY(midY);
        }
      }
    }
  }
}

opticsLab.register("GlassView", GlassView);
