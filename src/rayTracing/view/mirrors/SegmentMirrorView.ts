/**
 * SegmentMirrorView.ts
 *
 * Scenery node for a flat (segment) mirror. Renders as a silver reflective
 * line with a dark backing, matching the classic optics-diagram style.
 * Endpoint handles and a body-drag region let the user reshape and reposition
 * the mirror interactively.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { SegmentMirror } from "../../model/mirrors/SegmentMirror.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const BACK_STROKE = "#666";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#d8d8d8";
const FRONT_WIDTH = 2.5;

export class SegmentMirrorView extends Node {
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(private readonly mirror: SegmentMirror) {
    super();

    this.backPath = new Path(null, {
      stroke: BACK_STROKE,
      lineWidth: BACK_WIDTH,
      lineCap: "round",
    });
    this.frontPath = new Path(null, {
      stroke: FRONT_STROKE,
      lineWidth: FRONT_WIDTH,
      lineCap: "round",
    });
    this.handle1 = createHandle(mirror.p1);
    this.handle2 = createHandle(mirror.p2);

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    attachTranslationDrag(
      this.backPath,
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
    );
    attachEndpointDrag(
      this.handle1,
      () => mirror.p1,
      (p) => {
        mirror.p1 = p;
      },
      () => {
        this.rebuild();
      },
    );
    attachEndpointDrag(
      this.handle2,
      () => mirror.p2,
      (p) => {
        mirror.p2 = p;
      },
      () => {
        this.rebuild();
      },
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.mirror;
    const shape = new Shape().moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.handle1.x = p1.x;
    this.handle1.y = p1.y;
    this.handle2.x = p2.x;
    this.handle2.y = p2.y;
  }
}

opticsLab.register("SegmentMirrorView", SegmentMirrorView);
