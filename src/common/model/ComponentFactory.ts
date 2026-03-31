/**
 * ComponentFactory.ts
 *
 * Model-layer factory for creating default instances of every optical element
 * type available in the carousel.  Centralising construction here means the
 * view layer (ComponentCarousel) no longer needs to import every model class;
 * it only needs this file.
 *
 * cx, cy are in MODEL coordinates (metres, y-up, origin at screen centre).
 */

import {
  APERTURED_MIRROR_APERTURE_DEFAULT_M,
  CAROUSEL_DEFAULT_HALF_SIZE_M,
  DEFAULT_ARC_BRIGHTNESS,
  DEFAULT_ARC_CONE_HALF_ANGLE_RAD,
  DEFAULT_BEAM_BRIGHTNESS,
  DEFAULT_BEAM_SPLITTER_TRANSMIT,
  DEFAULT_BEAM_WAVELENGTH_NM,
  DEFAULT_BICONCAVE_RADIUS_M,
  DEFAULT_COMPONENT_GLASS_INDEX,
  DEFAULT_CONVEX_RADIUS_M,
  DEFAULT_IDEAL_LENS_FOCAL_M,
  DEFAULT_IDEAL_MIRROR_FOCAL_M,
  DEFAULT_POINT_SOURCE_BRIGHTNESS,
  DEFAULT_SINGLE_RAY_BRIGHTNESS,
  FACTORY_APERTURE_NOTCH_SCALE,
  FACTORY_BEAM_SPLITTER_DIAG_SCALE,
  FACTORY_CIRCLE_GLASS_RADIUS_SCALE,
  FACTORY_CURVED_MIRROR_BULGE_SCALE,
  FACTORY_DOVE_LENGTH_SCALE,
  FACTORY_DOVE_THICKNESS_SCALE,
  FACTORY_EQUILATERAL_SCALE,
  FACTORY_FIBER_OPTIC_LENGTH_SCALE,
  FACTORY_HALF_PLANE_SPAN_SCALE,
  FACTORY_PARALLELOGRAM_SKEW_SCALE,
  FACTORY_PARALLELOGRAM_WIDTH_SCALE,
  FACTORY_PORRO_SCALE,
  FACTORY_PRISM_APEX_SCALE,
  FACTORY_PRISM_BASE_CORNER_SCALE,
  FACTORY_PRISM_BASE_DEPTH_SCALE,
  FACTORY_RIGHT_ANGLE_SCALE,
  FACTORY_SLAB_THICKNESS_SCALE,
  FACTORY_SLAB_WIDTH_SCALE,
} from "../../OpticsLabConstants.js";
import { ApertureElement } from "./blockers/ApertureElement.js";
import { LineBlocker } from "./blockers/LineBlocker.js";
import { DetectorElement } from "./detectors/DetectorElement.js";
import { FiberOpticElement } from "./fiber/FiberOpticElement.js";
import { BiconcaveLens } from "./glass/BiconcaveLens.js";
import { BiconvexLens } from "./glass/BiconvexLens.js";
import { CircleGlass } from "./glass/CircleGlass.js";
import { DovePrism } from "./glass/DovePrism.js";
import { EquilateralPrism } from "./glass/EquilateralPrism.js";
import { Glass } from "./glass/Glass.js";
import { HalfPlaneGlass } from "./glass/HalfPlaneGlass.js";
import { IdealLens } from "./glass/IdealLens.js";
import { ParallelogramPrism } from "./glass/ParallelogramPrism.js";
import { PlanoConcaveLens } from "./glass/PlanoConcaveLens.js";
import { PlanoConvexLens } from "./glass/PlanoConvexLens.js";
import { PorroPrism } from "./glass/PorroPrism.js";
import { RightAnglePrism } from "./glass/RightAnglePrism.js";
import { SlabGlass } from "./glass/SlabGlass.js";
import { SphericalLens } from "./glass/SphericalLens.js";
import { ReflectionGrating } from "./gratings/ReflectionGrating.js";
import { TransmissionGrating } from "./gratings/TransmissionGrating.js";
import { TrackElement } from "./guides/TrackElement.js";
import { ArcLightSource } from "./light-sources/ArcLightSource.js";
import { BeamSource } from "./light-sources/BeamSource.js";
import { ContinuousSpectrumSource } from "./light-sources/ContinuousSpectrumSource.js";
import { DivergentBeam } from "./light-sources/DivergentBeam.js";
import { PointSourceElement } from "./light-sources/PointSourceElement.js";
import { SingleRaySource } from "./light-sources/SingleRaySource.js";
import { AperturedParabolicMirror } from "./mirrors/AperturedParabolicMirror.js";
import { ArcMirror } from "./mirrors/ArcMirror.js";
import { BeamSplitterElement } from "./mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "./mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "./mirrors/ParabolicMirror.js";
import { SegmentMirror } from "./mirrors/SegmentMirror.js";
import type { OpticalElement } from "./optics/OpticsTypes.js";

/** Unique key for each component type available in the carousel. */
export type ComponentKey =
  | "transmissionGrating"
  | "reflectionGrating"
  | "beam"
  | "divergentBeam"
  | "singleRay"
  | "continuousSpectrum"
  | "arcSource"
  | "pointSource"
  | "sphericalLens"
  | "biconvexLens"
  | "biconcaveLens"
  | "planoConvexLens"
  | "planoConcaveLens"
  | "idealLens"
  | "circleGlass"
  | "prism"
  | "equilateralPrism"
  | "rightAnglePrism"
  | "porroPrism"
  | "slabGlass"
  | "parallelogramPrism"
  | "dovePrism"
  | "halfPlaneGlass"
  | "flatMirror"
  | "arcMirror"
  | "idealMirror"
  | "parabolicMirror"
  | "aperturedMirror"
  | "lineBlocker"
  | "detector"
  | "aperture"
  | "beamSplitter"
  | "track"
  | "fiberOptic";

// ── Default construction parameters ─────────────────────────────────────────

const S = CAROUSEL_DEFAULT_HALF_SIZE_M;
const halfS = S / 2;

// ── Factory map ──────────────────────────────────────────────────────────────

const FACTORIES: Record<ComponentKey, (cx: number, cy: number) => OpticalElement> = {
  transmissionGrating: (cx, cy) => new TransmissionGrating({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
  reflectionGrating: (cx, cy) => new ReflectionGrating({ x: cx, y: cy - S }, { x: cx, y: cy + S }),

  beam: (cx, cy) =>
    new BeamSource(
      { x: cx, y: cy - halfS },
      { x: cx, y: cy + halfS },
      DEFAULT_BEAM_BRIGHTNESS,
      DEFAULT_BEAM_WAVELENGTH_NM,
    ),
  divergentBeam: (cx, cy) =>
    new DivergentBeam(
      { x: cx, y: cy - halfS },
      { x: cx, y: cy + halfS },
      DEFAULT_BEAM_BRIGHTNESS,
      DEFAULT_BEAM_WAVELENGTH_NM,
    ),
  singleRay: (cx, cy) =>
    new SingleRaySource({ x: cx - halfS, y: cy }, { x: cx + halfS, y: cy }, DEFAULT_SINGLE_RAY_BRIGHTNESS),
  continuousSpectrum: (cx, cy) => new ContinuousSpectrumSource({ x: cx - halfS, y: cy }, { x: cx + halfS, y: cy }),
  arcSource: (cx, cy) =>
    new ArcLightSource({ x: cx, y: cy }, 0, DEFAULT_ARC_CONE_HALF_ANGLE_RAD, DEFAULT_ARC_BRIGHTNESS),
  pointSource: (cx, cy) => new PointSourceElement({ x: cx, y: cy }, DEFAULT_POINT_SOURCE_BRIGHTNESS),

  sphericalLens: (cx, cy) =>
    new SphericalLens(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      DEFAULT_CONVEX_RADIUS_M,
      DEFAULT_BICONCAVE_RADIUS_M,
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),
  biconvexLens: (cx, cy) =>
    new BiconvexLens(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      DEFAULT_CONVEX_RADIUS_M,
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),
  biconcaveLens: (cx, cy) =>
    new BiconcaveLens(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      DEFAULT_CONVEX_RADIUS_M,
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),
  planoConvexLens: (cx, cy) =>
    new PlanoConvexLens(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      DEFAULT_CONVEX_RADIUS_M,
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),
  planoConcaveLens: (cx, cy) =>
    new PlanoConcaveLens(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      DEFAULT_CONVEX_RADIUS_M,
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),
  idealLens: (cx, cy) => new IdealLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, DEFAULT_IDEAL_LENS_FOCAL_M),
  circleGlass: (cx, cy) =>
    new CircleGlass(
      { x: cx, y: cy },
      { x: cx + S * FACTORY_CIRCLE_GLASS_RADIUS_SCALE, y: cy },
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),
  prism: (cx, cy) =>
    new Glass(
      [
        { x: cx, y: cy + S * FACTORY_PRISM_APEX_SCALE },
        { x: cx + S * FACTORY_PRISM_BASE_CORNER_SCALE, y: cy - S * FACTORY_PRISM_BASE_DEPTH_SCALE },
        { x: cx - S * FACTORY_PRISM_BASE_CORNER_SCALE, y: cy - S * FACTORY_PRISM_BASE_DEPTH_SCALE },
      ],
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),
  equilateralPrism: (cx, cy) => new EquilateralPrism({ x: cx, y: cy }, S * FACTORY_EQUILATERAL_SCALE),
  rightAnglePrism: (cx, cy) => new RightAnglePrism({ x: cx, y: cy }, S * FACTORY_RIGHT_ANGLE_SCALE),
  porroPrism: (cx, cy) => new PorroPrism({ x: cx, y: cy }, S * FACTORY_PORRO_SCALE),
  slabGlass: (cx, cy) =>
    new SlabGlass({ x: cx, y: cy }, S * FACTORY_SLAB_WIDTH_SCALE, S * FACTORY_SLAB_THICKNESS_SCALE),
  parallelogramPrism: (cx, cy) =>
    new ParallelogramPrism(
      { x: cx, y: cy },
      S * FACTORY_PARALLELOGRAM_WIDTH_SCALE,
      S * FACTORY_PARALLELOGRAM_SKEW_SCALE,
    ),
  dovePrism: (cx, cy) =>
    new DovePrism({ x: cx, y: cy }, S * FACTORY_DOVE_LENGTH_SCALE, S * FACTORY_DOVE_THICKNESS_SCALE),
  halfPlaneGlass: (cx, cy) =>
    new HalfPlaneGlass(
      { x: cx, y: cy + S * FACTORY_HALF_PLANE_SPAN_SCALE },
      { x: cx, y: cy - S * FACTORY_HALF_PLANE_SPAN_SCALE },
      DEFAULT_COMPONENT_GLASS_INDEX,
    ),

  flatMirror: (cx, cy) => new SegmentMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
  arcMirror: (cx, cy) =>
    new ArcMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, { x: cx + S * FACTORY_CURVED_MIRROR_BULGE_SCALE, y: cy }),
  idealMirror: (cx, cy) =>
    new IdealCurvedMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, DEFAULT_IDEAL_MIRROR_FOCAL_M),
  parabolicMirror: (cx, cy) =>
    new ParabolicMirror(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      { x: cx + S * FACTORY_CURVED_MIRROR_BULGE_SCALE, y: cy },
    ),
  aperturedMirror: (cx, cy) =>
    new AperturedParabolicMirror(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      { x: cx + S * FACTORY_CURVED_MIRROR_BULGE_SCALE, y: cy },
      APERTURED_MIRROR_APERTURE_DEFAULT_M,
    ),

  lineBlocker: (cx, cy) => new LineBlocker({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
  detector: (cx, cy) =>
    new DetectorElement(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      { x: cx + S * FACTORY_CURVED_MIRROR_BULGE_SCALE, y: cy },
    ),
  aperture: (cx, cy) =>
    new ApertureElement(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      { x: cx, y: cy - S * FACTORY_APERTURE_NOTCH_SCALE },
      { x: cx, y: cy + S * FACTORY_APERTURE_NOTCH_SCALE },
    ),
  beamSplitter: (cx, cy) =>
    new BeamSplitterElement(
      { x: cx - S * FACTORY_BEAM_SPLITTER_DIAG_SCALE, y: cy - S * FACTORY_BEAM_SPLITTER_DIAG_SCALE },
      { x: cx + S * FACTORY_BEAM_SPLITTER_DIAG_SCALE, y: cy + S * FACTORY_BEAM_SPLITTER_DIAG_SCALE },
      DEFAULT_BEAM_SPLITTER_TRANSMIT,
    ),

  track: (cx, cy) => new TrackElement({ x: cx - S, y: cy }, { x: cx + S, y: cy }),

  // Fiber optic: long and narrow, oriented horizontally with 3 interior control points
  fiberOptic: (cx, cy) =>
    new FiberOpticElement(
      { x: cx - S * FACTORY_FIBER_OPTIC_LENGTH_SCALE, y: cy },
      { x: cx - halfS, y: cy },
      { x: cx, y: cy },
      { x: cx + halfS, y: cy },
      { x: cx + S * FACTORY_FIBER_OPTIC_LENGTH_SCALE, y: cy },
    ),
};

/**
 * Create a default instance of the given component type at model position (cx, cy).
 */
export function createDefaultElement(key: ComponentKey, cx: number, cy: number): OpticalElement {
  return FACTORIES[key](cx, cy);
}
