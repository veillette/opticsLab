/**
 * BeamSourceView.ts – parallel/divergent beam light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import { BEAM_SOURCE_BEAM_WIDTH, BEAM_SOURCE_SHIELD_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { BeamSource } from "../../model/light-sources/BeamSource.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";

export class BeamSourceView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly shieldPath: Path;
  private readonly beamPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

  public constructor(
    private readonly source: BeamSource,
    private readonly modelViewTransform: ModelViewTransform2,
  ) {
    super();

    this.shieldPath = new Path(null, {
      lineWidth: BEAM_SOURCE_SHIELD_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    this.beamPath = new Path(null, {
      lineWidth: BEAM_SOURCE_BEAM_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    // Invisible filled rectangle used as the drag hit-area.
    // Must sit above all visual paths but below endpoint handles.
    this.bodyHitPath = createLineBodyHitPath();

    const rebuild = () => {
      this.rebuild();
    };
    this.handle1 = makeEndpointHandle(
      () => source.p1,
      (p) => {
        source.p1 = p;
      },
      rebuild,
      modelViewTransform,
    );
    this.handle2 = makeEndpointHandle(
      () => source.p2,
      (p) => {
        source.p2 = p;
      },
      rebuild,
      modelViewTransform,
    );

    this.addChild(this.shieldPath);
    this.addChild(this.beamPath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      [
        {
          get: () => source.p1,
          set: (p) => {
            source.p1 = p;
          },
        },
        {
          get: () => source.p2,
          set: (p) => {
            source.p2 = p;
          },
        },
      ],
      rebuild,
      modelViewTransform,
    );
  }

  public override rebuild(): void {
    const modelViewTransform = this.modelViewTransform;
    const { p1, p2 } = this.source;

    const c = VisibleColor.wavelengthToColor(this.source.wavelength);
    const { r, g, b } = c;
    this.shieldPath.stroke = `rgba(${Math.round(r * 0.47)},${Math.round(g * 0.37)},${Math.round(b * 0.12)},0.85)`;
    this.beamPath.stroke = `rgba(${r},${g},${b},0.92)`;

    const vx1 = modelViewTransform.modelToViewX(p1.x),
      vy1 = modelViewTransform.modelToViewY(p1.y);
    const vx2 = modelViewTransform.modelToViewX(p2.x),
      vy2 = modelViewTransform.modelToViewY(p2.y);

    // Aperture line (visual only)
    const aperture = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.shieldPath.shape = aperture;
    this.beamPath.shape = aperture;

    // Hit area: filled rectangle along the beam
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);

    // Endpoint handles
    this.handle1.syncToModel();
    this.handle2.syncToModel();

    this.rebuildEmitter.emit();
  }
}

opticsLab.register("BeamSourceView", BeamSourceView);
