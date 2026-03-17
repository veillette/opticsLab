/**
 * ApertureView.ts
 *
 * Scenery node for an aperture element. Rendered as two dark line segments
 * with a gap between them. Handles at p1, p2, p3, p4 allow reshaping.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ApertureElement } from "../../model/blockers/ApertureElement.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const BACK_WIDTH = 5;
const FRONT_WIDTH = 2.5;

export class ApertureView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;
  private readonly handle3: Circle;
  private readonly handle4: Circle;

  public constructor(
    private readonly aperture: ApertureElement,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.blockerBackStrokeProperty,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.blockerFrontStrokeProperty,
      lineWidth: FRONT_WIDTH,
      lineCap: "round",
    });
    this.handle1 = createHandle(aperture.p1, modelViewTransform);
    this.handle2 = createHandle(aperture.p2, modelViewTransform);
    this.handle3 = createHandle(aperture.p3, modelViewTransform);
    this.handle4 = createHandle(aperture.p4, modelViewTransform);

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
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle1,
      () => aperture.p1,
      (p) => {
        aperture.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => aperture.p2,
      (p) => {
        aperture.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle3,
      () => aperture.p3,
      (p) => {
        aperture.p3 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle4,
      () => aperture.p4,
      (p) => {
        aperture.p4 = p;
      },
      () => {
        this.rebuild();
      },
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
    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
    this.handle3.x = vx3;
    this.handle3.y = vy3;
    this.handle4.x = vx4;
    this.handle4.y = vy4;
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("ApertureView", ApertureView);
