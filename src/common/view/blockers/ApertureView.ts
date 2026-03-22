/**
 * ApertureView.ts
 *
 * Scenery node for an aperture element. Rendered as two dark line segments
 * with a gap between them. Handles at p1, p2, p3, p4 allow reshaping.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import { MIRROR_BACK_WIDTH, MIRROR_FRONT_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ApertureElement } from "../../model/blockers/ApertureElement.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { attachTranslationDrag, type DragHandle, makeEndpointHandle } from "../ViewHelpers.js";

export class ApertureView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;
  private readonly handle3: DragHandle;
  private readonly handle4: DragHandle;

  public constructor(
    private readonly aperture: ApertureElement,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.blockerBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.blockerFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
    });
    const rebuild = () => {
      this.rebuild();
    };
    this.handle1 = makeEndpointHandle(
      () => aperture.p1,
      (p) => {
        aperture.p1 = p;
      },
      rebuild,
      modelViewTransform,
    );
    this.handle2 = makeEndpointHandle(
      () => aperture.p2,
      (p) => {
        aperture.p2 = p;
      },
      rebuild,
      modelViewTransform,
    );
    this.handle3 = makeEndpointHandle(
      () => aperture.p3,
      (p) => {
        aperture.p3 = p;
      },
      rebuild,
      modelViewTransform,
    );
    this.handle4 = makeEndpointHandle(
      () => aperture.p4,
      (p) => {
        aperture.p4 = p;
      },
      rebuild,
      modelViewTransform,
    );

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);
    this.addChild(this.handle4);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.backPath,
      [
        {
          get: () => aperture.p1,
          set: (p) => {
            aperture.p1 = p;
          },
        },
        {
          get: () => aperture.p2,
          set: (p) => {
            aperture.p2 = p;
          },
        },
        {
          get: () => aperture.p3,
          set: (p) => {
            aperture.p3 = p;
          },
        },
        {
          get: () => aperture.p4,
          set: (p) => {
            aperture.p4 = p;
          },
        },
      ],
      rebuild,
      modelViewTransform,
    );
  }

  public override rebuild(): void {
    const { p1, p2, p3, p4 } = this.aperture;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);
    const vx3 = this.modelViewTransform.modelToViewX(p3.x);
    const vy3 = this.modelViewTransform.modelToViewY(p3.y);
    const vx4 = this.modelViewTransform.modelToViewX(p4.x);
    const vy4 = this.modelViewTransform.modelToViewY(p4.y);
    // Two segments: p1→p3 and p4→p2 (gap between p3 and p4)
    const shape = new Shape().moveTo(vx1, vy1).lineTo(vx3, vy3).moveTo(vx4, vy4).lineTo(vx2, vy2);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.handle3.syncToModel();
    this.handle4.syncToModel();
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("ApertureView", ApertureView);
