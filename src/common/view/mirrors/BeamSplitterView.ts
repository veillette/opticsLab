/**
 * BeamSplitterView.ts
 *
 * Scenery node for a beam-splitter element. Rendered as a semi-transparent
 * amber line, visually indicating partial transmission and partial reflection.
 * Endpoint handles and a body-drag region let the user reposition the element.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import { MIRROR_BACK_WIDTH, MIRROR_FRONT_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BeamSplitterElement } from "../../model/mirrors/BeamSplitterElement.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";

export class BeamSplitterView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

  private readonly splitter: BeamSplitterElement;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(splitter: BeamSplitterElement, modelViewTransform: ModelViewTransform2, tandem: Tandem) {
    super();
    this.splitter = splitter;
    this.modelViewTransform = modelViewTransform;

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.beamSplitterBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.beamSplitterFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = makeEndpointHandle(
      () => splitter.p1,
      (p) => {
        splitter.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
    );
    this.handle2 = makeEndpointHandle(
      () => splitter.p2,
      (p) => {
        splitter.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
    );

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      [
        {
          get: () => splitter.p1,
          set: (p) => {
            splitter.p1 = p;
          },
        },
        {
          get: () => splitter.p2,
          set: (p) => {
            splitter.p2 = p;
          },
        },
      ],
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("bodyDragListener"),
    );
  }

  public override rebuild(): void {
    const { p1, p2 } = this.splitter;
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
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("BeamSplitterView", BeamSplitterView);
