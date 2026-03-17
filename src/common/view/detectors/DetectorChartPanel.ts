/**
 * DetectorChartPanel.ts
 *
 * A Panel containing a Bamboo scatter plot that displays the irradiance
 * profile recorded by a DetectorElement.
 */

import { ChartRectangle, ChartTransform, ScatterPlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Node } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import { PANEL_CORNER_RADIUS, PANEL_X_MARGIN, PANEL_Y_MARGIN } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";

const CHART_WIDTH = 200;
const CHART_HEIGHT = 120;
const DEFAULT_BINS = 64;
const POINT_RADIUS = 2;

export class DetectorChartPanel extends Panel {
  private readonly chartTransform: ChartTransform;
  private readonly scatterPlot: ScatterPlot;

  public constructor() {
    const chartTransform = new ChartTransform({
      viewWidth: CHART_WIDTH,
      viewHeight: CHART_HEIGHT,
      modelXRange: new Range(0, DEFAULT_BINS),
      modelYRange: new Range(0, 1),
    });

    const chartRectangle = new ChartRectangle(chartTransform, {
      fill: OpticsLabColors.detectorChartBackgroundProperty,
      stroke: OpticsLabColors.panelStrokeProperty,
      lineWidth: 0.5,
    });

    const scatterPlot = new ScatterPlot(chartTransform, [], {
      radius: POINT_RADIUS,
      fill: OpticsLabColors.detectorChartBarFillProperty,
    });

    const chartNode = new Node({
      children: [chartRectangle, scatterPlot],
    });

    super(chartNode, {
      fill: OpticsLabColors.panelFillProperty,
      stroke: OpticsLabColors.panelStrokeProperty,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
      tandem: Tandem.OPT_OUT,
    });

    this.chartTransform = chartTransform;
    this.scatterPlot = scatterPlot;
  }

  public update(binData: number[]): void {
    const numBins = binData.length;

    // Auto-scale X range to match number of bins
    this.chartTransform.modelXRange = new Range(0, numBins);

    // Auto-scale Y range to the max observed value
    const maxVal = Math.max(...binData, 1e-10);
    this.chartTransform.modelYRange = new Range(0, maxVal);

    const dataSet = binData.map((v, i) => new Vector2(i + 0.5, v));
    this.scatterPlot.setDataSet(dataSet);
  }
}

opticsLab.register("DetectorChartPanel", DetectorChartPanel);
