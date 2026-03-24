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
import type { Tandem } from "scenerystack/tandem";
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
import { CircleGlassView } from "./glass/CircleGlassView.js";
import { GlassView } from "./glass/GlassView.js";
import { HalfPlaneGlassView } from "./glass/HalfPlaneGlassView.js";
import { IdealLensView } from "./glass/IdealLensView.js";
import { PlanoLensView } from "./glass/PlanoLensView.js";
import { SphericalLensView } from "./glass/SphericalLensView.js";
import { SymmetricLensView } from "./glass/SymmetricLensView.js";
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
  readonly guard: (element: OpticalElement) => boolean;
  /** Create the Scenery view for this element type, or null if not applicable. */
  readonly createView: (
    element: OpticalElement,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
  ) => OpticalElementView | null;
  /**
   * Build the edit-panel controls for this element type.
   * Absent for elements with no editable properties (e.g. ApertureElement).
   */
  readonly buildEditControls?: (
    element: OpticalElement,
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
    guard: (element) => element instanceof ArcLightSource,
    createView: (element, modelViewTransform, tandem) =>
      new ArcLightSourceView(element as ArcLightSource, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildArcLightSourceControls(element as ArcLightSource, rebuild),
  },
  {
    guard: (element) => element instanceof PointSourceElement,
    createView: (element, modelViewTransform, tandem) =>
      new PointSourceView(element as PointSourceElement, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildPointSourceControls(element as PointSourceElement, rebuild),
  },
  {
    guard: (element) => element instanceof BeamSource,
    createView: (element, modelViewTransform, tandem) =>
      new BeamSourceView(element as BeamSource, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildBeamSourceControls(element as BeamSource, rebuild),
  },
  {
    guard: (element) => element instanceof SingleRaySource,
    createView: (element, modelViewTransform, tandem) =>
      new SingleRaySourceView(element as SingleRaySource, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildSingleRaySourceControls(element as SingleRaySource, rebuild),
  },
  {
    guard: (element) => element instanceof ContinuousSpectrumSource,
    createView: (element, modelViewTransform, tandem) =>
      new ContinuousSpectrumSourceView(element as ContinuousSpectrumSource, modelViewTransform, tandem),
    // No editable properties for ContinuousSpectrumSource.
  },

  // ── Mirrors ────────────────────────────────────────────────────────────────
  {
    guard: (element) => element instanceof SegmentMirror,
    createView: (element, modelViewTransform, tandem) =>
      new SegmentMirrorView(element as SegmentMirror, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildSegmentControls(element as SegmentMirror, rebuild),
  },
  {
    guard: (element) => element instanceof ArcMirror,
    createView: (element, modelViewTransform, tandem) =>
      new ArcMirrorView(element as ArcMirror, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildArcMirrorControls(element as ArcMirror, rebuild),
  },
  {
    guard: (element) => element instanceof ParabolicMirror,
    createView: (element, modelViewTransform, tandem) =>
      new ParabolicMirrorView(element as ParabolicMirror, modelViewTransform, tandem),
    // No editable properties for ParabolicMirror.
  },
  {
    guard: (element) => element instanceof IdealCurvedMirror,
    createView: (element, modelViewTransform, tandem) =>
      new IdealCurvedMirrorView(element as IdealCurvedMirror, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildIdealCurvedMirrorControls(element as IdealCurvedMirror, rebuild),
  },
  {
    guard: (element) => element instanceof BeamSplitterElement,
    createView: (element, modelViewTransform, tandem) =>
      new BeamSplitterView(element as BeamSplitterElement, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildBeamSplitterControls(element as BeamSplitterElement, rebuild),
  },

  // ── Glass / Lenses (specific subclasses before base classes) ───────────────
  {
    guard: (element) => element instanceof IdealLens,
    createView: (element, modelViewTransform, tandem) =>
      new IdealLensView(element as IdealLens, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildIdealLensControls(element as IdealLens, rebuild),
  },
  {
    guard: (element) => element instanceof CircleGlass,
    createView: (element, modelViewTransform, tandem) =>
      new CircleGlassView(element as CircleGlass, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildRefractiveIndexControls(element as CircleGlass, rebuild),
  },
  {
    guard: (element) => element instanceof BiconvexLens,
    createView: (element, modelViewTransform, tandem) =>
      new SymmetricLensView(element as BiconvexLens, modelViewTransform, tandem),
    buildEditControls: (element, rebuild, signConvention) =>
      buildSphericalLensControls(element as BiconvexLens, rebuild, signConvention),
  },
  {
    guard: (element) => element instanceof BiconcaveLens,
    createView: (element, modelViewTransform, tandem) =>
      new SymmetricLensView(element as BiconcaveLens, modelViewTransform, tandem),
    buildEditControls: (element, rebuild, signConvention) =>
      buildSphericalLensControls(element as BiconcaveLens, rebuild, signConvention),
  },
  {
    guard: (element) => element instanceof PlanoConvexLens,
    createView: (element, modelViewTransform, tandem) =>
      new PlanoLensView(element as PlanoConvexLens, modelViewTransform, tandem),
    buildEditControls: (element, rebuild, signConvention) =>
      buildSphericalLensControls(element as PlanoConvexLens, rebuild, signConvention),
  },
  {
    guard: (element) => element instanceof PlanoConcaveLens,
    createView: (element, modelViewTransform, tandem) =>
      new PlanoLensView(element as PlanoConcaveLens, modelViewTransform, tandem),
    buildEditControls: (element, rebuild, signConvention) =>
      buildSphericalLensControls(element as PlanoConcaveLens, rebuild, signConvention),
  },
  {
    guard: (element) => element instanceof SphericalLens,
    createView: (element, modelViewTransform, tandem) =>
      new SphericalLensView(element as SphericalLens, modelViewTransform, tandem),
    buildEditControls: (element, rebuild, signConvention) =>
      buildSphericalLensControls(element as SphericalLens, rebuild, signConvention),
  },
  // Typed prisms — checked before generic Glass.
  {
    guard: (element) =>
      element instanceof EquilateralPrism ||
      element instanceof RightAnglePrism ||
      element instanceof PorroPrism ||
      element instanceof SlabGlass ||
      element instanceof ParallelogramPrism ||
      element instanceof DovePrism,
    createView: (element, modelViewTransform, tandem) =>
      new TypedPrismView(
        element as EquilateralPrism | RightAnglePrism | PorroPrism | SlabGlass | ParallelogramPrism | DovePrism,
        modelViewTransform,
        tandem,
      ),
    buildEditControls: (element, rebuild) => {
      if (element instanceof EquilateralPrism) {
        return buildEquilateralPrismControls(element, rebuild);
      }
      if (element instanceof RightAnglePrism) {
        return buildRightAnglePrismControls(element, rebuild);
      }
      if (element instanceof PorroPrism) {
        return buildPorroPrismControls(element, rebuild);
      }
      if (element instanceof SlabGlass) {
        return buildSlabGlassControls(element, rebuild);
      }
      if (element instanceof ParallelogramPrism) {
        return buildParallelogramPrismControls(element, rebuild);
      }
      if (element instanceof DovePrism) {
        return buildDovePrismControls(element, rebuild);
      }
      return { controls: [], refreshCallback: null };
    },
  },
  {
    guard: (element) => element instanceof Glass,
    createView: (element, modelViewTransform, tandem) => new GlassView(element as Glass, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildRefractiveIndexControls(element as BaseGlass, rebuild),
  },
  {
    guard: (element) => element instanceof HalfPlaneGlass,
    createView: (element, modelViewTransform, tandem) =>
      new HalfPlaneGlassView(element as HalfPlaneGlass, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildRefractiveIndexControls(element as BaseGlass, rebuild),
  },

  // ── Gratings ───────────────────────────────────────────────────────────────
  {
    guard: (element) => element instanceof TransmissionGrating,
    createView: (element, modelViewTransform, tandem) =>
      new TransmissionGratingView(element as TransmissionGrating, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildGratingControls(element as TransmissionGrating, rebuild),
  },
  {
    guard: (element) => element instanceof ReflectionGrating,
    createView: (element, modelViewTransform, tandem) =>
      new ReflectionGratingView(element as ReflectionGrating, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildGratingControls(element as ReflectionGrating, rebuild),
  },

  // ── Detectors ──────────────────────────────────────────────────────────────
  {
    guard: (element) => element instanceof DetectorElement,
    createView: (element, modelViewTransform, tandem) =>
      new DetectorView(element as DetectorElement, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildDetectorControls(element as DetectorElement, rebuild),
  },

  // ── Blockers ───────────────────────────────────────────────────────────────
  {
    guard: (element) => element instanceof ApertureElement,
    createView: (element, modelViewTransform, tandem) =>
      new ApertureView(element as ApertureElement, modelViewTransform, tandem),
    // No editable properties for ApertureElement.
  },
  {
    guard: (element) => element instanceof LineBlocker,
    createView: (element, modelViewTransform, tandem) =>
      new LineBlockerView(element as LineBlocker, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildSegmentControls(element as LineBlocker, rebuild),
  },

  // ── Guides ─────────────────────────────────────────────────────────────────
  {
    guard: (element) => element instanceof TrackElement,
    createView: (element, modelViewTransform, tandem) =>
      new TrackView(element as TrackElement, modelViewTransform, tandem),
    buildEditControls: (element, rebuild) => buildSegmentControls(element as TrackElement, rebuild),
  },
];

/**
 * Create and return a Scenery Node that visually represents the given optical
 * element, or null if no descriptor matches.
 */
export function createOpticalElementView(
  element: OpticalElement,
  modelViewTransform: ModelViewTransform2,
  tandem: Tandem,
): OpticalElementView | null {
  for (const descriptor of ELEMENT_REGISTRY) {
    if (descriptor.guard(element)) {
      return descriptor.createView(element, modelViewTransform, tandem);
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
