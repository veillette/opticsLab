/**
 * GridScaleIndicatorNode – a double-headed dimension arrow that shows the
 * distance between two adjacent major grid lines.
 *
 * The arrow spans exactly one grid spacing in view pixels (aligned to the
 * model-view transform so its endpoints coincide with actual grid lines).
 * A label above the shaft reads "X m".  A semi-transparent background pill
 * ensures the indicator is legible against both the dark default and the
 * white projector colour profiles.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import OpticsLabColors from "../../OpticsLabColors.js";
import opticsLab from "../../OpticsLabNamespace.js";

// ── Visual constants (view pixels) ────────────────────────────────────────────
const ARROW_HEAD_LENGTH = 7; // length of each arrowhead arm along the shaft
const ARROW_HEAD_HALF_WIDTH = 4; // half-width of the V at the arrowhead tip
const TICK_HALF_HEIGHT = 6; // half-height of the end tick marks
const LABEL_GAP = 3; // gap between tick tops and label baseline
const BG_X_PAD = 6; // horizontal padding around the background pill
const BG_Y_PAD = 3; // vertical padding around the background pill

export class GridScaleIndicatorNode extends Node {
  private readonly _background: Rectangle;
  private readonly _arrowPath: Path;
  private readonly _label: Text;

  public constructor() {
    super({ pickable: false });

    // Semi-transparent pill – matches the measuring-tape background so it
    // reads well on both dark (default) and light (projector) backgrounds.
    this._background = new Rectangle(0, 0, 1, 1, {
      cornerRadius: 4,
      fill: OpticsLabColors.measuringTapeBackgroundColorProperty,
      opacity: 0.8,
    });

    // Arrow shaft, ticks, and arrowheads – all one stroke-only path.
    // overlayValueFillProperty is #eee on dark backgrounds, #111 on light ones.
    this._arrowPath = new Path(null, {
      stroke: OpticsLabColors.overlayValueFillProperty,
      lineWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
    });

    this._label = new Text("", {
      font: new PhetFont({ size: 11, weight: "bold" }),
      fill: OpticsLabColors.overlayValueFillProperty,
    });

    this.addChild(this._background);
    this.addChild(this._arrowPath);
    this.addChild(this._label);
  }

  /**
   * Rebuild geometry for a new grid spacing.
   *
   * The node's local origin (0, 0) sits at the left tick mark on the shaft
   * centre-line.  After calling this, position the node externally so that
   * `node.left` equals the view-x of the desired left grid line.
   */
  public rebuild(gridSpacing: number, mvt: ModelViewTransform2): void {
    const widthPx = Math.abs(mvt.modelToViewDeltaX(gridSpacing));

    // ── Arrow shape ────────────────────────────────────────────────────────
    const shape = new Shape();

    // Horizontal shaft
    shape.moveTo(0, 0).lineTo(widthPx, 0);

    // Left tick mark
    shape.moveTo(0, -TICK_HALF_HEIGHT).lineTo(0, TICK_HALF_HEIGHT);

    // Right tick mark
    shape.moveTo(widthPx, -TICK_HALF_HEIGHT).lineTo(widthPx, TICK_HALF_HEIGHT);

    // Left arrowhead (V pointing left)
    shape
      .moveTo(ARROW_HEAD_LENGTH, -ARROW_HEAD_HALF_WIDTH)
      .lineTo(0, 0)
      .lineTo(ARROW_HEAD_LENGTH, ARROW_HEAD_HALF_WIDTH);

    // Right arrowhead (V pointing right)
    shape
      .moveTo(widthPx - ARROW_HEAD_LENGTH, -ARROW_HEAD_HALF_WIDTH)
      .lineTo(widthPx, 0)
      .lineTo(widthPx - ARROW_HEAD_LENGTH, ARROW_HEAD_HALF_WIDTH);

    this._arrowPath.shape = shape;

    // ── Label ─────────────────────────────────────────────────────────────
    // All valid spacings are multiples of 0.1, so 1 decimal place suffices
    // unless the value is a whole number.
    const labelStr = Number.isInteger(gridSpacing) ? `${gridSpacing} m` : `${gridSpacing.toFixed(1)} m`;
    this._label.string = labelStr;
    this._label.centerX = widthPx / 2;
    this._label.bottom = -TICK_HALF_HEIGHT - LABEL_GAP;

    // ── Background pill ───────────────────────────────────────────────────
    // Use known geometry rather than path bounds so that stroke half-widths
    // do not shift the pill's left edge away from x=0 (the left gridline).
    const bgTop = this._label.top - BG_Y_PAD;
    const bgBottom = TICK_HALF_HEIGHT + BG_Y_PAD;
    this._background.setRect(-BG_X_PAD, bgTop, widthPx + 2 * BG_X_PAD, bgBottom - bgTop);
  }
}

opticsLab.register("GridScaleIndicatorNode", GridScaleIndicatorNode);
