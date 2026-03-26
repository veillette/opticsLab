/**
 * DetectorChartPanel.ts
 *
 * A Panel containing a Bamboo histogram that displays the irradiance
 * profile recorded by a DetectorElement. Hits are binned along the
 * detector and shown as two BarPlot layers:
 *
 *  • liveBars     — current simulation frame, binned (faint)
 *  • acquiredBars — accumulated from an acquisition pass (bright), shown
 *                   only after the Acquire button has been used
 *
 * An "Acquire" button below the chart triggers a multi-frame acquisition
 * pass. Bin count is controlled by the element's edit panel slider.
 *
 * Reference tick marks at t = 0, 0.25, 0.5, 0.75, 1.0 cross the bottom
 * border of the chart, matching the ticks drawn on the detector arc itself.
 * A rotated y-axis label identifies the quantity as "Intensity (a.u.)".
 */

import { BarPlot, ChartRectangle, ChartTransform } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Text, VBox } from "scenerystack/scenery";
import { FlatAppearanceStrategy, Panel, RoundPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  DETECTOR_CHART_HEIGHT,
  DETECTOR_CHART_WIDTH,
  DETECTOR_NUM_BINS,
  PANEL_CORNER_RADIUS,
  PANEL_X_MARGIN,
  PANEL_Y_MARGIN,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { DetectorHit } from "../../model/detectors/DetectorElement.js";

/** Normalized positions (0–1) at which reference ticks are drawn. */
const TICK_POSITIONS = [0, 0.25, 0.5, 0.75, 1.0] as const;

/** Tick extends this many px inward (upward into chart) from the bottom border. */
const TICK_INNER_PX = 4;
/** Tick extends this many px outward (downward below bottom border). */
const TICK_OUTER_PX = 5;
/** Endpoint ticks (t=0 and t=1) are taller to mark the full span. */
const ENDPOINT_INNER_PX = 6;
const ENDPOINT_OUTER_PX = 7;

function buildChartTicksShape(chartTransform: ChartTransform): Shape {
  const shape = new Shape();
  for (const t of TICK_POSITIONS) {
    const vx = chartTransform.modelToViewX(t);
    const inner = t === 0 || t === 1 ? ENDPOINT_INNER_PX : TICK_INNER_PX;
    const outer = t === 0 || t === 1 ? ENDPOINT_OUTER_PX : TICK_OUTER_PX;
    shape.moveTo(vx, DETECTOR_CHART_HEIGHT - inner);
    shape.lineTo(vx, DETECTOR_CHART_HEIGHT + outer);
  }
  return shape;
}

export class DetectorChartPanel extends Panel {
  private readonly chartTransform: ChartTransform;
  private readonly liveBars: BarPlot;
  private readonly acquiredBars: BarPlot;
  private currentNumBins: number;

  public constructor(options: { onAcquire: () => void }, tandem?: Tandem) {
    const chartTransform = new ChartTransform({
      viewWidth: DETECTOR_CHART_WIDTH,
      viewHeight: DETECTOR_CHART_HEIGHT,
      modelXRange: new Range(0, 1),
      modelYRange: new Range(0, 1),
    });

    const chartRectangle = new ChartRectangle(chartTransform, {
      fill: OpticsLabColors.detectorChartBackgroundProperty,
      stroke: OpticsLabColors.panelStrokeProperty,
      lineWidth: 0.5,
    });

    const initialBarWidth = DETECTOR_CHART_WIDTH / DETECTOR_NUM_BINS;

    // Faint live histogram (current frame)
    const liveBars = new BarPlot(chartTransform, [], {
      barWidth: initialBarWidth,
      pointToPaintableFields: () => ({ fill: OpticsLabColors.detectorChartBarFillProperty }),
      opacity: 0.35,
    });

    // Bright acquired histogram (post-acquisition)
    const acquiredBars = new BarPlot(chartTransform, [], {
      barWidth: initialBarWidth,
      pointToPaintableFields: () => ({ fill: OpticsLabColors.detectorChartBarFillProperty }),
    });
    acquiredBars.visible = false;

    // Reference tick marks crossing the bottom border of the chart
    const chartTicksPath = new Path(buildChartTicksShape(chartTransform), {
      stroke: OpticsLabColors.detectorTickStrokeProperty,
      lineWidth: 1.5,
      lineCap: "round",
      pickable: false,
    });

    // Y-axis label — rotated 90° to the left of the chart area
    const yAxisLabel = new Text("Intensity (a.u.)", {
      font: "9px sans-serif",
      fill: OpticsLabColors.detectorFrontStrokeProperty,
      rotation: -Math.PI / 2,
      pickable: false,
    });
    // Center vertically; place just left of the chart rectangle
    yAxisLabel.centerY = DETECTOR_CHART_HEIGHT / 2;
    yAxisLabel.right = -8;

    const chartNode = new Node({
      children: [chartRectangle, liveBars, acquiredBars, chartTicksPath, yAxisLabel],
    });

    const recordDot = new Circle(8, { fill: "red" });
    const acquireButton = new RoundPushButton({
      content: recordDot,
      listener: options.onAcquire,
      xMargin: 6,
      yMargin: 6,
      baseColor: OpticsLabColors.panelFillProperty,
      buttonAppearanceStrategy: FlatAppearanceStrategy,
      tandem: tandem?.createTandem("acquireButton") ?? Tandem.OPTIONAL,
    });

    const content = new VBox({
      children: [chartNode, acquireButton],
      spacing: 6,
      align: "center",
    });

    super(content, {
      fill: OpticsLabColors.panelFillProperty,
      stroke: OpticsLabColors.panelStrokeProperty,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
      tandem: tandem ?? Tandem.OPTIONAL,
    });

    this.chartTransform = chartTransform;
    this.liveBars = liveBars;
    this.acquiredBars = acquiredBars;
    this.currentNumBins = DETECTOR_NUM_BINS;
  }

  public update(hits: DetectorHit[], acquiredBins: number[] | null, numBins: number): void {
    // Update bar widths if bin count changed
    if (numBins !== this.currentNumBins) {
      this.currentNumBins = numBins;
      this.liveBars.barWidth = DETECTOR_CHART_WIDTH / numBins;
    }

    // Bin current hits
    const liveBins = new Array(numBins).fill(0) as number[];
    for (const hit of hits) {
      const bin = Math.min(numBins - 1, Math.floor(hit.t * numBins));
      liveBins[bin] = (liveBins[bin] ?? 0) + hit.brightness;
    }

    // Determine Y-axis scale
    let maxVal = 1e-10;
    for (const v of liveBins) {
      if (v > maxVal) {
        maxVal = v;
      }
    }
    if (acquiredBins) {
      for (const v of acquiredBins) {
        if (v > maxVal) {
          maxVal = v;
        }
      }
    }
    this.chartTransform.modelYRange = new Range(0, maxVal * 1.25);

    // Update live bars
    const liveData = liveBins.map((v, i) => new Vector2((i + 0.5) / numBins, v));
    this.liveBars.setDataSet(liveData);

    // Update acquired bars (display at whatever resolution they were collected)
    if (acquiredBins) {
      const acqN = acquiredBins.length;
      this.acquiredBars.barWidth = DETECTOR_CHART_WIDTH / acqN;
      const acquiredData = acquiredBins.map((v, i) => new Vector2((i + 0.5) / acqN, v));
      this.acquiredBars.setDataSet(acquiredData);
      this.acquiredBars.visible = true;
    } else {
      this.acquiredBars.setDataSet([]);
      this.acquiredBars.visible = false;
    }
  }
}

opticsLab.register("DetectorChartPanel", DetectorChartPanel);
