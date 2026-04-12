/**
 * ParabolicMirrorView.ts
 *
 * Scenery node for a parabolic mirror. Replicates the model's polyline
 * approximation (80 segments) and renders it with mirror styling.
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  LINE_HIT_HALF_WIDTH_PX,
  MIRROR_BACK_WIDTH,
  MIRROR_FOCAL_MARKER_SIZE_M,
  MIRROR_FRONT_WIDTH,
  PARABOLIC_MIRROR_SEGMENT_COUNT,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ParabolicMirror } from "../../model/mirrors/ParabolicMirror.js";
import type { Point } from "../../model/optics/Geometry.js";
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

/**
 * Compute the parabola's polyline approximation in model coordinates.
 * Matches the logic in ParabolicMirror.computePoints().
 */
function computeParabolaPoints(p1: Point, p2: Point, p3: Point): Point[] {
  const chordMidX = (p1.x + p2.x) / 2;
  const chordMidY = (p1.y + p2.y) / 2;
  const chordLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

  if (chordLen < 1e-10) {
    return [p1, p2];
  }

  const tangentX = (p2.x - p1.x) / chordLen;
  const tangentY = (p2.y - p1.y) / chordLen;

  // Sagitta: signed distance of p3 from the chord midpoint in the normal direction
  const sagitta = (p3.x - chordMidX) * -tangentY + (p3.y - chordMidY) * tangentX;

  const halfAperture = chordLen / 2;
  const a = halfAperture ** 2 === 0 ? 0 : sagitta / halfAperture ** 2;

  const points: Point[] = [];
  for (let i = 0; i <= PARABOLIC_MIRROR_SEGMENT_COUNT; i++) {
    const t = -1 + (2 * i) / PARABOLIC_MIRROR_SEGMENT_COUNT;
    const u = t * halfAperture;
    const v = sagitta - a * u * u;
    points.push({
      x: chordMidX + tangentX * u - tangentY * v,
      y: chordMidY + tangentY * u + tangentX * v,
    });
  }
  return points;
}

export class ParabolicMirrorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly bodyHitPath: Path;
  private readonly focalMarker: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;
  private readonly handle3: Circle;

  private readonly mirror: ParabolicMirror;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(mirror: ParabolicMirror, modelViewTransform: ModelViewTransform2, tandem: Tandem) {
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
      stroke: OpticsLabColors.hitAreaFillProperty,
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
      () => this.rebuild(),
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
    );
    this.handle2 = makeEndpointHandle(
      () => mirror.p2,
      (p) => {
        mirror.p2 = p;
        mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
      },
      () => this.rebuild(),
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
    );
    this.handle3 = createHandle(mirror.p3, modelViewTransform);

    this.addChild(this.bodyHitPath);
    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.focalMarker);
    this.excludeFromSelectionBounds(this.focalMarker);
    this.trackLinkAttribute(focalMarkersVisibleProperty, this.focalMarker, "visible");
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
      () => this.rebuild(),
      modelViewTransform,
      tandem.createTandem("curvatureDragListener"),
    );
  }

  protected override _doRebuild(): void {
    const { p1, p2 } = this.mirror;
    // Keep curvature handle at the vertex (on perpendicular bisector of chord)
    this.mirror.p3 = projectPointOntoPerpendicularBisector(this.mirror.p3, p1, p2);
    const p3 = this.mirror.p3;
    // Compute parabola in model space, then convert to view space for the Shape
    const parabolaModelPoints = computeParabolaPoints(p1, p2, p3);
    const parabolaShape = buildPolylineViewShape(parabolaModelPoints, this.modelViewTransform);
    this.bodyHitPath.shape = parabolaShape;
    this.backPath.shape = parabolaShape;
    this.frontPath.shape = parabolaShape;
    // Match arc-mirror behavior externally: endpoints + one curvature handle
    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.handle3.x = this.modelViewTransform.modelToViewX(p3.x);
    this.handle3.y = this.modelViewTransform.modelToViewY(p3.y);

    // Focal-point marker: for parabola v = a·u², focal length = 1/(4a)
    const chordLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    if (chordLen > 1e-10) {
      const chordMidX = (p1.x + p2.x) / 2;
      const chordMidY = (p1.y + p2.y) / 2;
      const tangentX = (p2.x - p1.x) / chordLen;
      const tangentY = (p2.y - p1.y) / chordLen;
      // Normal direction (from chord mid toward p3)
      const normalX = -tangentY;
      const normalY = tangentX;
      const sagitta = (p3.x - chordMidX) * normalX + (p3.y - chordMidY) * normalY;
      const halfAperture = chordLen / 2;
      const a = halfAperture > 1e-10 ? sagitta / (halfAperture * halfAperture) : 0;

      if (Math.abs(a) > 1e-10) {
        const focalDist = 1 / (4 * a); // signed: positive = same side as sagitta
        // Focal point along the axis from the vertex (p3)
        // The axis points from p3 inward (opposite to sagitta direction)
        const fx = p3.x - normalX * focalDist;
        const fy = p3.y - normalY * focalDist;
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

opticsLab.register("ParabolicMirrorView", ParabolicMirrorView);
