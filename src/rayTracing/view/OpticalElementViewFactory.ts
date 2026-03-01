/**
 * OpticalElementViewFactory.ts
 *
 * Factory that creates the appropriate Scenery Node for any OpticalElement.
 * Maps model types to their corresponding view classes.
 */

import type { Node } from "scenerystack/scenery";
import opticsLab from "../../OpticsLabNamespace.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { PolygonGlass } from "../model/glass/PolygonGlass.js";
import { ArcMirror } from "../model/mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "../model/mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import { CircleGlassView } from "./glass/CircleGlassView.js";
import { HalfPlaneGlassView } from "./glass/HalfPlaneGlassView.js";
import { IdealLensView } from "./glass/IdealLensView.js";
import { PolygonGlassView } from "./glass/PolygonGlassView.js";
import { ArcMirrorView } from "./mirrors/ArcMirrorView.js";
import { BeamSplitterView } from "./mirrors/BeamSplitterView.js";
import { IdealCurvedMirrorView } from "./mirrors/IdealCurvedMirrorView.js";
import { ParabolicMirrorView } from "./mirrors/ParabolicMirrorView.js";
import { SegmentMirrorView } from "./mirrors/SegmentMirrorView.js";

/**
 * Create and return a Scenery Node that visually represents the given
 * optical element. Returns null if the element type has no view (e.g.
 * light sources and blockers are handled separately).
 */
export function createOpticalElementView(element: OpticalElement): Node | null {
  // ── Mirrors ───────────────────────────────────────────────────────────────
  if (element instanceof SegmentMirror) {
    return new SegmentMirrorView(element);
  }
  if (element instanceof ArcMirror) {
    return new ArcMirrorView(element);
  }
  if (element instanceof ParabolicMirror) {
    return new ParabolicMirrorView(element);
  }
  if (element instanceof IdealCurvedMirror) {
    return new IdealCurvedMirrorView(element);
  }
  if (element instanceof BeamSplitterElement) {
    return new BeamSplitterView(element);
  }

  // ── Glass / Lenses ────────────────────────────────────────────────────────
  if (element instanceof IdealLens) {
    return new IdealLensView(element);
  }
  if (element instanceof CircleGlass) {
    return new CircleGlassView(element);
  }
  // PolygonGlass must come after IdealLens / CircleGlass (no overlap), but
  // SphericalLens extends PolygonGlass so this branch handles both.
  if (element instanceof PolygonGlass) {
    return new PolygonGlassView(element);
  }
  if (element instanceof HalfPlaneGlass) {
    return new HalfPlaneGlassView(element);
  }

  // Light sources and blockers are not handled here.
  return null;
}

opticsLab.register("createOpticalElementView", createOpticalElementView);
