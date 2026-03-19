/**
 * DetectorChartPanel.ts
 *
 * A Panel containing a Bamboo scatter plot that displays the irradiance
 * profile recorded by a DetectorElement. Each point represents one ray
 * hit at its exact normalized position along the detector.
 */

import { ChartRectangle, ChartTransform, ScatterPlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Node } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  DETECTOR_CHART_HEIGHT,
  DETECTOR_CHART_POINT_RADIUS,
  DETECTOR_CHART_WIDTH,
  PANEL_CORNER_RADIUS,
  PANEL_X_MARGIN,
  PANEL_Y_MARGIN,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { DetectorHit } from "../../model/detectors/DetectorElement.js";

export class DetectorChartPanel extends Panel {
  private readonly chartTransform: ChartTransform;
  private readonly scatterPlot: ScatterPlot;

  public constructor() {
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

    const scatterPlot = new ScatterPlot(chartTransform, [], {
      radius: DETECTOR_CHART_POINT_RADIUS,
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

  public update(hits: DetectorHit[]): void {
    if (hits.length === 0) {
      this.scatterPlot.setDataSet([]);
      return;
    }

    // Auto-scale Y to the brightest hit
    const maxBrightness = Math.max(...hits.map((h) => h.brightness), 1e-10);
    this.chartTransform.modelYRange = new Range(0, maxBrightness);

    // X axis is always normalized [0, 1]
    const dataSet = hits.map((h) => new Vector2(h.t, h.brightness));
    this.scatterPlot.setDataSet(dataSet);
  }
}

opticsLab.register("DetectorChartPanel", DetectorChartPanel);
