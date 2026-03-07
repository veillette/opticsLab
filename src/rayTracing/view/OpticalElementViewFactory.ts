/**
 * OpticalElementViewFactory.ts
 *
 * Factory that creates the appropriate Scenery Node for any OpticalElement.
 * Maps model types to their corresponding view classes.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Node, RichDragListener } from "scenerystack/scenery";
import opticsLab from "../../OpticsLabNamespace.js";
import { ApertureElement } from "../model/blockers/ApertureElement.js";
import { LineBlocker } from "../model/blockers/LineBlocker.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { Glass } from "../model/glass/Glass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
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
import { LineBlockerView } from "./blockers/LineBlockerView.js";
import { CircleGlassView } from "./glass/CircleGlassView.js";
import { GlassView } from "./glass/GlassView.js";
import { HalfPlaneGlassView } from "./glass/HalfPlaneGlassView.js";
import { IdealLensView } from "./glass/IdealLensView.js";
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
 * optical element. Returns null if the element type has no view.
 */
export function createOpticalElementView(
  element: OpticalElement,
  modelViewTransform: ModelViewTransform2,
): OpticalElementView | null {
  // ── Light Sources ─────────────────────────────────────────────────────────
  if (element instanceof ArcLightSource) {
    return new ArcLightSourceView(element, modelViewTransform);
  }
  if (element instanceof PointSourceElement) {
    return new PointSourceView(element, modelViewTransform);
  }
  if (element instanceof BeamSource) {
    return new BeamSourceView(element, modelViewTransform);
  }
  if (element instanceof SingleRaySource) {
    return new SingleRaySourceView(element, modelViewTransform);
  }

  // ── Mirrors ───────────────────────────────────────────────────────────────
  if (element instanceof SegmentMirror) {
    return new SegmentMirrorView(element, modelViewTransform);
  }
  if (element instanceof ArcMirror) {
    return new ArcMirrorView(element, modelViewTransform);
  }
  if (element instanceof ParabolicMirror) {
    return new ParabolicMirrorView(element, modelViewTransform);
  }
  if (element instanceof IdealCurvedMirror) {
    return new IdealCurvedMirrorView(element, modelViewTransform);
  }
  if (element instanceof BeamSplitterElement) {
    return new BeamSplitterView(element, modelViewTransform);
  }

  // ── Glass / Lenses ────────────────────────────────────────────────────────
  if (element instanceof IdealLens) {
    return new IdealLensView(element, modelViewTransform);
  }
  if (element instanceof CircleGlass) {
    return new CircleGlassView(element, modelViewTransform);
  }
  if (element instanceof SphericalLens) {
    return new SphericalLensView(element, modelViewTransform);
  }
  if (element instanceof Glass) {
    return new GlassView(element, modelViewTransform);
  }
  if (element instanceof HalfPlaneGlass) {
    return new HalfPlaneGlassView(element, modelViewTransform);
  }

  // ── Blockers ──────────────────────────────────────────────────────────────
  if (element instanceof ApertureElement) {
    return new ApertureView(element, modelViewTransform);
  }
  if (element instanceof LineBlocker) {
    return new LineBlockerView(element, modelViewTransform);
  }

  return null;
}

opticsLab.register("createOpticalElementView", createOpticalElementView);
