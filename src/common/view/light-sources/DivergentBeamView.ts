/**
 * DivergentBeamView.ts – divergent-beam light source.
 * Model coords in metres (y-up); view coords in pixels (y-down).
 *
 * Visual: an aperture line (shield + beam colour), two fan lines showing
 * the divergence half-angle at each endpoint, and endpoint drag handles.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path, type RichDragListener } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import type { Tandem } from "scenerystack/tandem";
import {
  BEAM_SOURCE_BEAM_WIDTH,
  BEAM_SOURCE_DIV_ARM_LENGTH_M,
  BEAM_SOURCE_DIV_LINE_WIDTH,
  BEAM_SOURCE_SHIELD_WIDTH,
} from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { DivergentBeam } from "../../model/light-sources/DivergentBeam.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
} from "../ViewHelpers.js";

export class DivergentBeamView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  private readonly shieldPath: Path;
  private readonly beamPath: Path;
  private readonly fanPath: Path;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

  public constructor(
    private readonly source: DivergentBeam,
    private readonly modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
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
    this.fanPath = new Path(null, {
      lineWidth: BEAM_SOURCE_DIV_LINE_WIDTH,
      lineCap: "round",
      pickable: false,
    });
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
      tandem.createTandem("handle1DragListener"),
    );
    this.handle2 = makeEndpointHandle(
      () => source.p2,
      (p) => {
        source.p2 = p;
      },
      rebuild,
      modelViewTransform,
      tandem.createTandem("handle2DragListener"),
    );

    this.addChild(this.shieldPath);
    this.addChild(this.beamPath);
    this.addChild(this.fanPath);
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
      tandem.createTandem("bodyDragListener"),
    );
  }

  public override rebuild(): void {
    const mvt = this.modelViewTransform;
    const { p1, p2 } = this.source;

    const c = VisibleColor.wavelengthToColor(this.source.wavelength);
    const { r, g, b } = c;
    this.shieldPath.stroke = `rgba(${Math.round(r * 0.47)},${Math.round(g * 0.37)},${Math.round(b * 0.12)},0.85)`;
    this.beamPath.stroke = `rgba(${r},${g},${b},0.92)`;
    this.fanPath.stroke = `rgba(${r},${g},${b},0.50)`;

    const vx1 = mvt.modelToViewX(p1.x),
      vy1 = mvt.modelToViewY(p1.y);
    const vx2 = mvt.modelToViewX(p2.x),
      vy2 = mvt.modelToViewY(p2.y);

    // Aperture line
    const aperture = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    this.shieldPath.shape = aperture;
    this.beamPath.shape = aperture;

    // Hit area
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);

    // Fan lines: from each endpoint, draw two lines at ±emisAngle from the beam normal.
    // The beam normal points perpendicular to the aperture segment.
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = Math.hypot(dx, dy);
    if (segLen > 1e-10) {
      // Normal direction (beam shooting direction), math convention (y-up)
      const normalAngle = Math.atan2(dx, dy) + Math.PI / 2;
      const halfRad = (this.source.emisAngle / 180) * Math.PI;
      const armLen = BEAM_SOURCE_DIV_ARM_LENGTH_M;

      const fanShape = new Shape();
      for (const endpoint of [p1, p2]) {
        const ex = mvt.modelToViewX(endpoint.x);
        const ey = mvt.modelToViewY(endpoint.y);
        for (const sign of [-1, 1]) {
          const angle = normalAngle + sign * halfRad;
          // arm direction in model space (y-up), convert end to view (y-down)
          const tipMx = endpoint.x + Math.cos(angle) * armLen;
          const tipMy = endpoint.y + Math.sin(angle) * armLen;
          fanShape.moveTo(ex, ey);
          fanShape.lineTo(mvt.modelToViewX(tipMx), mvt.modelToViewY(tipMy));
        }
      }
      this.fanPath.shape = fanShape;
    } else {
      this.fanPath.shape = null;
    }

    this.handle1.syncToModel();
    this.handle2.syncToModel();

    this.rebuildEmitter.emit();
  }
}

opticsLab.register("DivergentBeamView", DivergentBeamView);
