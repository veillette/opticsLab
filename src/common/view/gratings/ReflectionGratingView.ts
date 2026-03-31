/**
 * ReflectionGratingView.ts
 *
 * View for a reflection diffraction grating. Rendered as a mirror-like line
 * segment with angled hatch marks to represent the grooved reflective surface.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  MIRROR_BACK_WIDTH,
  MIRROR_FRONT_WIDTH,
  REFLECTION_GRATING_GROOVE_COUNT,
  REFLECTION_GRATING_GROOVE_LENGTH_PX,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { ReflectionGrating } from "../../model/gratings/ReflectionGrating.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";

export class ReflectionGratingView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;

  private readonly backPath: Path;
  private readonly frontPath: Path;
  private readonly groovePath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

  private readonly grating: ReflectionGrating;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(grating: ReflectionGrating, modelViewTransform: ModelViewTransform2, tandem: Tandem) {
    super();
    this.grating = grating;
    this.modelViewTransform = modelViewTransform;

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
    this.handle1 = makeEndpointHandle(
      () => grating.p1,
      (p) => {
        grating.p1 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle1DragListener"),
    );
    this.handle2 = makeEndpointHandle(
      () => grating.p2,
      (p) => {
        grating.p2 = p;
      },
      () => {
        this.rebuild();
      },
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
    );

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
      tandem.createTandem("bodyDragListener"),
    );
  }

  public override rebuild(): void {
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
      for (let i = 1; i <= REFLECTION_GRATING_GROOVE_COUNT; i++) {
        const t = i / (REFLECTION_GRATING_GROOVE_COUNT + 1);
        const cx = vx1 + dx * t;
        const cy = vy1 + dy * t;
        // Angled hatches slanting away from the surface
        grooveShape.moveTo(cx, cy);
        grooveShape.lineTo(
          cx - nx * REFLECTION_GRATING_GROOVE_LENGTH_PX + tx * 2,
          cy - ny * REFLECTION_GRATING_GROOVE_LENGTH_PX + ty * 2,
        );
      }
      this.groovePath.shape = grooveShape;
    }

    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.rebuildEmitter.emit();
  }
}

opticsLab.register("ReflectionGratingView", ReflectionGratingView);
