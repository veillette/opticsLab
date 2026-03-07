/**
 * BeamSplitterView.ts
 *
 * Scenery node for a beam-splitter element. Rendered as a semi-transparent
 * amber line, visually indicating partial transmission and partial reflection.
 * Endpoint handles and a body-drag region let the user reposition the element.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import { MIRROR_BACK_WIDTH, MIRROR_FRONT_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BeamSplitterElement } from "../../model/mirrors/BeamSplitterElement.js";
import {
  attachEndpointDrag,
  attachTranslationDrag,
  buildLineHitShape,
  createHandle,
  createLineBodyHitPath,
} from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "rgba(100, 90, 0, 0.5)";
const FRONT_STROKE = "rgba(220, 200, 60, 0.85)";

export class BeamSplitterView extends Node {
  public readonly bodyDragListener: RichDragListener;
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly splitter: BeamSplitterElement,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.backPath = new Path(null, {
      stroke: BACK_STROKE,
      lineWidth: MIRROR_BACK_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.frontPath = new Path(null, {
      stroke: FRONT_STROKE,
      lineWidth: MIRROR_FRONT_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = createHandle(splitter.p1, modelViewTransform);
    this.handle2 = createHandle(splitter.p2, modelViewTransform);

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
    );
    attachEndpointDrag(
      this.handle1,
      () => splitter.p1,
      (p) => {
        splitter.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => splitter.p2,
      (p) => {
        splitter.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.splitter;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);
    const shape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);
    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
  }
}

opticsLab.register("BeamSplitterView", BeamSplitterView);
