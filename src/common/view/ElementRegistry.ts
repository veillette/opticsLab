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
 * Each entry is keyed by the element's `type` string (the same string used for
 * serialization), which eliminates fragile ordered instanceof chains. No two
 * entries may share the same typeKey — a startup assertion enforces this.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Node, RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import type { ApertureElement } from "../model/blockers/ApertureElement.js";
import type { LineBlocker } from "../model/blockers/LineBlocker.js";
import type { DetectorElement } from "../model/detectors/DetectorElement.js";
import type { FiberOpticElement } from "../model/fiber/FiberOpticElement.js";
import type { BaseGlass } from "../model/glass/BaseGlass.js";
import type { BiconcaveLens } from "../model/glass/BiconcaveLens.js";
import type { BiconvexLens } from "../model/glass/BiconvexLens.js";
import type { CircleGlass } from "../model/glass/CircleGlass.js";
import type { DovePrism } from "../model/glass/DovePrism.js";
import type { EquilateralPrism } from "../model/glass/EquilateralPrism.js";
import type { Glass } from "../model/glass/Glass.js";
import type { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import type { IdealLens } from "../model/glass/IdealLens.js";
import type { ParallelogramPrism } from "../model/glass/ParallelogramPrism.js";
import type { PlanoConcaveLens } from "../model/glass/PlanoConcaveLens.js";
import type { PlanoConvexLens } from "../model/glass/PlanoConvexLens.js";
import type { PorroPrism } from "../model/glass/PorroPrism.js";
import type { RightAnglePrism } from "../model/glass/RightAnglePrism.js";
import type { SlabGlass } from "../model/glass/SlabGlass.js";
import type { SphericalLens } from "../model/glass/SphericalLens.js";
import type { ReflectionGrating } from "../model/gratings/ReflectionGrating.js";
import type { TransmissionGrating } from "../model/gratings/TransmissionGrating.js";
import type { TrackElement } from "../model/guides/TrackElement.js";
import type { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import type { BeamSource } from "../model/light-sources/BeamSource.js";
import type { ContinuousSpectrumSource } from "../model/light-sources/ContinuousSpectrumSource.js";
import type { DivergentBeam } from "../model/light-sources/DivergentBeam.js";
import type { PointSourceElement } from "../model/light-sources/PointSourceElement.js";
import type { SingleRaySource } from "../model/light-sources/SingleRaySource.js";
import type { AperturedParabolicMirror } from "../model/mirrors/AperturedParabolicMirror.js";
import type { ArcMirror } from "../model/mirrors/ArcMirror.js";
import type { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import type { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import type { ParabolicMirror } from "../model/mirrors/ParabolicMirror.js";
import type { SegmentMirror } from "../model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import { ApertureView } from "./blockers/ApertureView.js";
import { LineBlockerView } from "./blockers/LineBlockerView.js";
import { DetectorView } from "./detectors/DetectorView.js";
import type { EditControlContext, EditControlsResult } from "./edit-controls/EditControlsResult.js";
import {
  buildDovePrismControls,
  buildEquilateralPrismControls,
  buildHalfPlaneGlassControls,
  buildIdealLensControls,
  buildParallelogramPrismControls,
  buildPlanoLensControls,
  buildPorroPrismControls,
  buildRefractiveIndexControls,
  buildRightAnglePrismControls,
  buildSlabGlassControls,
  buildSphericalLensControls,
  buildSymmetricLensControls,
} from "./edit-controls/GlassEditControls.js";
import {
  buildArcLightSourceControls,
  buildBeamSourceControls,
  buildContinuousSpectrumSourceControls,
  buildDivergentBeamControls,
  buildPointSourceControls,
  buildSingleRaySourceControls,
} from "./edit-controls/LightSourceEditControls.js";
import {
  buildApertureControls,
  buildAperturedMirrorControls,
  buildArcMirrorControls,
  buildBeamSplitterControls,
  buildDetectorControls,
  buildFiberOpticControls,
  buildGratingControls,
  buildIdealCurvedMirrorControls,
  buildSegmentControls,
} from "./edit-controls/MirrorEditControls.js";
import { FiberOpticView } from "./fiber/FiberOpticView.js";
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
import { DivergentBeamView } from "./light-sources/DivergentBeamView.js";
import { PointSourceView } from "./light-sources/PointSourceView.js";
import { SingleRaySourceView } from "./light-sources/SingleRaySourceView.js";
import { AperturedParabolicMirrorView } from "./mirrors/AperturedParabolicMirrorView.js";
import { ArcMirrorView } from "./mirrors/ArcMirrorView.js";
import { BeamSplitterView } from "./mirrors/BeamSplitterView.js";
import { IdealCurvedMirrorView } from "./mirrors/IdealCurvedMirrorView.js";
import { ParabolicMirrorView } from "./mirrors/ParabolicMirrorView.js";
import { SegmentMirrorView } from "./mirrors/SegmentMirrorView.js";
import type { ViewOptionsModel } from "./ViewOptionsModel.js";

/** The view type: a Node that also exposes its body-drag listener. */
export type OpticalElementView = Node & { readonly bodyDragListener: RichDragListener };

/** Per-element descriptor used by the registry. */
interface ElementDescriptor {
  /**
   * The element's serialization type string (must match `element.type`).
   * Used for O(1) dispatch — no ordered instanceof chains required.
   */
  readonly typeKey: string;
  /**
   * Localised human-readable label for this element type.
   * Shown in the edit panel title and any other UI that names elements by type.
   * Single source of truth — EditContainerNode reads this instead of maintaining
   * its own parallel TYPE_LABELS map.
   */
  readonly label: TReadOnlyProperty<string>;
  /** Create the Scenery view for this element type, or null if not applicable. */
  readonly createView: (
    element: OpticalElement,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions: ViewOptionsModel,
  ) => OpticalElementView | null;
  /**
   * Build the edit-panel controls for this element type.
   * Absent for elements with no editable properties (e.g. ApertureElement).
   * Display-preference options are forwarded via `context` so the signature
   * stays stable when new preferences are added.
   */
  readonly buildEditControls?: (
    element: OpticalElement,
    triggerRebuild: () => void,
    context: EditControlContext,
  ) => EditControlsResult;
}

/**
 * Registry of element descriptors, keyed by each type's `type` string.
 * Order no longer matters for dispatch — a Map lookup is used instead of a
 * sequential instanceof scan. A startup assertion catches duplicate keys.
 *
 * Each entry includes a `label` (localised display name) so that the edit panel
 * and any other UI that names elements by type has a single source of truth here,
 * rather than maintaining a parallel type→label map elsewhere.
 */
export const ELEMENT_REGISTRY: ElementDescriptor[] = (() => {
  // Labels are resolved once at module-init time via the StringManager singleton.
  const c = StringManager.getInstance().getComponentStrings();

  return [
    // ── Light Sources ────────────────────────────────────────────────────────
    {
      typeKey: "ArcSource",
      label: c.arcSourceStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new ArcLightSourceView(element as ArcLightSource, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildArcLightSourceControls(element as ArcLightSource, rebuild),
    },
    {
      typeKey: "PointSource",
      label: c.pointSourceStringProperty,
      createView: (element, modelViewTransform, tandem) =>
        new PointSourceView(element as PointSourceElement, modelViewTransform, tandem),
      buildEditControls: (element, rebuild) => buildPointSourceControls(element as PointSourceElement, rebuild),
    },
    {
      typeKey: "Beam",
      label: c.beamSourceStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new BeamSourceView(element as BeamSource, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildBeamSourceControls(element as BeamSource, rebuild),
    },
    {
      typeKey: "DivergentBeam",
      label: c.divergentBeamSourceStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new DivergentBeamView(element as DivergentBeam, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildDivergentBeamControls(element as DivergentBeam, rebuild),
    },
    {
      typeKey: "SingleRay",
      label: c.singleRayStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new SingleRaySourceView(element as SingleRaySource, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildSingleRaySourceControls(element as SingleRaySource, rebuild),
    },
    {
      typeKey: "ContinuousSpectrumSource",
      label: c.continuousSpectrumStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new ContinuousSpectrumSourceView(element as ContinuousSpectrumSource, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) =>
        buildContinuousSpectrumSourceControls(element as ContinuousSpectrumSource, rebuild),
    },

    // ── Mirrors ──────────────────────────────────────────────────────────────
    {
      typeKey: "AperturedParabolicMirror",
      label: c.aperturedMirrorStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new AperturedParabolicMirrorView(element as AperturedParabolicMirror, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) =>
        buildAperturedMirrorControls(element as AperturedParabolicMirror, rebuild),
    },
    {
      typeKey: "Mirror",
      label: c.flatMirrorStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new SegmentMirrorView(element as SegmentMirror, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildSegmentControls(element as SegmentMirror, rebuild),
    },
    {
      typeKey: "ArcMirror",
      label: c.arcMirrorStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new ArcMirrorView(element as ArcMirror, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild, { useCurvatureDisplay }) =>
        buildArcMirrorControls(element as ArcMirror, rebuild, useCurvatureDisplay),
    },
    {
      typeKey: "ParabolicMirror",
      label: c.parabolicMirrorStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new ParabolicMirrorView(element as ParabolicMirror, modelViewTransform, tandem, viewOptions),
      // No editable properties for ParabolicMirror.
    },
    {
      typeKey: "IdealMirror",
      label: c.idealMirrorStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new IdealCurvedMirrorView(element as IdealCurvedMirror, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildIdealCurvedMirrorControls(element as IdealCurvedMirror, rebuild),
    },
    {
      typeKey: "BeamSplitter",
      label: c.beamSplitterStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new BeamSplitterView(element as BeamSplitterElement, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildBeamSplitterControls(element as BeamSplitterElement, rebuild),
    },

    // ── Glass / Lenses ───────────────────────────────────────────────────────
    {
      typeKey: "IdealLens",
      label: c.idealLensStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new IdealLensView(element as IdealLens, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildIdealLensControls(element as IdealLens, rebuild),
    },
    {
      typeKey: "CircleGlass",
      label: c.circleGlassStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new CircleGlassView(element as CircleGlass, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildRefractiveIndexControls(element as CircleGlass, rebuild),
    },
    {
      typeKey: "BiconvexLens",
      label: c.biconvexLensStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new SymmetricLensView(element as BiconvexLens, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild, { signConvention, useCurvatureDisplay }) =>
        buildSymmetricLensControls(element as BiconvexLens, rebuild, signConvention, useCurvatureDisplay),
    },
    {
      typeKey: "BiconcaveLens",
      label: c.biconcaveLensStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new SymmetricLensView(element as BiconcaveLens, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild, { signConvention, useCurvatureDisplay }) =>
        buildSymmetricLensControls(element as BiconcaveLens, rebuild, signConvention, useCurvatureDisplay),
    },
    {
      typeKey: "PlanoConvexLens",
      label: c.planoConvexLensStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new PlanoLensView(element as PlanoConvexLens, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild, { signConvention, useCurvatureDisplay }) =>
        buildPlanoLensControls(element as PlanoConvexLens, rebuild, signConvention, useCurvatureDisplay),
    },
    {
      typeKey: "PlanoConcaveLens",
      label: c.planoConcaveLensStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new PlanoLensView(element as PlanoConcaveLens, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild, { signConvention, useCurvatureDisplay }) =>
        buildPlanoLensControls(element as PlanoConcaveLens, rebuild, signConvention, useCurvatureDisplay),
    },
    {
      typeKey: "SphericalLens",
      label: c.sphericalLensStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new SphericalLensView(element as SphericalLens, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild, { signConvention, useCurvatureDisplay }) =>
        buildSphericalLensControls(element as SphericalLens, rebuild, signConvention, useCurvatureDisplay),
    },
    // Typed prisms — each has its own typeKey, no ordering constraints needed.
    {
      typeKey: "EquilateralPrism",
      label: c.equilateralPrismStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TypedPrismView(element as EquilateralPrism, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildEquilateralPrismControls(element as EquilateralPrism, rebuild),
    },
    {
      typeKey: "RightAnglePrism",
      label: c.rightAnglePrismStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TypedPrismView(element as RightAnglePrism, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildRightAnglePrismControls(element as RightAnglePrism, rebuild),
    },
    {
      typeKey: "PorroPrism",
      label: c.porroPrismStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TypedPrismView(element as PorroPrism, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildPorroPrismControls(element as PorroPrism, rebuild),
    },
    {
      typeKey: "SlabGlass",
      label: c.slabGlassStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TypedPrismView(element as SlabGlass, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildSlabGlassControls(element as SlabGlass, rebuild),
    },
    {
      typeKey: "ParallelogramPrism",
      label: c.parallelogramPrismStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TypedPrismView(element as ParallelogramPrism, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildParallelogramPrismControls(element as ParallelogramPrism, rebuild),
    },
    {
      typeKey: "DovePrism",
      label: c.dovePrismStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TypedPrismView(element as DovePrism, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildDovePrismControls(element as DovePrism, rebuild),
    },
    {
      typeKey: "Glass",
      label: c.glassPrismStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new GlassView(element as Glass, modelViewTransform, tandem, undefined, viewOptions?.handlesVisibleProperty),
      buildEditControls: (element, rebuild) => buildRefractiveIndexControls(element as BaseGlass, rebuild),
    },
    {
      typeKey: "PlaneGlass",
      label: c.halfPlaneGlassStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new HalfPlaneGlassView(element as HalfPlaneGlass, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildHalfPlaneGlassControls(element as HalfPlaneGlass, rebuild),
    },

    // ── Gratings ─────────────────────────────────────────────────────────────
    {
      typeKey: "TransmissionGrating",
      label: c.transmissionGratingStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TransmissionGratingView(element as TransmissionGrating, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildGratingControls(element as TransmissionGrating, rebuild),
    },
    {
      typeKey: "ReflectionGrating",
      label: c.reflectionGratingStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new ReflectionGratingView(element as ReflectionGrating, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildGratingControls(element as ReflectionGrating, rebuild),
    },

    // ── Detectors ────────────────────────────────────────────────────────────
    {
      typeKey: "Detector",
      label: c.detectorStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new DetectorView(element as DetectorElement, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild, { useCurvatureDisplay }) =>
        buildDetectorControls(element as DetectorElement, rebuild, useCurvatureDisplay),
    },

    // ── Blockers ─────────────────────────────────────────────────────────────
    {
      typeKey: "Aperture",
      label: c.apertureStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new ApertureView(element as ApertureElement, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildApertureControls(element as ApertureElement, rebuild),
    },
    {
      typeKey: "Blocker",
      label: c.lineBlockerStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new LineBlockerView(element as LineBlocker, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildSegmentControls(element as LineBlocker, rebuild),
    },

    // ── Fiber Optic ──────────────────────────────────────────────────────────
    {
      typeKey: "FiberOptic",
      label: c.fiberOpticStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new FiberOpticView(element as FiberOpticElement, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildFiberOpticControls(element as FiberOpticElement, rebuild),
    },

    // ── Guides ───────────────────────────────────────────────────────────────
    {
      typeKey: "Track",
      label: c.trackStringProperty,
      createView: (element, modelViewTransform, tandem, viewOptions) =>
        new TrackView(element as TrackElement, modelViewTransform, tandem, viewOptions),
      buildEditControls: (element, rebuild) => buildSegmentControls(element as TrackElement, rebuild),
    },
  ];
})();

// Build a Map for O(1) dispatch and validate that no two entries share a typeKey.
const RegistryMap = new Map<string, ElementDescriptor>();
for (const descriptor of ELEMENT_REGISTRY) {
  if (RegistryMap.has(descriptor.typeKey)) {
    throw new Error(`Duplicate typeKey in ELEMENT_REGISTRY: "${descriptor.typeKey}"`);
  }
  RegistryMap.set(descriptor.typeKey, descriptor);
}

/**
 * Create and return a Scenery Node that visually represents the given optical
 * element, or null if no descriptor matches.
 */
export function createOpticalElementView(
  element: OpticalElement,
  modelViewTransform: ModelViewTransform2,
  tandem: Tandem,
  viewOptions: ViewOptionsModel,
): OpticalElementView | null {
  const descriptor = RegistryMap.get(element.type);
  return descriptor ? descriptor.createView(element, modelViewTransform, tandem, viewOptions) : null;
}

/**
 * Build the property controls appropriate for the given optical element.
 * Returns empty controls when the element has no editable properties or no
 * registry entry matches.
 */
export function buildEditControls(
  element: OpticalElement,
  triggerRebuild: () => void,
  context: EditControlContext,
): EditControlsResult {
  const descriptor = RegistryMap.get(element.type);
  if (descriptor?.buildEditControls) {
    return descriptor.buildEditControls(element, triggerRebuild, context);
  }
  return { controls: [], refreshCallback: null };
}

/**
 * Return the localised label for the given element type, or undefined when
 * the type has no registry entry.  EditContainerNode uses this as the single
 * source of truth for element display names — no parallel TYPE_LABELS map
 * needed elsewhere.
 */
export function getElementLabel(typeKey: string): TReadOnlyProperty<string> | undefined {
  return RegistryMap.get(typeKey)?.label;
}
