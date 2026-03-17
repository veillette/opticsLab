/**
 * DetectorChartPanel.ts
 *
 * A Panel containing a Bamboo bar chart that displays the irradiance
 * profile recorded by a DetectorElement.
 */

import { BarPlot, ChartRectangle, ChartTransform } from "scenerystack/bamboo";
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

export class DetectorChartPanel extends Panel {
  private readonly chartTransform: ChartTransform;
  private readonly barPlot: BarPlot;
  private currentNumBins = DEFAULT_BINS;

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

    const emptyData = Array.from({ length: DEFAULT_BINS }, (_, i) => new Vector2(i + 0.5, 0));
    const barPlot = new BarPlot(chartTransform, emptyData, {
      barWidth: CHART_WIDTH / DEFAULT_BINS,
      pointToPaintableFields: () => ({
        fill: OpticsLabColors.detectorChartBarFillProperty,
      }),
    });

    const chartNode = new Node({
      children: [chartRectangle, barPlot],
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
    this.barPlot = barPlot;
  }

  public update(binData: number[]): void {
    const numBins = binData.length;

    // Adjust X range and bar width when bin count changes
    if (numBins !== this.currentNumBins) {
      this.currentNumBins = numBins;
      this.chartTransform.modelXRange = new Range(0, numBins);
      this.barPlot.barWidth = CHART_WIDTH / numBins;
    }

    const maxVal = Math.max(...binData, 1e-10);
    this.chartTransform.modelYRange = new Range(0, maxVal);

    const dataSet = binData.map((v, i) => new Vector2(i + 0.5, v));
    this.barPlot.setDataSet(dataSet);
  }
}

opticsLab.register("DetectorChartPanel", DetectorChartPanel);
