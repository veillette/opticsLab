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

import { APERTURED_MIRROR_APERTURE_DEFAULT_M, CAROUSEL_DEFAULT_HALF_SIZE_M } from "../../OpticsLabConstants.js";
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

const GLASS_INDEX = 1.5;
const CONVEX_RADIUS_M = 1.2;
const BICONCAVE_RADIUS_M = -1.2;
const IDEAL_LENS_FOCAL_M = 1.2;
const BEAM_BRIGHTNESS = 0.5;
const BEAM_WAVELENGTH_NM = 532;
const SINGLE_RAY_BRIGHTNESS = 1;
const ARC_ANGLE_RAD = 0;
const ARC_CONE_HALF_ANGLE_RAD = Math.PI / 6;
const ARC_BRIGHTNESS = 0.5;
const POINT_SOURCE_BRIGHTNESS = 0.6;
const IDEAL_MIRROR_FOCAL_M = 0.8;
const BEAM_SPLITTER_TRANSMIT = 0.5;

const CIRCLE_GLASS_RADIUS_SCALE = 0.7;
const PRISM_APEX_SCALE = 0.8;
const PRISM_BASE_CORNER_SCALE = 0.7;
const PRISM_BASE_DEPTH_SCALE = 0.6;
const EQUILATERAL_SCALE = 0.8;
const RIGHT_ANGLE_SCALE = 0.9;
const PORRO_SCALE = 1.0;
const SLAB_WIDTH_SCALE = 1.4;
const SLAB_THICKNESS_SCALE = 0.5;
const PARALLELOGRAM_WIDTH_SCALE = 0.9;
const PARALLELOGRAM_SKEW_SCALE = 0.7;
const DOVE_LENGTH_SCALE = 1.3;
const DOVE_THICKNESS_SCALE = 0.6;
const HALF_PLANE_SPAN_SCALE = 1.5;
const CURVED_MIRROR_BULGE_SCALE = 0.5;
const APERTURE_NOTCH_SCALE = 0.2;
const BEAM_SPLITTER_DIAG_SCALE = 0.7;

// ── Factory map ──────────────────────────────────────────────────────────────

const FACTORIES: Record<ComponentKey, (cx: number, cy: number) => OpticalElement> = {
  transmissionGrating: (cx, cy) => new TransmissionGrating({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
  reflectionGrating: (cx, cy) => new ReflectionGrating({ x: cx, y: cy - S }, { x: cx, y: cy + S }),

  beam: (cx, cy) =>
    new BeamSource({ x: cx, y: cy - halfS }, { x: cx, y: cy + halfS }, BEAM_BRIGHTNESS, BEAM_WAVELENGTH_NM),
  divergentBeam: (cx, cy) =>
    new DivergentBeam({ x: cx, y: cy - halfS }, { x: cx, y: cy + halfS }, BEAM_BRIGHTNESS, BEAM_WAVELENGTH_NM),
  singleRay: (cx, cy) => new SingleRaySource({ x: cx - halfS, y: cy }, { x: cx + halfS, y: cy }, SINGLE_RAY_BRIGHTNESS),
  continuousSpectrum: (cx, cy) => new ContinuousSpectrumSource({ x: cx - halfS, y: cy }, { x: cx + halfS, y: cy }),
  arcSource: (cx, cy) => new ArcLightSource({ x: cx, y: cy }, ARC_ANGLE_RAD, ARC_CONE_HALF_ANGLE_RAD, ARC_BRIGHTNESS),
  pointSource: (cx, cy) => new PointSourceElement({ x: cx, y: cy }, POINT_SOURCE_BRIGHTNESS),

  sphericalLens: (cx, cy) =>
    new SphericalLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, CONVEX_RADIUS_M, BICONCAVE_RADIUS_M, GLASS_INDEX),
  biconvexLens: (cx, cy) => new BiconvexLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, CONVEX_RADIUS_M, GLASS_INDEX),
  biconcaveLens: (cx, cy) =>
    new BiconcaveLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, CONVEX_RADIUS_M, GLASS_INDEX),
  planoConvexLens: (cx, cy) =>
    new PlanoConvexLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, CONVEX_RADIUS_M, GLASS_INDEX),
  planoConcaveLens: (cx, cy) =>
    new PlanoConcaveLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, CONVEX_RADIUS_M, GLASS_INDEX),
  idealLens: (cx, cy) => new IdealLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, IDEAL_LENS_FOCAL_M),
  circleGlass: (cx, cy) =>
    new CircleGlass({ x: cx, y: cy }, { x: cx + S * CIRCLE_GLASS_RADIUS_SCALE, y: cy }, GLASS_INDEX),
  prism: (cx, cy) =>
    new Glass(
      [
        { x: cx, y: cy + S * PRISM_APEX_SCALE },
        { x: cx + S * PRISM_BASE_CORNER_SCALE, y: cy - S * PRISM_BASE_DEPTH_SCALE },
        { x: cx - S * PRISM_BASE_CORNER_SCALE, y: cy - S * PRISM_BASE_DEPTH_SCALE },
      ],
      GLASS_INDEX,
    ),
  equilateralPrism: (cx, cy) => new EquilateralPrism({ x: cx, y: cy }, S * EQUILATERAL_SCALE),
  rightAnglePrism: (cx, cy) => new RightAnglePrism({ x: cx, y: cy }, S * RIGHT_ANGLE_SCALE),
  porroPrism: (cx, cy) => new PorroPrism({ x: cx, y: cy }, S * PORRO_SCALE),
  slabGlass: (cx, cy) => new SlabGlass({ x: cx, y: cy }, S * SLAB_WIDTH_SCALE, S * SLAB_THICKNESS_SCALE),
  parallelogramPrism: (cx, cy) =>
    new ParallelogramPrism({ x: cx, y: cy }, S * PARALLELOGRAM_WIDTH_SCALE, S * PARALLELOGRAM_SKEW_SCALE),
  dovePrism: (cx, cy) => new DovePrism({ x: cx, y: cy }, S * DOVE_LENGTH_SCALE, S * DOVE_THICKNESS_SCALE),
  halfPlaneGlass: (cx, cy) =>
    new HalfPlaneGlass(
      { x: cx, y: cy + S * HALF_PLANE_SPAN_SCALE },
      { x: cx, y: cy - S * HALF_PLANE_SPAN_SCALE },
      GLASS_INDEX,
    ),

  flatMirror: (cx, cy) => new SegmentMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
  arcMirror: (cx, cy) =>
    new ArcMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, { x: cx + S * CURVED_MIRROR_BULGE_SCALE, y: cy }),
  idealMirror: (cx, cy) => new IdealCurvedMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, IDEAL_MIRROR_FOCAL_M),
  parabolicMirror: (cx, cy) =>
    new ParabolicMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, { x: cx + S * CURVED_MIRROR_BULGE_SCALE, y: cy }),
  aperturedMirror: (cx, cy) =>
    new AperturedParabolicMirror(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      { x: cx + S * CURVED_MIRROR_BULGE_SCALE, y: cy },
      APERTURED_MIRROR_APERTURE_DEFAULT_M,
    ),

  lineBlocker: (cx, cy) => new LineBlocker({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
  detector: (cx, cy) =>
    new DetectorElement({ x: cx, y: cy - S }, { x: cx, y: cy + S }, { x: cx + S * CURVED_MIRROR_BULGE_SCALE, y: cy }),
  aperture: (cx, cy) =>
    new ApertureElement(
      { x: cx, y: cy - S },
      { x: cx, y: cy + S },
      { x: cx, y: cy - S * APERTURE_NOTCH_SCALE },
      { x: cx, y: cy + S * APERTURE_NOTCH_SCALE },
    ),
  beamSplitter: (cx, cy) =>
    new BeamSplitterElement(
      { x: cx - S * BEAM_SPLITTER_DIAG_SCALE, y: cy - S * BEAM_SPLITTER_DIAG_SCALE },
      { x: cx + S * BEAM_SPLITTER_DIAG_SCALE, y: cy + S * BEAM_SPLITTER_DIAG_SCALE },
      BEAM_SPLITTER_TRANSMIT,
    ),

  track: (cx, cy) => new TrackElement({ x: cx - S, y: cy }, { x: cx + S, y: cy }),

  // Fiber optic: long and narrow, oriented horizontally with 3 interior control points
  fiberOptic: (cx, cy) =>
    new FiberOpticElement(
      { x: cx - S * 1.5, y: cy },
      { x: cx - S * 0.5, y: cy },
      { x: cx, y: cy },
      { x: cx + S * 0.5, y: cy },
      { x: cx + S * 1.5, y: cy },
    ),
};

/**
 * Create a default instance of the given component type at model position (cx, cy).
 */
export function createDefaultElement(key: ComponentKey, cx: number, cy: number): OpticalElement {
  return FACTORIES[key](cx, cy);
}
