import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { SegmentMirror } from "../../model/mirrors/SegmentMirror.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const BACK_STROKE = "#666";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#d8d8d8";
const FRONT_WIDTH = 2.5;

export class SegmentMirrorView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(private readonly mirror: SegmentMirror, private readonly mvt: ModelViewTransform2) {
    super();

    this.backPath = new Path(null, { stroke: BACK_STROKE, lineWidth: BACK_WIDTH, lineCap: "round" });
    this.frontPath = new Path(null, { stroke: FRONT_STROKE, lineWidth: FRONT_WIDTH, lineCap: "round" });
    this.handle1 = createHandle(mirror.p1, mvt);
    this.handle2 = createHandle(mirror.p2, mvt);

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.backPath,
      [
        { get: () => mirror.p1, set: (p) => { mirror.p1 = p; } },
        { get: () => mirror.p2, set: (p) => { mirror.p2 = p; } },
      ],
      () => { this.rebuild(); },
      mvt,
    );
    attachEndpointDrag(this.handle1, () => mirror.p1, (p) => { mirror.p1 = p; }, () => { this.rebuild(); }, mvt);
    attachEndpointDrag(this.handle2, () => mirror.p2, (p) => { mirror.p2 = p; }, () => { this.rebuild(); }, mvt);
  }

  private rebuild(): void {
    const { p1, p2 } = this.mirror;
    const vx1 = this.mvt.modelToViewX(p1.x), vy1 = this.mvt.modelToViewY(p1.y);
    const vx2 = this.mvt.modelToViewX(p2.x), vy2 = this.mvt.modelToViewY(p2.y);
    const shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.handle1.x = vx1; this.handle1.y = vy1;
    this.handle2.x = vx2; this.handle2.y = vy2;
  }
}

opticsLab.register("SegmentMirrorView", SegmentMirrorView);
