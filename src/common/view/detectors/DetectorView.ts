/**
 * DetectorView.ts
 *
 * Scenery node for an arc-shaped detector. Rendered as a teal arc with
 * endpoint handles, a curvature handle at the midpoint of the arc, a
 * floating irradiance chart panel, and a wire connecting the detector
 * midpoint to the chart.
 *
 * Four drag interactions:
 *  1. handle1 / handle2 — resize the detector arc (endpoints)
 *  2. handle3 — adjust curvature (constrained to perpendicular bisector)
 *  3. bodyHitPath — translate the whole detector (chart follows)
 *  4. chartPanel — reposition the chart independently (wire stretches)
 */

import { Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  type Circle,
  Path,
  RichDragListener,
  type RichDragListener as RichDragListenerType,
} from "scenerystack/scenery";
import { WireNode } from "scenerystack/scenery-phet";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  ARC_MIRROR_SAMPLE_COUNT,
  DETECTOR_INITIAL_CHART_OFFSET_X,
  DETECTOR_WIRE_NORMAL_MAGNITUDE,
  LINE_HIT_HALF_WIDTH_PX,
  MIRROR_BACK_WIDTH,
  MIRROR_FRONT_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { DetectorElement } from "../../model/detectors/DetectorElement.js";
import { circumcenter, sampleArcPoints } from "../../model/optics/Geometry.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachCurvatureHandleDrag,
  attachTranslationDrag,
  buildPolylineViewShape,
  createHandle,
  type DragHandle,
  makeEndpointHandle,
  projectPointOntoPerpendicularBisector,
} from "../ViewHelpers.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";
import { DetectorChartPanel } from "./DetectorChartPanel.js";

const INITIAL_CHART_OFFSET_Y = 10;

export class DetectorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListenerType;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly ticksPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;
  private readonly handle3: Circle;
  private readonly chartPanel: DetectorChartPanel;

  /** View-space offset of the chart center from the detector midpoint. */
  private chartOffset = new Vector2(DETECTOR_INITIAL_CHART_OFFSET_X, INITIAL_CHART_OFFSET_Y);

  // Properties driving the WireNode (updated imperatively in rebuild / chart drag).
  // Initialized with separated positions to avoid zero-length cubic bezier crash.
  private readonly wireDetectorPosProperty = new Property(new Vector2(0, 0));
  private readonly wireDetectorNormalProperty = new Property(new Vector2(DETECTOR_WIRE_NORMAL_MAGNITUDE, 0));
  private readonly wireChartPosProperty = new Property(new Vector2(DETECTOR_INITIAL_CHART_OFFSET_X, 0));
  private readonly wireChartNormalProperty = new Property(new Vector2(-DETECTOR_WIRE_NORMAL_MAGNITUDE, 0));

  private readonly detector: DetectorElement;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(
    detector: DetectorElement,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions: ViewOptionsModel,
  ) {
    super();
    this.detector = detector;
    this.modelViewTransform = modelViewTransform;

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.detectorBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      lineJoin: "round",
      pickable: false,
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.detectorFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      lineJoin: "round",
      pickable: false,
    });
    this.ticksPath = new Path(null, {
      stroke: OpticsLabColors.detectorTickStrokeProperty,
      lineWidth: 1.5,
      lineCap: "round",
      pickable: false,
    });
    this.bodyHitPath = new Path(null, {
      stroke: OpticsLabColors.hitAreaFillProperty,
      lineWidth: LINE_HIT_HALF_WIDTH_PX * 2,
      lineCap: "round",
      lineJoin: "round",
    });
    this.handle1 = makeEndpointHandle(
      () => detector.p1,
      (p) => {
        detector.p1 = p;
        detector.p3 = projectPointOntoPerpendicularBisector(detector.p3, detector.p1, detector.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
      viewOptions.handlesVisibleProperty,
    );
    this.handle2 = makeEndpointHandle(
      () => detector.p2,
      (p) => {
        detector.p2 = p;
        detector.p3 = projectPointOntoPerpendicularBisector(detector.p3, detector.p1, detector.p2);
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
      viewOptions.handlesVisibleProperty,
    );
    this.handle3 = createHandle(detector.p3, modelViewTransform, viewOptions.handlesVisibleProperty);

    this.chartPanel = new DetectorChartPanel({ onAcquire: () => detector.startAcquisition() });
    this.chartPanel.cursor = "pointer";

    const wireNode = new WireNode(
      this.wireDetectorPosProperty,
      this.wireDetectorNormalProperty,
      this.wireChartPosProperty,
      this.wireChartNormalProperty,
      {
        lineWidth: 3,
        stroke: OpticsLabColors.detectorFrontStrokeProperty,
      },
    );

    this.addChild(wireNode);
    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.ticksPath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);
    this.addChild(this.chartPanel);

    this.rebuild();

    // ── Drag: translate the whole detector (chart follows via chartOffset) ──
    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      [
        {
          get: () => detector.p1,
          set: (p) => {
            detector.p1 = p;
          },
        },
        {
          get: () => detector.p2,
          set: (p) => {
            detector.p2 = p;
          },
        },
        {
          get: () => detector.p3,
          set: (p) => {
            detector.p3 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("bodyDragListener"),
    );

    // ── Drag: adjust curvature (p3 constrained to perpendicular bisector) ──
    attachCurvatureHandleDrag(
      this.handle3,
      () => detector.p1,
      () => detector.p2,
      () => detector.p3,
      (p) => {
        detector.p3 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("curvatureDragListener"),
    );

    // ── Drag: reposition chart panel independently ──
    const chartDrag = new RichDragListener({
      tandem: tandem.createTandem("chartPanelDragListener"),
      drag: (_event, listener) => {
        this.chartOffset = this.chartOffset.plusXY(listener.modelDelta.x, listener.modelDelta.y);
        this.updateChartPosition();
      },
    });
    this.chartPanel.addInputListener(chartDrag);
    this.chartPanel.disposeEmitter.addListener(() => chartDrag.dispose());
  }

  protected override _doRebuild(): void {
    const { p1, p2 } = this.detector;
    // Keep curvature handle on perpendicular bisector of chord.
    this.detector.p3 = projectPointOntoPerpendicularBisector(this.detector.p3, p1, p2);
    const p3 = this.detector.p3;

    const arcModelPoints = sampleArcPoints(p1, p2, p3, ARC_MIRROR_SAMPLE_COUNT);
    const arcShape = buildPolylineViewShape(arcModelPoints, this.modelViewTransform);
    this.backPath.shape = arcShape;
    this.frontPath.shape = arcShape;
    this.bodyHitPath.shape = arcShape;
    this.ticksPath.shape = this.buildArcTicksShape();

    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.handle3.x = this.modelViewTransform.modelToViewX(p3.x);
    this.handle3.y = this.modelViewTransform.modelToViewY(p3.y);

    this.updateChartPosition();
    this.rebuildEmitter.emit();
  }

  /**
   * Builds a Shape with 5 tick marks perpendicular to the arc at
   * t = 0, 0.25, 0.5, 0.75, 1.0.  Endpoint ticks are slightly longer.
   */
  private buildArcTicksShape(): Shape {
    const { p1, p2, p3 } = this.detector;
    const mvt = this.modelViewTransform;
    const shape = new Shape();

    const TICK_POSITIONS = [0, 0.25, 0.5, 0.75, 1.0] as const;
    const INTERIOR_HALF = 3.5; // px each side
    const ENDPOINT_HALF = 5.5; // px each side — slightly longer at p1/p2

    const circ = circumcenter(p1, p2, p3);
    const vx1 = mvt.modelToViewX(p1.x);
    const vy1 = mvt.modelToViewY(p1.y);
    const vx2 = mvt.modelToViewX(p2.x);
    const vy2 = mvt.modelToViewY(p2.y);

    for (const t of TICK_POSITIONS) {
      const halfLen = t === 0 || t === 1 ? ENDPOINT_HALF : INTERIOR_HALF;
      let vpx: number;
      let vpy: number;
      let nx: number;
      let ny: number;

      if (!circ) {
        // Flat / collinear
        vpx = vx1 + (vx2 - vx1) * t;
        vpy = vy1 + (vy2 - vy1) * t;
        const cLen = Math.hypot(vx2 - vx1, vy2 - vy1) || 1;
        nx = -(vy2 - vy1) / cLen;
        ny = (vx2 - vx1) / cLen;
      } else {
        const { center, radius } = circ;
        const norm2pi = (a: number): number => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const a1 = norm2pi(Math.atan2(p1.y - center.y, p1.x - center.x));
        const a2 = norm2pi(Math.atan2(p2.y - center.y, p2.x - center.x));
        const a3 = norm2pi(Math.atan2(p3.y - center.y, p3.x - center.x));
        const ccwSweep = norm2pi(a2 - a1);
        const ccwDist3 = norm2pi(a3 - a1);
        const sweep = ccwDist3 < ccwSweep ? ccwSweep : -(2 * Math.PI - ccwSweep);
        const angle = a1 + sweep * t;
        const mx = center.x + radius * Math.cos(angle);
        const my = center.y + radius * Math.sin(angle);
        vpx = mvt.modelToViewX(mx);
        vpy = mvt.modelToViewY(my);
        // Radial direction in view space (outward from center)
        const vcx = mvt.modelToViewX(center.x);
        const vcy = mvt.modelToViewY(center.y);
        const rLen = Math.hypot(vpx - vcx, vpy - vcy) || 1;
        nx = (vpx - vcx) / rLen;
        ny = (vpy - vcy) / rLen;
      }

      shape.moveTo(vpx - nx * halfLen, vpy - ny * halfLen);
      shape.lineTo(vpx + nx * halfLen, vpy + ny * halfLen);
    }

    return shape;
  }

  /** Reposition chart panel and wire based on p3 (arc apex) + chartOffset. */
  private updateChartPosition(): void {
    const { p3 } = this.detector;
    const mx = this.modelViewTransform.modelToViewX(p3.x);
    const my = this.modelViewTransform.modelToViewY(p3.y);

    // Place chart at detector midpoint + user-adjustable offset
    this.chartPanel.centerX = mx + this.chartOffset.x;
    this.chartPanel.centerY = my + this.chartOffset.y;

    // Wire from detector midpoint to left edge of chart panel.
    // WireNode crashes if the two endpoints coincide (zero-length cubic),
    // so guarantee a minimum separation.
    const detectorPos = new Vector2(mx, my);
    let chartX = this.chartPanel.left;
    let chartY = this.chartPanel.centerY;
    const sep = Math.hypot(chartX - mx, chartY - my);
    if (sep < 1) {
      // Force a small rightward offset so the bezier has non-zero length
      chartX = mx + 1;
      chartY = my;
    }
    const chartPos = new Vector2(chartX, chartY);

    // Compute a wire normal that points from detector toward chart
    const wireDir = chartPos.minus(detectorPos);
    const wireDirLen = wireDir.magnitude;
    const safeDir = wireDirLen > 1e-6 ? wireDir.timesScalar(1 / wireDirLen) : new Vector2(1, 0);
    const normalVec = safeDir.timesScalar(DETECTOR_WIRE_NORMAL_MAGNITUDE);

    this.wireDetectorPosProperty.value = detectorPos;
    this.wireDetectorNormalProperty.value = normalVec;
    this.wireChartPosProperty.value = chartPos;
    this.wireChartNormalProperty.value = normalVec.negated();
  }

  /** Called after each simulation pass to refresh the chart with new bin data. */
  public updateChart(): void {
    const acquiredBins = this.detector.acquisitionComplete ? this.detector.acquiredBins : null;
    this.chartPanel.update(
      this.detector.hits,
      acquiredBins,
      this.detector.numBins,
      this.detector.totalHitCount,
      this.detector.totalPower,
    );
  }

  public override dispose(): void {
    this.wireDetectorPosProperty.dispose();
    this.wireDetectorNormalProperty.dispose();
    this.wireChartPosProperty.dispose();
    this.wireChartNormalProperty.dispose();
    super.dispose();
  }
}

opticsLab.register("DetectorView", DetectorView);
