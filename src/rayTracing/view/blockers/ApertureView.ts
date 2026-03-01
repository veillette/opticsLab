/**
 * ApertureView.ts
 *
 * Scenery node for an aperture element. Rendered as two dark line segments
 * with a gap between them. Handles at p1, p2, p3, p4 allow reshaping.
 */

import { Shape } from "scenerystack/kite";
import { type Circle, Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ApertureElement } from "../../model/blockers/ApertureElement.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle } from "../ViewHelpers.js";

const BACK_STROKE = "#555";
const BACK_WIDTH = 5;
const FRONT_STROKE = "#222";
const FRONT_WIDTH = 2.5;

export class ApertureView extends Node {
  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;
  private readonly handle3: Circle;
  private readonly handle4: Circle;

  public constructor(private readonly aperture: ApertureElement) {
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
    this.handle1 = createHandle(aperture.p1);
    this.handle2 = createHandle(aperture.p2);
    this.handle3 = createHandle(aperture.p3);
    this.handle4 = createHandle(aperture.p4);

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);
    this.addChild(this.handle4);

    this.rebuild();

    attachTranslationDrag(
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
    );
  }

  private rebuild(): void {
    const { p1, p2, p3, p4 } = this.aperture;
    // Two segments: p1→p3 and p4→p2 (gap between p3 and p4)
    const shape = new Shape().moveTo(p1.x, p1.y).lineTo(p3.x, p3.y).moveTo(p4.x, p4.y).lineTo(p2.x, p2.y);
    this.backPath.shape = shape;
    this.frontPath.shape = shape;
    this.handle1.x = p1.x;
    this.handle1.y = p1.y;
    this.handle2.x = p2.x;
    this.handle2.y = p2.y;
    this.handle3.x = p3.x;
    this.handle3.y = p3.y;
    this.handle4.x = p4.x;
    this.handle4.y = p4.y;
  }
}

opticsLab.register("ApertureView", ApertureView);
