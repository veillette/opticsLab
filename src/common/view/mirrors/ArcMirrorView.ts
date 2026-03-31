/**
 * ArcMirrorView.ts
 *
 * Scenery node for a circular-arc mirror. Samples points along the arc
 * from p1 to p2 through p3 and renders the polyline with mirror styling.
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  ARC_MIRROR_SAMPLE_COUNT,
  LINE_HIT_HALF_WIDTH_PX,
  MIRROR_BACK_WIDTH,
  MIRROR_FOCAL_MARKER_SIZE_M,
  MIRROR_FRONT_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ArcMirror } from "../../model/mirrors/ArcMirror.js";
import { circumcenter, sampleArcPoints } from "../../model/optics/Geometry.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { focalMarkersVisibleProperty } from "../FocalMarkersVisibleProperty.js";
import {
  attachCurvatureHandleDrag,
  attachTranslationDrag,
  buildDiamondShape,
  buildPolylineViewShape,
  createHandle,
  type DragHandle,
  makeEndpointHandle,
  projectPointOntoPerpendicularBisector,
} from "../ViewHelpers.js";

export class ArcMirrorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly bodyHitPath: Path;
  private readonly focalMarker: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;
  private readonly handle3: Circle;

  private readonly mirror: ArcMirror;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(mirror: ArcMirror, modelViewTransform: ModelViewTransform2, tandem: Tandem) {
    super();
    this.mirror = mirror;
    this.modelViewTransform = modelViewTransform;

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      lineJoin: "round",
      pickable: false,
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      lineJoin: "round",
      pickable: false,
    });
    this.bodyHitPath = new Path(null, {
      stroke: "rgba(0,0,0,0.001)",
      lineWidth: LINE_HIT_HALF_WIDTH_PX * 2,
      lineCap: "round",
      lineJoin: "round",
    });
    this.focalMarker = new Path(null, { fill: OpticsLabColors.focalMarkerFillProperty, pickable: false });
    this.handle1 = makeEndpointHandle(
      () => mirror.p1,
      (p) => {
        mirror.p1 = p;
        mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
    );
    this.handle2 = makeEndpointHandle(
      () => mirror.p2,
      (p) => {
        mirror.p2 = p;
        mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
    );
    this.handle3 = createHandle(mirror.p3, modelViewTransform);

    this.addChild(this.bodyHitPath);
    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.focalMarker);
    this.excludeFromSelectionBounds(this.focalMarker);
    focalMarkersVisibleProperty.linkAttribute(this.focalMarker, "visible");
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
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
      tandem.createTandem("bodyDragListener"),
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
      tandem.createTandem("curvatureDragListener"),
    );
  }

  public override rebuild(): void {
    const { p1, p2 } = this.mirror;
    // Keep curvature handle at the vertex (on perpendicular bisector of chord)
    this.mirror.p3 = projectPointOntoPerpendicularBisector(this.mirror.p3, p1, p2);
    const p3 = this.mirror.p3;
    // Compute arc in model space, then convert to view space for the Shape
    const arcModelPoints = sampleArcPoints(p1, p2, p3, ARC_MIRROR_SAMPLE_COUNT);
    const arcShape = buildPolylineViewShape(arcModelPoints, this.modelViewTransform);
    this.bodyHitPath.shape = arcShape;
    this.backPath.shape = arcShape;
    this.frontPath.shape = arcShape;
    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.handle3.x = this.modelViewTransform.modelToViewX(p3.x);
    this.handle3.y = this.modelViewTransform.modelToViewY(p3.y);

    // Focal-point marker at R/2 from the vertex toward the center of curvature
    const circumcircle = circumcenter(p1, p2, p3);
    if (circumcircle) {
      const { center, radius } = circumcircle;
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
        this.focalMarker.shape = buildDiamondShape(vfx, vfy, vs);
      } else {
        this.focalMarker.shape = null;
      }
    } else {
      this.focalMarker.shape = null;
    }

    this.rebuildEmitter.emit();
  }
}

opticsLab.register("ArcMirrorView", ArcMirrorView);
