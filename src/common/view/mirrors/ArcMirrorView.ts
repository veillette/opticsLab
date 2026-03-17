/**
 * ArcMirrorView.ts
 *
 * Scenery node for a circular-arc mirror. Samples points along the arc
 * from p1 to p2 through p3 and renders the polyline with mirror styling.
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  ARC_MIRROR_SAMPLE_COUNT,
  MIRROR_BACK_WIDTH,
  MIRROR_FOCAL_MARKER_SIZE_M,
  MIRROR_FRONT_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ArcMirror } from "../../model/mirrors/ArcMirror.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { circumcenter, type Point, sampleArcPoints } from "../../model/optics/Geometry.js";
import {
  attachCurvatureHandleDrag,
  attachEndpointDrag,
  attachTranslationDrag,
  createHandle,
  projectPointOntoPerpendicularBisector,
} from "../ViewHelpers.js";

/**
 * Build a view-space polyline Shape from model-space points, converting via modelViewTransform.
 */
function buildViewShape(pts: Point[], modelViewTransform: ModelViewTransform2): Shape {
  const shape = new Shape();
  const first = pts[0];
  if (!first) {
    return shape;
  }
  shape.moveTo(modelViewTransform.modelToViewX(first.x), modelViewTransform.modelToViewY(first.y));
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p) {
      shape.lineTo(modelViewTransform.modelToViewX(p.x), modelViewTransform.modelToViewY(p.y));
    }
  }
  return shape;
}

export class ArcMirrorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly focalMarker: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;
  private readonly handle3: Circle;

  public constructor(
    private readonly mirror: ArcMirror,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });
    this.focalMarker = new Path(null, { fill: OpticsLabColors.focalMarkerFillProperty, pickable: false });
    this.handle1 = createHandle(mirror.p1, modelViewTransform);
    this.handle2 = createHandle(mirror.p2, modelViewTransform);
    this.handle3 = createHandle(mirror.p3, modelViewTransform);

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.focalMarker);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.backPath,
      [
        {
          get: () => mirror.p1,
          set: (p) => {
            mirror.p1 = p;
          },
        },
        {
          get: () => mirror.p2,
          set: (p) => {
            mirror.p2 = p;
          },
        },
        {
          get: () => mirror.p3,
          set: (p) => {
            mirror.p3 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle1,
      () => mirror.p1,
      (p) => {
        mirror.p1 = p;
        mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => mirror.p2,
      (p) => {
        mirror.p2 = p;
        mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachCurvatureHandleDrag(
      this.handle3,
      () => mirror.p1,
      () => mirror.p2,
      () => mirror.p3,
      (p) => {
        mirror.p3 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  protected override rebuild(): void {
    const { p1, p2 } = this.mirror;
    // Keep curvature handle at the vertex (on perpendicular bisector of chord)
    this.mirror.p3 = projectPointOntoPerpendicularBisector(this.mirror.p3, p1, p2);
    const p3 = this.mirror.p3;
    // Compute arc in model space, then convert to view space for the Shape
    const pts = sampleArcPoints(p1, p2, p3, ARC_MIRROR_SAMPLE_COUNT);
    const arcShape = buildViewShape(pts, this.modelViewTransform);
    this.backPath.shape = arcShape;
    this.frontPath.shape = arcShape;
    this.handle1.x = this.modelViewTransform.modelToViewX(p1.x);
    this.handle1.y = this.modelViewTransform.modelToViewY(p1.y);
    this.handle2.x = this.modelViewTransform.modelToViewX(p2.x);
    this.handle2.y = this.modelViewTransform.modelToViewY(p2.y);
    this.handle3.x = this.modelViewTransform.modelToViewX(p3.x);
    this.handle3.y = this.modelViewTransform.modelToViewY(p3.y);

    // Focal-point marker at R/2 from the vertex toward the center of curvature
    const geo = circumcenter(p1, p2, p3);
    if (geo) {
      const { center, radius } = geo;
      // Direction from vertex (p3) toward center
      const dx = center.x - p3.x;
      const dy = center.y - p3.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1e-10) {
        const ux = dx / d;
        const uy = dy / d;
        // Focal point at R/2 from the vertex along the axis
        const fx = p3.x + ux * (radius / 2);
        const fy = p3.y + uy * (radius / 2);
        const vfx = this.modelViewTransform.modelToViewX(fx);
        const vfy = this.modelViewTransform.modelToViewY(fy);
        const vs = Math.abs(this.modelViewTransform.modelToViewDeltaX(MIRROR_FOCAL_MARKER_SIZE_M));
        this.focalMarker.shape = new Shape()
          .moveTo(vfx - vs, vfy)
          .lineTo(vfx, vfy - vs)
          .lineTo(vfx + vs, vfy)
          .lineTo(vfx, vfy + vs)
          .close();
      } else {
        this.focalMarker.shape = null;
      }
    } else {
      this.focalMarker.shape = null;
    }

    this.onRebuild?.();
  }
}

opticsLab.register("ArcMirrorView", ArcMirrorView);
