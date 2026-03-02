/**
 * SphericalLensView.ts
 *
 * Scenery node for a spherical lens. Extends PolygonGlassView to render
 * the lens polygon, and adds focal-point markers (front and back) in the
 * spirit of the optics-template SphericalLens. The focal points are shown
 * as small magenta squares along the optical axis.
 */

import { Shape } from "scenerystack/kite";
import { Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PolygonVertex } from "../../model/glass/PolygonGlass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import { distance, normalize, point, subtract } from "../../model/optics/Geometry.js";
import { PolygonGlassView } from "./PolygonGlassView.js";

// ── Focal point styling (matches optics-template magenta) ─────────────────────
const FOCAL_FILL = "rgb(255,0,255)";
const FOCAL_SIZE = 3; // half-size of the square marker

/**
 * Compute front and back focal distances from lens-maker parameters.
 * Returns null if the lens is invalid (e.g. focal length infinite).
 */
function getFocalDistances(lens: SphericalLens): { ffd: number; bfd: number } | null {
  const { diameter: d, r1, r2, refIndex: n } = lens;

  const r1Term = Number.isFinite(r1) ? 1 / r1 : 0;
  const r2Term = Number.isFinite(r2) ? 1 / r2 : 0;
  const dTerm =
    Number.isFinite(r1) && Number.isFinite(r2) && Math.abs(r1) > 1e-10 && Math.abs(r2) > 1e-10
      ? ((n - 1) * d) / (n * r1 * r2)
      : 0;

  const power = (n - 1) * (r1Term - r2Term + dTerm);
  if (Math.abs(power) < 1e-10) {
    return null;
  }
  const f = 1 / power;

  const ffd = f * (1 + ((n - 1) * d) / (n * (Number.isFinite(r2) ? r2 : Infinity)));
  const bfd = f * (1 - ((n - 1) * d) / (n * (Number.isFinite(r1) ? r1 : Infinity)));

  if (!(Number.isFinite(ffd) && Number.isFinite(bfd))) {
    return null;
  }
  return { ffd, bfd };
}

// ARC_SEGMENTS must match the constant in SphericalLens.ts (40).
// 4 distinct handle positions: top rim, left apex, bottom rim, right apex.
const ARC_N = 40;
const HALF_N = ARC_N >> 1;
function sphericalLensHandleVerts(lens: SphericalLens): PolygonVertex[] {
  const path = lens.path;
  const indices = [0, HALF_N, ARC_N, ARC_N + 1 + HALF_N];
  return indices.map((i) => path[i]).filter((v): v is PolygonVertex => v !== undefined);
}

export class SphericalLensView extends PolygonGlassView {
  private readonly focalFront: Path;
  private readonly focalBack: Path;

  public constructor(private readonly lens: SphericalLens) {
    super(lens, sphericalLensHandleVerts(lens));

    this.focalFront = new Path(null, { fill: FOCAL_FILL });
    this.focalBack = new Path(null, { fill: FOCAL_FILL });
    this.addChild(this.focalFront);
    this.addChild(this.focalBack);

    this.rebuild();
  }

  protected override rebuild(): void {
    super.rebuild();

    // Guard: during super(), parameter property may not be set yet
    if (!this.lens) {
      return;
    }

    const focal = getFocalDistances(this.lens);
    if (!focal) {
      this.focalFront.shape = null;
      this.focalBack.shape = null;
      return;
    }

    const { axisP1, axisP2 } = this.lens;
    const d = distance(axisP1, axisP2);
    if (d < 1e-10) {
      this.focalFront.shape = null;
      this.focalBack.shape = null;
      return;
    }

    const axisDir = normalize(subtract(axisP2, axisP1));
    const { ffd, bfd } = focal;

    // Front focal point: from axisP1 (first surface center) going -axisDir by ffd
    const ff = point(axisP1.x - axisDir.x * ffd, axisP1.y - axisDir.y * ffd);
    // Back focal point: from axisP2 (second surface center) going +axisDir by bfd
    const bf = point(axisP2.x + axisDir.x * bfd, axisP2.y + axisDir.y * bfd);

    this.focalFront.shape = new Shape()
      .moveTo(ff.x - FOCAL_SIZE, ff.y - FOCAL_SIZE)
      .lineTo(ff.x + FOCAL_SIZE, ff.y - FOCAL_SIZE)
      .lineTo(ff.x + FOCAL_SIZE, ff.y + FOCAL_SIZE)
      .lineTo(ff.x - FOCAL_SIZE, ff.y + FOCAL_SIZE)
      .close();
    this.focalBack.shape = new Shape()
      .moveTo(bf.x - FOCAL_SIZE, bf.y - FOCAL_SIZE)
      .lineTo(bf.x + FOCAL_SIZE, bf.y - FOCAL_SIZE)
      .lineTo(bf.x + FOCAL_SIZE, bf.y + FOCAL_SIZE)
      .lineTo(bf.x - FOCAL_SIZE, bf.y + FOCAL_SIZE)
      .close();
  }
}

opticsLab.register("SphericalLensView", SphericalLensView);
