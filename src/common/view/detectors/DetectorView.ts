/**
 * DetectorView.ts
 *
 * Scenery node for a line-segment detector. Rendered as a teal line with
 * endpoint handles, a floating irradiance chart panel, and a wire
 * connecting the detector midpoint to the chart.
 *
 * Three drag interactions:
 *  1. handle1 / handle2 — resize the detector segment
 *  2. bodyHitPath — translate the whole detector (chart follows)
 *  3. chartPanel — reposition the chart independently (wire stretches)
 */

import { Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, RichDragListener, type RichDragListener as RichDragListenerType } from "scenerystack/scenery";
import { WireNode } from "scenerystack/scenery-phet";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  DETECTOR_INITIAL_CHART_OFFSET_X,
  DETECTOR_WIRE_NORMAL_MAGNITUDE,
  MIRROR_BACK_WIDTH,
  MIRROR_FRONT_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { DetectorElement } from "../../model/detectors/DetectorElement.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";
import { DetectorChartPanel } from "./DetectorChartPanel.js";

const INITIAL_CHART_OFFSET_Y = 10;

export class DetectorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListenerType;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;
  private readonly chartPanel: DetectorChartPanel;

  /** View-space offset of the chart center from the detector midpoint. */
  private chartOffset = new Vector2(DETECTOR_INITIAL_CHART_OFFSET_X, INITIAL_CHART_OFFSET_Y);

  // Properties driving the WireNode (updated imperatively in rebuild / chart drag).
  // Initialized with separated positions to avoid zero-length cubic bezier crash.
  private readonly wireDetectorPosProperty = new Property(new Vector2(0, 0));
  private readonly wireDetectorNormalProperty = new Property(new Vector2(DETECTOR_WIRE_NORMAL_MAGNITUDE, 0));
  private readonly wireChartPosProperty = new Property(new Vector2(DETECTOR_INITIAL_CHART_OFFSET_X, 0));
  private readonly wireChartNormalProperty = new Property(new Vector2(-DETECTOR_WIRE_NORMAL_MAGNITUDE, 0));

  public constructor(
    private readonly detector: DetectorElement,
    private readonly modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
  ) {
    super();

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.detectorBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.detectorFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = makeEndpointHandle(
      () => detector.p1,
      (p) => {
        detector.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
    );
    this.handle2 = makeEndpointHandle(
      () => detector.p2,
      (p) => {
        detector.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
    );
    this.chartPanel = new DetectorChartPanel();
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
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
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
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("bodyDragListener"),
    );

    // ── Drag: reposition chart panel independently ──
    this.chartPanel.addInputListener(
      new RichDragListener({
        tandem: tandem.createTandem("chartPanelDragListener"),
        drag: (_event, listener) => {
          this.chartOffset = this.chartOffset.plusXY(listener.modelDelta.x, listener.modelDelta.y);
          this.updateChartPosition();
        },
      }),
    );
  }

  public override rebuild(): void {
    const { p1, p2 } = this.detector;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);
    const shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);
    this.handle1.syncToModel();
    this.handle2.syncToModel();

    this.updateChartPosition();
    this.rebuildEmitter.emit();
  }

  /** Reposition chart panel and wire based on current detector midpoint + chartOffset. */
  private updateChartPosition(): void {
    const { p1, p2 } = this.detector;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);
    const mx = (vx1 + vx2) / 2;
    const my = (vy1 + vy2) / 2;

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
    this.chartPanel.update(this.detector.hits);
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
