/**
 * Model barrel export.
 *
 * Re-exports all model types and classes so consumers can import from
 * a single location:  import { OpticsScene, SegmentMirror, ... } from "../common/model/index.js"
 */

// biome-ignore lint/performance/noBarrelFile: intentional model barrel
export { ApertureElement } from "./blockers/ApertureElement.js";
// ── Blockers ─────────────────────────────────────────────────────────────────
export { LineBlocker } from "./blockers/LineBlocker.js";
// ── Detectors ────────────────────────────────────────────────────────────────
export { DetectorElement } from "./detectors/DetectorElement.js";
// ── Glass ────────────────────────────────────────────────────────────────────
export { BaseGlass } from "./glass/BaseGlass.js";
export { CircleGlass } from "./glass/CircleGlass.js";
export { DovePrism } from "./glass/DovePrism.js";
export { EquilateralPrism } from "./glass/EquilateralPrism.js";
export type { GlassPathPoint } from "./glass/Glass.js";
export { Glass } from "./glass/Glass.js";
export { HalfPlaneGlass } from "./glass/HalfPlaneGlass.js";
export { IdealLens } from "./glass/IdealLens.js";
export { ParallelogramPrism } from "./glass/ParallelogramPrism.js";
export { PorroPrism } from "./glass/PorroPrism.js";
export { RightAnglePrism } from "./glass/RightAnglePrism.js";
export { SlabGlass } from "./glass/SlabGlass.js";
export { SphericalLens } from "./glass/SphericalLens.js";
// ── Gratings ──────────────────────────────────────────────────────────────────
export { ReflectionGrating } from "./gratings/ReflectionGrating.js";
export { TransmissionGrating } from "./gratings/TransmissionGrating.js";
// ── Guides ───────────────────────────────────────────────────────────────────
export { TrackElement } from "./guides/TrackElement.js";
export { ArcLightSource } from "./light-sources/ArcLightSource.js";
export { BeamSource } from "./light-sources/BeamSource.js";
export { ContinuousSpectrumSource } from "./light-sources/ContinuousSpectrumSource.js";
export { GREEN_WAVELENGTH, INFRARED_WAVELENGTH, UV_WAVELENGTH } from "./light-sources/LightSourceConstants.js";
export { PointSourceElement } from "./light-sources/PointSourceElement.js";
// ── Light sources ────────────────────────────────────────────────────────────
export { SingleRaySource } from "./light-sources/SingleRaySource.js";
export { ArcMirror } from "./mirrors/ArcMirror.js";
export { BeamSplitterElement } from "./mirrors/BeamSplitterElement.js";
export { IdealCurvedMirror } from "./mirrors/IdealCurvedMirror.js";
export { ParabolicMirror } from "./mirrors/ParabolicMirror.js";
// ── Mirrors ──────────────────────────────────────────────────────────────────
export { SegmentMirror } from "./mirrors/SegmentMirror.js";
export { BaseElement } from "./optics/BaseElement.js";
export { BaseSegmentElement } from "./optics/BaseSegmentElement.js";
// ── Core types & geometry ────────────────────────────────────────────────────
export type { Circle, Line, Point, Segment } from "./optics/Geometry.js";
export {
  add,
  circle,
  cross,
  distance,
  distanceSquared,
  dot,
  fresnelReflectance,
  line,
  linesIntersection,
  midpoint,
  normalize,
  perpendicularBisector,
  point,
  pointInCircle,
  pointInPolygon,
  rayArcIntersection,
  rayCircleIntersections,
  raySegmentIntersection,
  reflect,
  refract,
  rotate,
  scale,
  segment,
  segmentLength,
  segmentMidpoint,
  segmentNormal,
  subtract,
} from "./optics/Geometry.js";
export type { SceneSettings } from "./optics/OpticsScene.js";
export { OpticsScene } from "./optics/OpticsScene.js";
export type {
  DetectedImage,
  ElementCategory,
  ImageType,
  IntersectionResult,
  Observer,
  OpticalElement,
  RayInteractionResult,
  SimulationRay,
  SimulationResult,
  ViewMode,
} from "./optics/OpticsTypes.js";
export type { RayTracerConfig, TracedSegment, TraceResult } from "./optics/RayTracer.js";
export { RayTracer } from "./optics/RayTracer.js";
