/**
 * PolygonGlassView.ts
 *
 * Scenery node for a polygonal glass element (including SphericalLens,
 * which extends PolygonGlass). Renders the closed polygon path as a
 * translucent blue filled shape with a blue outline.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { PolygonGlass } from "../../model/glass/PolygonGlass.js";

// ── Styling constants ─────────────────────────────────────────────────────────
const GLASS_FILL = "rgba(100, 180, 255, 0.22)";
const GLASS_STROKE = "rgba(60, 130, 210, 0.8)";
const GLASS_STROKE_WIDTH = 1.5;

export class PolygonGlassView extends Node {
  public constructor(glass: PolygonGlass) {
    super();

    // Filter out arc-control vertices; use only "real" polygon vertices
    const verts = glass.path.filter((v) => !v.arc);

    if (verts.length < 2) {
      return;
    }

    const shape = new Shape();
    const first = verts[0];
    if (!first) {
      return;
    }

    shape.moveTo(first.x, first.y);
    for (let i = 1; i < verts.length; i++) {
      const v = verts[i];
      if (v) {
        shape.lineTo(v.x, v.y);
      }
    }
    shape.close();

    const path = new Path(shape, {
      fill: GLASS_FILL,
      stroke: GLASS_STROKE,
      lineWidth: GLASS_STROKE_WIDTH,
    });

    this.addChild(path);
  }
}

opticsLab.register("PolygonGlassView", PolygonGlassView);
