/**
 * SphericalLensView.ts
 *
 * Scenery node for a spherical lens. Extends GlassView to render the
 * lens path (line segments + circular arcs), and adds focal-point markers
 * (front and back) shown as small magenta squares along the optical axis.
 *
 * Handle vertices are the 4 non-arc path points (indices 0, 1, 3, 4).
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { GlassPathPoint } from "../../model/glass/Glass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import { GlassView } from "./GlassView.js";

const FOCAL_FILL = "rgb(255,0,255)";
const FOCAL_SIZE = 0.03; // metres (was 3px)

function getHandleVerts(lens: SphericalLens): GlassPathPoint[] {
  const p = lens.path;
  if (p.length < 6) {
    return p.filter((v) => !v.arc);
  }
  return [p[0]!, p[1]!, p[3]!, p[4]!];
}

export class SphericalLensView extends GlassView {
  private readonly focalFront: Path;
  private readonly focalBack: Path;

  public constructor(
    private readonly lens: SphericalLens,
    mvt: ModelViewTransform2,
  ) {
    super(lens, mvt, getHandleVerts(lens));

    this.focalFront = new Path(null, { fill: FOCAL_FILL });
    this.focalBack = new Path(null, { fill: FOCAL_FILL });
    this.addChild(this.focalFront);
    this.addChild(this.focalBack);

    this.rebuild();
  }

  protected override rebuild(): void {
    super.rebuild();

    if (!this.lens || this.lens.path.length < 6) {
      return;
    }

    const focal = this.lens.getDFfdBfd();
    if (!(Number.isFinite(focal.ffd) && Number.isFinite(focal.bfd))) {
      this.focalFront.shape = null;
      this.focalBack.shape = null;
      return;
    }

    // Safe: guarded by path.length >= 6 check above
    const v0 = this.lens.path[0] as GlassPathPoint;
    const v1 = this.lens.path[1] as GlassPathPoint;
    const v2 = this.lens.path[2] as GlassPathPoint;
    const v3 = this.lens.path[3] as GlassPathPoint;
    const v4 = this.lens.path[4] as GlassPathPoint;
    const v5 = this.lens.path[5] as GlassPathPoint;

    // Optical-axis midpoints (model space)
    const p1x = (v0.x + v1.x) * 0.5;
    const p1y = (v0.y + v1.y) * 0.5;
    const p2x = (v3.x + v4.x) * 0.5;
    const p2y = (v3.y + v4.y) * 0.5;
    const len = Math.hypot(p2x - p1x, p2y - p1y);

    if (len < 1e-10) {
      this.focalFront.shape = null;
      this.focalBack.shape = null;
      return;
    }

    // Perpendicular direction (model space)
    const dpx = (p2y - p1y) / len;
    const dpy = -(p2x - p1x) / len;
    const { ffd, bfd } = focal;

    // Focal-point positions in model space
    const bfx = v2.x + bfd * dpx;
    const bfy = v2.y + bfd * dpy;
    const ffx = v5.x - ffd * dpx;
    const ffy = v5.y - ffd * dpy;

    // Convert focal-point positions to view space; FOCAL_SIZE is in metres
    const vffx = this.mvt.modelToViewX(ffx);
    const vffy = this.mvt.modelToViewY(ffy);
    const vbfx = this.mvt.modelToViewX(bfx);
    const vbfy = this.mvt.modelToViewY(bfy);
    const vs = Math.abs(this.mvt.modelToViewDeltaX(FOCAL_SIZE));

    this.focalFront.shape = new Shape()
      .moveTo(vffx - vs, vffy - vs)
      .lineTo(vffx + vs, vffy - vs)
      .lineTo(vffx + vs, vffy + vs)
      .lineTo(vffx - vs, vffy + vs)
      .close();
    this.focalBack.shape = new Shape()
      .moveTo(vbfx - vs, vbfy - vs)
      .lineTo(vbfx + vs, vbfy - vs)
      .lineTo(vbfx + vs, vbfy + vs)
      .lineTo(vbfx - vs, vbfy + vs)
      .close();
  }
}

opticsLab.register("SphericalLensView", SphericalLensView);
