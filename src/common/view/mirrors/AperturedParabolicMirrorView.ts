/**
 * AperturedParabolicMirrorView.ts
 *
 * Scenery node for a parabolic mirror with a central aperture. The mirror
 * is drawn as two half-segments (left arm and right arm) with a visible gap
 * in the center corresponding to the aperture.
 *
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 * The aperture size is adjusted via the edit panel slider.
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
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { AperturedParabolicMirror } from "../../model/mirrors/AperturedParabolicMirror.js";
import type { Point } from "../../model/optics/Geometry.js";
import { distance } from "../../model/optics/Geometry.js";
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

/** Split model-space points into left arm / right arm around the central aperture. */
function splitAroundAperture(
  points: Point[],
  chordMidX: number,
  chordMidY: number,
  tangentX: number,
  tangentY: number,
  effectiveHalfWidth: number,
): { left: Point[]; right: Point[] } {
  const left: Point[] = [];
  const right: Point[] = [];
  for (const p of points) {
    const coord = (p.x - chordMidX) * tangentX + (p.y - chordMidY) * tangentY;
    if (coord <= -effectiveHalfWidth) {
      left.push(p);
    } else if (coord >= effectiveHalfWidth) {
      right.push(p);
    }
  }
  return { left, right };
}

export class AperturedParabolicMirrorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly bodyDragListenerRight: RichDragListener;
  private readonly backPathLeft: Path;
  private readonly frontPathLeft: Path;
  private readonly backPathRight: Path;
  private readonly frontPathRight: Path;
  private readonly bodyHitPathLeft: Path;
  private readonly bodyHitPathRight: Path;
  private readonly focalMarker: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;
  private readonly handle3: Circle;

  private readonly mirror: AperturedParabolicMirror;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(mirror: AperturedParabolicMirror, modelViewTransform: ModelViewTransform2, tandem: Tandem) {
    super();
    this.mirror = mirror;
    this.modelViewTransform = modelViewTransform;

    const pathOptions = {
      lineCap: "round" as const,
      lineJoin: "round" as const,
      pickable: false,
    };
    this.backPathLeft = new Path(null, {
      ...pathOptions,
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
    });
    this.frontPathLeft = new Path(null, {
      ...pathOptions,
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
    });
    this.backPathRight = new Path(null, {
      ...pathOptions,
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
    });
    this.frontPathRight = new Path(null, {
      ...pathOptions,
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
    });
    this.bodyHitPathLeft = new Path(null, {
      stroke: OpticsLabColors.hitAreaFillProperty,
      lineWidth: LINE_HIT_HALF_WIDTH_PX * 2,
      lineCap: "round",
      lineJoin: "round",
    });
    this.bodyHitPathRight = new Path(null, {
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

    this.addChild(this.bodyHitPathLeft);
    this.addChild(this.bodyHitPathRight);
    this.addChild(this.backPathLeft);
    this.addChild(this.frontPathLeft);
    this.addChild(this.backPathRight);
    this.addChild(this.frontPathRight);
    this.addChild(this.focalMarker);
    this.excludeFromSelectionBounds(this.focalMarker);
    this.trackLinkAttribute(focalMarkersVisibleProperty, this.focalMarker, "visible");
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPathLeft,
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
    // Also allow body drag from the right arm
    this.bodyDragListenerRight = attachTranslationDrag(
      this.bodyHitPathRight,
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
      tandem.createTandem("bodyDragListenerRight"),
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

  public override dispose(): void {
    this.bodyHitPathRight.removeInputListener(this.bodyDragListenerRight);
    this.bodyDragListenerRight.dispose();
    super.dispose();
  }

  protected override _doRebuild(): void {
    const { p1, p2 } = this.mirror;
    this.mirror.p3 = projectPointOntoPerpendicularBisector(this.mirror.p3, p1, p2);
    const p3 = this.mirror.p3;

    const chordLen = distance(p1, p2);
    const halfAperture = chordLen / 2;
    const effectiveHalfWidth = Math.min(this.mirror.apertureHalfWidth, halfAperture * 0.99);

    const allPoints = this.mirror.computePoints();

    if (chordLen > 1e-10) {
      const chordMidX = (p1.x + p2.x) / 2;
      const chordMidY = (p1.y + p2.y) / 2;
      const tangentX = (p2.x - p1.x) / chordLen;
      const tangentY = (p2.y - p1.y) / chordLen;

      const { left, right } = splitAroundAperture(
        allPoints,
        chordMidX,
        chordMidY,
        tangentX,
        tangentY,
        effectiveHalfWidth,
      );

      const leftShape = left.length > 1 ? buildPolylineViewShape(left, this.modelViewTransform) : null;
      const rightShape = right.length > 1 ? buildPolylineViewShape(right, this.modelViewTransform) : null;

      this.backPathLeft.shape = leftShape;
      this.frontPathLeft.shape = leftShape;
      this.bodyHitPathLeft.shape = leftShape;
      this.backPathRight.shape = rightShape;
      this.frontPathRight.shape = rightShape;
      this.bodyHitPathRight.shape = rightShape;

      // Focal-point marker (same formula as ParabolicMirrorView)
      const normalX = -tangentY;
      const normalY = tangentX;
      const sagitta = (p3.x - chordMidX) * normalX + (p3.y - chordMidY) * normalY;
      const a = halfAperture > 1e-10 ? sagitta / (halfAperture * halfAperture) : 0;

      if (Math.abs(a) > 1e-10) {
        const focalDist = 1 / (4 * a);
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
      this.backPathLeft.shape = null;
      this.frontPathLeft.shape = null;
      this.bodyHitPathLeft.shape = null;
      this.backPathRight.shape = null;
      this.frontPathRight.shape = null;
      this.bodyHitPathRight.shape = null;
      this.focalMarker.shape = null;
    }

    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.handle3.x = this.modelViewTransform.modelToViewX(p3.x);
    this.handle3.y = this.modelViewTransform.modelToViewY(p3.y);

    this.rebuildEmitter.emit();
  }
}

opticsLab.register("AperturedParabolicMirrorView", AperturedParabolicMirrorView);
