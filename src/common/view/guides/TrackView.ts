/**
 * TrackView.ts
 *
 * View for the TrackElement — a dashed guide line with two endpoint handles.
 * Registers with the TrackRegistry so other elements can snap to it.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { TrackElement } from "../../model/guides/TrackElement.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { trackRegistry } from "../TrackRegistry.js";
import {
  attachEndpointDrag,
  attachTranslationDrag,
  buildLineHitShape,
  createHandle,
  createLineBodyHitPath,
} from "../ViewHelpers.js";

const TRACK_LINE_WIDTH = 2;
const TRACK_LINE_DASH = [8, 4];

export class TrackView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly trackPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly track: TrackElement,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.trackPath = new Path(null, {
      stroke: OpticsLabColors.trackStrokeProperty,
      lineWidth: TRACK_LINE_WIDTH,
      lineDash: TRACK_LINE_DASH,
      lineCap: "round",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = createHandle(track.p1, modelViewTransform);
    this.handle2 = createHandle(track.p2, modelViewTransform);

    this.addChild(this.trackPath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      [
        {
          get: () => track.p1,
          set: (p) => {
            track.p1 = p;
          },
        },
        {
          get: () => track.p2,
          set: (p) => {
            track.p2 = p;
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
      () => track.p1,
      (p) => {
        track.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => track.p2,
      (p) => {
        track.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );

    // Register with the track registry for snap logic.
    trackRegistry.register(
      track.id,
      () => track.p1,
      () => track.p2,
    );
  }

  public override rebuild(): void {
    const { p1, p2 } = this.track;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);
    const shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.trackPath.shape = shape;
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);
    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
    this.rebuildEmitter.emit();
  }

  public override dispose(): void {
    trackRegistry.unregister(this.track.id);
    super.dispose();
  }
}

opticsLab.register("TrackView", TrackView);
