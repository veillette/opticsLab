/**
 * OpticalElementViewFactory.ts
 *
 * Factory that creates the appropriate Scenery Node for any OpticalElement.
 * Maps model types to their corresponding view classes.
 */

import type { Node, RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../OpticsLabNamespace.js";
import { ApertureElement } from "../model/blockers/ApertureElement.js";
import { CircleBlocker } from "../model/blockers/CircleBlocker.js";
import { LineBlocker } from "../model/blockers/LineBlocker.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { Glass } from "../model/glass/Glass.js";
import { SphericalLens } from "../model/glass/SphericalLens.js";
import { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import { BeamSource } from "../model/light-sources/BeamSource.js";
import { PointSourceElement } from "../model/light-sources/PointSourceElement.js";
import { SingleRaySource } from "../model/light-sources/SingleRaySource.js";
import { ArcMirror } from "../model/mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "../model/mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import { ApertureView } from "./blockers/ApertureView.js";
import { CircleBlockerView } from "./blockers/CircleBlockerView.js";
import { LineBlockerView } from "./blockers/LineBlockerView.js";
import { CircleGlassView } from "./glass/CircleGlassView.js";
import { HalfPlaneGlassView } from "./glass/HalfPlaneGlassView.js";
import { IdealLensView } from "./glass/IdealLensView.js";
import { GlassView } from "./glass/GlassView.js";
import { SphericalLensView } from "./glass/SphericalLensView.js";
import { ArcLightSourceView } from "./light-sources/ArcLightSourceView.js";
import { BeamSourceView } from "./light-sources/BeamSourceView.js";
import { PointSourceView } from "./light-sources/PointSourceView.js";
import { SingleRaySourceView } from "./light-sources/SingleRaySourceView.js";
import { ArcMirrorView } from "./mirrors/ArcMirrorView.js";
import { BeamSplitterView } from "./mirrors/BeamSplitterView.js";
import { IdealCurvedMirrorView } from "./mirrors/IdealCurvedMirrorView.js";
import { ParabolicMirrorView } from "./mirrors/ParabolicMirrorView.js";
import { SegmentMirrorView } from "./mirrors/SegmentMirrorView.js";

/**
 * An optical element view is a Node that also exposes its body-drag listener
 * so that carousel drag-forwarding can press it programmatically.
 */
export type OpticalElementView = Node & { readonly bodyDragListener: RichDragListener };

/**
 * Create and return a Scenery Node that visually represents the given
 * optical element. Returns null if the element type has no view (e.g.
 * light sources and blockers are handled separately).
 */
export function createOpticalElementView(element: OpticalElement): OpticalElementView | null {
  // ── Light Sources ─────────────────────────────────────────────────────────
  if (element instanceof ArcLightSource) {
    return new ArcLightSourceView(element);
  }
  if (element instanceof PointSourceElement) {
    return new PointSourceView(element);
  }
  if (element instanceof BeamSource) {
    return new BeamSourceView(element);
  }
  if (element instanceof SingleRaySource) {
    return new SingleRaySourceView(element);
  }

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
  if (element instanceof SphericalLens) {
    return new SphericalLensView(element);
  }
  if (element instanceof Glass) {
    return new GlassView(element);
  }
  if (element instanceof HalfPlaneGlass) {
    return new HalfPlaneGlassView(element);
  }

  // ── Blockers ──────────────────────────────────────────────────────────────
  if (element instanceof ApertureElement) {
    return new ApertureView(element);
  }
  if (element instanceof CircleBlocker) {
    return new CircleBlockerView(element);
  }
  if (element instanceof LineBlocker) {
    return new LineBlockerView(element);
  }

  return null;
}

opticsLab.register("createOpticalElementView", createOpticalElementView);
