import { BooleanProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import { MIRROR_BACK_WIDTH, MIRROR_FRONT_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { SegmentMirror } from "../../model/mirrors/SegmentMirror.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";

export class SegmentMirrorView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

  private readonly mirror: SegmentMirror;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(
    mirror: SegmentMirror,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions?: ViewOptionsModel,
  ) {
    super();
    this.mirror = mirror;
    this.modelViewTransform = modelViewTransform;
    const handlesVisibleProperty = viewOptions?.handlesVisibleProperty ?? new BooleanProperty(true);

    this.backPath = new Path(null, {
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.frontPath = new Path(null, {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = makeEndpointHandle(
      () => mirror.p1,
      (p) => {
        mirror.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
      handlesVisibleProperty,
    );
    this.handle2 = makeEndpointHandle(
      () => mirror.p2,
      (p) => {
        mirror.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
      handlesVisibleProperty,
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
          get: () => mirror.p1,
          set: (p) => {
            mirror.p1 = p;
          },
        },
        {
          get: () => mirror.p2,
          set: (p) => {
            mirror.p2 = p;
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

  protected override _doRebuild(): void {
    const { p1, p2 } = this.mirror;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x),
      vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x),
      vy2 = this.modelViewTransform.modelToViewY(p2.y);
    const shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);
    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("SegmentMirrorView", SegmentMirrorView);
