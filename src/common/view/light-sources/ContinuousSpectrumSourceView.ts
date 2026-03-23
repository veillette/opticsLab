/**
 * ContinuousSpectrumSourceView.ts – continuous-spectrum single-direction light source.
 *
 * Visual elements:
 *   • Rainbow disc at p1 (seven colored arcs, one per spectrum sample).
 *   • White direction line from p1 to p2.
 *   • White arrowhead at p2.
 *   • Draggable handle circle at p2 for direction control.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  CONT_SPECTRUM_ARROW_ARM_FACTOR,
  CONT_SPECTRUM_ARROW_ARM_M,
  CONT_SPECTRUM_ARROW_LINE_WIDTH,
  CONT_SPECTRUM_DIR_LINE_WIDTH,
  CONT_SPECTRUM_RADIUS_PX,
  CONT_SPECTRUM_SAMPLE_WL,
  CONT_SPECTRUM_STROKE_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ContinuousSpectrumSource } from "../../model/light-sources/ContinuousSpectrumSource.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { attachTranslationDrag, type DragHandle, makeEndpointHandle } from "../ViewHelpers.js";

export class ContinuousSpectrumSourceView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;

  private readonly hitArea: Path;
  private readonly rainbowArcs: Path[];
  private readonly dirPath: Path;
  private readonly arrowPath: Path;
  private readonly handleDirection: DragHandle;

  public constructor(
    private readonly source: ContinuousSpectrumSource,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    // Rainbow disc: one arc path per spectrum sample wavelength.
    const arcSpan = (Math.PI * 2) / CONT_SPECTRUM_SAMPLE_WL.length;
    this.rainbowArcs = CONT_SPECTRUM_SAMPLE_WL.map((wl, i) => {
      const c = VisibleColor.wavelengthToColor(wl);
      return new Path(null, {
        stroke: `rgba(${c.r},${c.g},${c.b},0.90)`,
        lineWidth: CONT_SPECTRUM_STROKE_WIDTH,
        cursor: "grab",
        // Store the arc index so rebuild() can reconstruct shapes.
        tagName: `arc-${i}`,
      });
    });

    // Invisible filled circle behind arcs for easy grabbing.
    this.hitArea = new Path(null, {
      fill: "rgba(0,0,0,0)",
      cursor: "grab",
      pickable: true,
    });

    // Store arc span for use in rebuild (matches constructor count).
    this._arcSpan = arcSpan;

    this.dirPath = new Path(null, {
      stroke: OpticsLabColors.sourceDirLineStrokeProperty,
      lineWidth: CONT_SPECTRUM_DIR_LINE_WIDTH,
    });

    this.arrowPath = new Path(null, {
      stroke: OpticsLabColors.sourceDirArrowStrokeProperty,
      lineWidth: CONT_SPECTRUM_ARROW_LINE_WIDTH,
      lineCap: "round",
    });

    this.handleDirection = makeEndpointHandle(
      () => source.p2,
      (p) => {
        source.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );

    this.addChild(this.dirPath);
    this.addChild(this.arrowPath);
    this.addChild(this.hitArea);
    for (const arc of this.rainbowArcs) {
      this.addChild(arc);
    }
    this.addChild(this.handleDirection);

    this.rebuild();

    // Body drag moves both p1 and p2 together.
    const firstArc = this.rainbowArcs[0];
    if (!firstArc) {
      throw new Error("ContinuousSpectrumSourceView: rainbowArcs is empty");
    }
    this.bodyDragListener = attachTranslationDrag(
      firstArc,
      [
        {
          get: () => source.p1,
          set: (p) => {
            source.p1 = p;
          },
        },
        {
          get: () => source.p2,
          set: (p) => {
            source.p2 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );

    // Make hit area and all remaining rainbow arcs respond as one drag body.
    this.hitArea.addInputListener(this.bodyDragListener.dragListener);
    for (let i = 1; i < this.rainbowArcs.length; i++) {
      const arc = this.rainbowArcs[i];
      if (!arc) {
        continue;
      }
      arc.cursor = "grab";
      arc.addInputListener(this.bodyDragListener.dragListener);
    }
  }

  private readonly _arcSpan: number;

  private rayDir(): { x: number; y: number } {
    const { p1, p2 } = this.source;
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  private perpUnit(): { x: number; y: number } {
    const d = this.rayDir();
    return { x: -d.y, y: d.x };
  }

  public override rebuild(): void {
    const modelViewTransform = this.modelViewTransform;
    const { p1, p2 } = this.source;

    const vcx = modelViewTransform.modelToViewX(p1.x);
    const vcy = modelViewTransform.modelToViewY(p1.y);
    const vx2 = modelViewTransform.modelToViewX(p2.x);
    const vy2 = modelViewTransform.modelToViewY(p2.y);

    // Invisible filled circle for easy grabbing.
    this.hitArea.shape = Shape.circle(vcx, vcy, CONT_SPECTRUM_RADIUS_PX);

    // Rebuild rainbow disc arcs.
    for (let i = 0; i < this.rainbowArcs.length; i++) {
      const startAngle = i * this._arcSpan;
      const endAngle = startAngle + this._arcSpan;
      const arc = this.rainbowArcs[i];
      if (arc) {
        arc.shape = new Shape().arc(vcx, vcy, CONT_SPECTRUM_RADIUS_PX, startAngle, endAngle);
      }
    }

    // Direction line.
    this.dirPath.shape = new Shape().moveTo(vcx, vcy).lineTo(vx2, vy2);

    // Arrowhead at p2.
    const dir = this.rayDir();
    const perp = this.perpUnit();
    const arm = CONT_SPECTRUM_ARROW_ARM_M;
    const cross = arm * CONT_SPECTRUM_ARROW_ARM_FACTOR;
    const tip1mx = p2.x - dir.x * arm + perp.x * cross;
    const tip1my = p2.y - dir.y * arm + perp.y * cross;
    const tip2mx = p2.x - dir.x * arm - perp.x * cross;
    const tip2my = p2.y - dir.y * arm - perp.y * cross;
    const arrowShape = new Shape();
    arrowShape
      .moveTo(vx2, vy2)
      .lineTo(modelViewTransform.modelToViewX(tip1mx), modelViewTransform.modelToViewY(tip1my));
    arrowShape
      .moveTo(vx2, vy2)
      .lineTo(modelViewTransform.modelToViewX(tip2mx), modelViewTransform.modelToViewY(tip2my));
    this.arrowPath.shape = arrowShape;

    this.handleDirection.syncToModel();
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("ContinuousSpectrumSourceView", ContinuousSpectrumSourceView);
