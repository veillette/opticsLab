/**
 * ElementRegistry.ts
 *
 * Central registry that maps each optical element type to its view constructor
 * and edit-controls builder.  Adding a new element type requires only a single
 * entry here; OpticalElementViewFactory and EditControlFactory both delegate to
 * this registry rather than maintaining their own parallel dispatch tables.
 *
 * Serialization/deserialization is intentionally excluded: it belongs in the
 * model layer (OpticsScene.ts) to keep model-view separation intact.
 *
 * Entry ordering matters: more-specific subclasses must appear before their
 * base classes (e.g. BiconvexLens before SphericalLens).
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Node, RichDragListener } from "scenerystack/scenery";
import type { SignConvention } from "../../preferences/OpticsLabPreferencesModel.js";
import { ApertureElement } from "../model/blockers/ApertureElement.js";
import { LineBlocker } from "../model/blockers/LineBlocker.js";
import { DetectorElement } from "../model/detectors/DetectorElement.js";
import type { BaseGlass } from "../model/glass/BaseGlass.js";
import { BiconcaveLens } from "../model/glass/BiconcaveLens.js";
import { BiconvexLens } from "../model/glass/BiconvexLens.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { DovePrism } from "../model/glass/DovePrism.js";
import { EquilateralPrism } from "../model/glass/EquilateralPrism.js";
import { Glass } from "../model/glass/Glass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { ParallelogramPrism } from "../model/glass/ParallelogramPrism.js";
import { PlanoConcaveLens } from "../model/glass/PlanoConcaveLens.js";
import { PlanoConvexLens } from "../model/glass/PlanoConvexLens.js";
import { PorroPrism } from "../model/glass/PorroPrism.js";
import { RightAnglePrism } from "../model/glass/RightAnglePrism.js";
import { SlabGlass } from "../model/glass/SlabGlass.js";
import { SphericalLens } from "../model/glass/SphericalLens.js";
import { ReflectionGrating } from "../model/gratings/ReflectionGrating.js";
import { TransmissionGrating } from "../model/gratings/TransmissionGrating.js";
import { TrackElement } from "../model/guides/TrackElement.js";
import { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import { BeamSource } from "../model/light-sources/BeamSource.js";
import { ContinuousSpectrumSource } from "../model/light-sources/ContinuousSpectrumSource.js";
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
import { DetectorView } from "./detectors/DetectorView.js";
import type { EditControlsResult } from "./edit-controls/EditControlsResult.js";
import {
  buildDovePrismControls,
  buildEquilateralPrismControls,
  buildIdealLensControls,
  buildParallelogramPrismControls,
  buildPorroPrismControls,
  buildRefractiveIndexControls,
  buildRightAnglePrismControls,
  buildSlabGlassControls,
  buildSphericalLensControls,
} from "./edit-controls/GlassEditControls.js";
import {
  buildArcLightSourceControls,
  buildBeamSourceControls,
  buildPointSourceControls,
  buildSingleRaySourceControls,
} from "./edit-controls/LightSourceEditControls.js";
import {
  buildArcMirrorControls,
  buildBeamSplitterControls,
  buildDetectorControls,
  buildGratingControls,
  buildIdealCurvedMirrorControls,
  buildSegmentControls,
} from "./edit-controls/MirrorEditControls.js";
import { BiconcaveLensView } from "./glass/BiconcaveLensView.js";
import { BiconvexLensView } from "./glass/BiconvexLensView.js";
import { CircleGlassView } from "./glass/CircleGlassView.js";
import { GlassView } from "./glass/GlassView.js";
import { HalfPlaneGlassView } from "./glass/HalfPlaneGlassView.js";
import { IdealLensView } from "./glass/IdealLensView.js";
import { PlanoConcaveLensView } from "./glass/PlanoConcaveLensView.js";
import { PlanoConvexLensView } from "./glass/PlanoConvexLensView.js";
import { SphericalLensView } from "./glass/SphericalLensView.js";
import { TypedPrismView } from "./glass/TypedPrismView.js";
import { ReflectionGratingView } from "./gratings/ReflectionGratingView.js";
import { TransmissionGratingView } from "./gratings/TransmissionGratingView.js";
import { TrackView } from "./guides/TrackView.js";
import { ArcLightSourceView } from "./light-sources/ArcLightSourceView.js";
import { BeamSourceView } from "./light-sources/BeamSourceView.js";
import { ContinuousSpectrumSourceView } from "./light-sources/ContinuousSpectrumSourceView.js";
import { PointSourceView } from "./light-sources/PointSourceView.js";
import { SingleRaySourceView } from "./light-sources/SingleRaySourceView.js";
import { ArcMirrorView } from "./mirrors/ArcMirrorView.js";
import { BeamSplitterView } from "./mirrors/BeamSplitterView.js";
import { IdealCurvedMirrorView } from "./mirrors/IdealCurvedMirrorView.js";
import { ParabolicMirrorView } from "./mirrors/ParabolicMirrorView.js";
import { SegmentMirrorView } from "./mirrors/SegmentMirrorView.js";

/** The view type: a Node that also exposes its body-drag listener. */
export type OpticalElementView = Node & { readonly bodyDragListener: RichDragListener };

/** Per-element descriptor used by the registry. */
interface ElementDescriptor {
  /** Returns true when this descriptor applies to the given element. */
  readonly guard: (el: OpticalElement) => boolean;
  /** Create the Scenery view for this element type, or null if not applicable. */
  readonly createView: (el: OpticalElement, mvt: ModelViewTransform2) => OpticalElementView | null;
  /**
   * Build the edit-panel controls for this element type.
   * Absent for elements with no editable properties (e.g. ApertureElement).
   */
  readonly buildEditControls?: (
    el: OpticalElement,
    triggerRebuild: () => void,
    signConvention: SignConvention,
  ) => EditControlsResult;
}

/**
 * Ordered list of element descriptors.  Entries are checked top-to-bottom,
 * so more-specific subclasses must appear before their base classes.
 */
export const ELEMENT_REGISTRY: ElementDescriptor[] = [
  // ── Light Sources ──────────────────────────────────────────────────────────
  {
    guard: (el) => el instanceof ArcLightSource,
    createView: (el, mvt) => new ArcLightSourceView(el as ArcLightSource, mvt),
    buildEditControls: (el, rebuild) => buildArcLightSourceControls(el as ArcLightSource, rebuild),
  },
  {
    guard: (el) => el instanceof PointSourceElement,
    createView: (el, mvt) => new PointSourceView(el as PointSourceElement, mvt),
    buildEditControls: (el, rebuild) => buildPointSourceControls(el as PointSourceElement, rebuild),
  },
  {
    guard: (el) => el instanceof BeamSource,
    createView: (el, mvt) => new BeamSourceView(el as BeamSource, mvt),
    buildEditControls: (el, rebuild) => buildBeamSourceControls(el as BeamSource, rebuild),
  },
  {
    guard: (el) => el instanceof SingleRaySource,
    createView: (el, mvt) => new SingleRaySourceView(el as SingleRaySource, mvt),
    buildEditControls: (el, rebuild) => buildSingleRaySourceControls(el as SingleRaySource, rebuild),
  },
  {
    guard: (el) => el instanceof ContinuousSpectrumSource,
    createView: (el, mvt) => new ContinuousSpectrumSourceView(el as ContinuousSpectrumSource, mvt),
    // No editable properties for ContinuousSpectrumSource.
  },

  // ── Mirrors ────────────────────────────────────────────────────────────────
  {
    guard: (el) => el instanceof SegmentMirror,
    createView: (el, mvt) => new SegmentMirrorView(el as SegmentMirror, mvt),
    buildEditControls: (el, rebuild) => buildSegmentControls(el as SegmentMirror, rebuild),
  },
  {
    guard: (el) => el instanceof ArcMirror,
    createView: (el, mvt) => new ArcMirrorView(el as ArcMirror, mvt),
    buildEditControls: (el, rebuild) => buildArcMirrorControls(el as ArcMirror, rebuild),
  },
  {
    guard: (el) => el instanceof ParabolicMirror,
    createView: (el, mvt) => new ParabolicMirrorView(el as ParabolicMirror, mvt),
    // No editable properties for ParabolicMirror.
  },
  {
    guard: (el) => el instanceof IdealCurvedMirror,
    createView: (el, mvt) => new IdealCurvedMirrorView(el as IdealCurvedMirror, mvt),
    buildEditControls: (el, rebuild) => buildIdealCurvedMirrorControls(el as IdealCurvedMirror, rebuild),
  },
  {
    guard: (el) => el instanceof BeamSplitterElement,
    createView: (el, mvt) => new BeamSplitterView(el as BeamSplitterElement, mvt),
    buildEditControls: (el, rebuild) => buildBeamSplitterControls(el as BeamSplitterElement, rebuild),
  },

  // ── Glass / Lenses (specific subclasses before base classes) ───────────────
  {
    guard: (el) => el instanceof IdealLens,
    createView: (el, mvt) => new IdealLensView(el as IdealLens, mvt),
    buildEditControls: (el, rebuild) => buildIdealLensControls(el as IdealLens, rebuild),
  },
  {
    guard: (el) => el instanceof CircleGlass,
    createView: (el, mvt) => new CircleGlassView(el as CircleGlass, mvt),
    buildEditControls: (el, rebuild) => buildRefractiveIndexControls(el as CircleGlass, rebuild),
  },
  {
    guard: (el) => el instanceof BiconvexLens,
    createView: (el, mvt) => new BiconvexLensView(el as BiconvexLens, mvt),
    buildEditControls: (el, rebuild, signConvention) =>
      buildSphericalLensControls(el as BiconvexLens, rebuild, signConvention),
  },
  {
    guard: (el) => el instanceof BiconcaveLens,
    createView: (el, mvt) => new BiconcaveLensView(el as BiconcaveLens, mvt),
    buildEditControls: (el, rebuild, signConvention) =>
      buildSphericalLensControls(el as BiconcaveLens, rebuild, signConvention),
  },
  {
    guard: (el) => el instanceof PlanoConvexLens,
    createView: (el, mvt) => new PlanoConvexLensView(el as PlanoConvexLens, mvt),
    buildEditControls: (el, rebuild, signConvention) =>
      buildSphericalLensControls(el as PlanoConvexLens, rebuild, signConvention),
  },
  {
    guard: (el) => el instanceof PlanoConcaveLens,
    createView: (el, mvt) => new PlanoConcaveLensView(el as PlanoConcaveLens, mvt),
    buildEditControls: (el, rebuild, signConvention) =>
      buildSphericalLensControls(el as PlanoConcaveLens, rebuild, signConvention),
  },
  {
    guard: (el) => el instanceof SphericalLens,
    createView: (el, mvt) => new SphericalLensView(el as SphericalLens, mvt),
    buildEditControls: (el, rebuild, signConvention) =>
      buildSphericalLensControls(el as SphericalLens, rebuild, signConvention),
  },
  // Typed prisms — checked before generic Glass.
  {
    guard: (el) =>
      el instanceof EquilateralPrism ||
      el instanceof RightAnglePrism ||
      el instanceof PorroPrism ||
      el instanceof SlabGlass ||
      el instanceof ParallelogramPrism ||
      el instanceof DovePrism,
    createView: (el, mvt) =>
      new TypedPrismView(
        el as EquilateralPrism | RightAnglePrism | PorroPrism | SlabGlass | ParallelogramPrism | DovePrism,
        mvt,
      ),
    buildEditControls: (el, rebuild) => {
      if (el instanceof EquilateralPrism) {
        return buildEquilateralPrismControls(el, rebuild);
      }
      if (el instanceof RightAnglePrism) {
        return buildRightAnglePrismControls(el, rebuild);
      }
      if (el instanceof PorroPrism) {
        return buildPorroPrismControls(el, rebuild);
      }
      if (el instanceof SlabGlass) {
        return buildSlabGlassControls(el, rebuild);
      }
      if (el instanceof ParallelogramPrism) {
        return buildParallelogramPrismControls(el, rebuild);
      }
      if (el instanceof DovePrism) {
        return buildDovePrismControls(el, rebuild);
      }
      return { controls: [], refreshCallback: null };
    },
  },
  {
    guard: (el) => el instanceof Glass,
    createView: (el, mvt) => new GlassView(el as Glass, mvt),
    buildEditControls: (el, rebuild) => buildRefractiveIndexControls(el as BaseGlass, rebuild),
  },
  {
    guard: (el) => el instanceof HalfPlaneGlass,
    createView: (el, mvt) => new HalfPlaneGlassView(el as HalfPlaneGlass, mvt),
    buildEditControls: (el, rebuild) => buildRefractiveIndexControls(el as BaseGlass, rebuild),
  },

  // ── Gratings ───────────────────────────────────────────────────────────────
  {
    guard: (el) => el instanceof TransmissionGrating,
    createView: (el, mvt) => new TransmissionGratingView(el as TransmissionGrating, mvt),
    buildEditControls: (el, rebuild) => buildGratingControls(el as TransmissionGrating, rebuild),
  },
  {
    guard: (el) => el instanceof ReflectionGrating,
    createView: (el, mvt) => new ReflectionGratingView(el as ReflectionGrating, mvt),
    buildEditControls: (el, rebuild) => buildGratingControls(el as ReflectionGrating, rebuild),
  },

  // ── Detectors ──────────────────────────────────────────────────────────────
  {
    guard: (el) => el instanceof DetectorElement,
    createView: (el, mvt) => new DetectorView(el as DetectorElement, mvt),
    buildEditControls: (el, rebuild) => buildDetectorControls(el as DetectorElement, rebuild),
  },

  // ── Blockers ───────────────────────────────────────────────────────────────
  {
    guard: (el) => el instanceof ApertureElement,
    createView: (el, mvt) => new ApertureView(el as ApertureElement, mvt),
    // No editable properties for ApertureElement.
  },
  {
    guard: (el) => el instanceof LineBlocker,
    createView: (el, mvt) => new LineBlockerView(el as LineBlocker, mvt),
    buildEditControls: (el, rebuild) => buildSegmentControls(el as LineBlocker, rebuild),
  },

  // ── Guides ─────────────────────────────────────────────────────────────────
  {
    guard: (el) => el instanceof TrackElement,
    createView: (el, mvt) => new TrackView(el as TrackElement, mvt),
    buildEditControls: (el, rebuild) => buildSegmentControls(el as TrackElement, rebuild),
  },
];

/**
 * Create and return a Scenery Node that visually represents the given optical
 * element, or null if no descriptor matches.
 */
export function createOpticalElementView(
  element: OpticalElement,
  modelViewTransform: ModelViewTransform2,
): OpticalElementView | null {
  for (const descriptor of ELEMENT_REGISTRY) {
    if (descriptor.guard(element)) {
      return descriptor.createView(element, modelViewTransform);
    }
  }
  return null;
}

/**
 * Build the property controls appropriate for the given optical element.
 * Returns empty controls when the element has no editable properties or no
 * registry entry matches.
 */
export function buildEditControls(
  element: OpticalElement,
  triggerRebuild: () => void,
  signConvention: SignConvention,
): EditControlsResult {
  for (const descriptor of ELEMENT_REGISTRY) {
    if (descriptor.guard(element) && descriptor.buildEditControls) {
      return descriptor.buildEditControls(element, triggerRebuild, signConvention);
    }
  }
  return { controls: [], refreshCallback: null };
}
