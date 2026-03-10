/**
 * ReflectionGratingView.ts
 *
 * View for a reflection diffraction grating. Rendered as a mirror-like line
 * segment with angled hatch marks to represent the grooved reflective surface.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Node, Path, type RichDragListener } from "scenerystack/scenery";
import OpticsLabColors from "../../../OpticsLabColors.js";
import { MIRROR_BACK_WIDTH, MIRROR_FRONT_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ReflectionGrating } from "../../model/gratings/ReflectionGrating.js";
import {
  attachEndpointDrag,
  attachTranslationDrag,
  buildLineHitShape,
  createHandle,
  createLineBodyHitPath,
} from "../ViewHelpers.js";

/** Number of groove marks drawn on the grating visual. */
const GROOVE_COUNT = 14;
/** Length of each groove hatch mark in pixels. */
const GROOVE_LENGTH_PX = 6;

export class ReflectionGratingView extends Node {
  public readonly bodyDragListener: RichDragListener;
  public onRebuild: (() => void) | null = null;

  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly groovePath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: Circle;
  private readonly handle2: Circle;

  public constructor(
    private readonly grating: ReflectionGrating,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

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
    this.groovePath = new Path(null, {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: 1,
      pickable: false,
    });
    this.bodyHitPath = createLineBodyHitPath();
    this.handle1 = createHandle(grating.p1, modelViewTransform);
    this.handle2 = createHandle(grating.p2, modelViewTransform);

    this.addChild(this.backPath);
    this.addChild(this.frontPath);
    this.addChild(this.groovePath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      [
        {
          get: () => grating.p1,
          set: (p) => {
            grating.p1 = p;
          },
        },
        {
          get: () => grating.p2,
          set: (p) => {
            grating.p2 = p;
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
      () => grating.p1,
      (p) => {
        grating.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
    attachEndpointDrag(
      this.handle2,
      () => grating.p2,
      (p) => {
        grating.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
    );
  }

  private rebuild(): void {
    const { p1, p2 } = this.grating;
    const vx1 = this.modelViewTransform.modelToViewX(p1.x);
    const vy1 = this.modelViewTransform.modelToViewY(p1.y);
    const vx2 = this.modelViewTransform.modelToViewX(p2.x);
    const vy2 = this.modelViewTransform.modelToViewY(p2.y);

    // Main body line
    const bodyShape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.backPath.shape = bodyShape;
    this.frontPath.shape = bodyShape;
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);

    // Angled groove marks on the back side of the mirror
    const dx = vx2 - vx1;
    const dy = vy2 - vy1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      // Normal pointing to the back side (opposite of reflective side)
      const nx = -dy / len;
      const ny = dx / len;
      // Tangent direction along the grating
      const tx = dx / len;
      const ty = dy / len;
      const grooveShape = new Shape();
      for (let i = 1; i <= GROOVE_COUNT; i++) {
        const t = i / (GROOVE_COUNT + 1);
        const cx = vx1 + dx * t;
        const cy = vy1 + dy * t;
        // Angled hatches slanting away from the surface
        grooveShape.moveTo(cx, cy);
        grooveShape.lineTo(cx - nx * GROOVE_LENGTH_PX + tx * 2, cy - ny * GROOVE_LENGTH_PX + ty * 2);
      }
      this.groovePath.shape = grooveShape;
    }

    this.handle1.x = vx1;
    this.handle1.y = vy1;
    this.handle2.x = vx2;
    this.handle2.y = vy2;
    this.onRebuild?.();
  }
}

opticsLab.register("ReflectionGratingView", ReflectionGratingView);
