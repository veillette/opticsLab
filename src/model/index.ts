/**
 * Model barrel export.
 *
 * Re-exports all model types and classes so consumers can import from
 * a single location:  import { OpticsScene, SegmentMirror, ... } from "../model/index.js"
 */

export { ApertureElement } from "./blockers/ApertureElement.js";
export { CircleBlocker } from "./blockers/CircleBlocker.js";
// ── Blockers ─────────────────────────────────────────────────────────────────
export { LineBlocker } from "./blockers/LineBlocker.js";
export { CircleGlass } from "./glass/CircleGlass.js";
// ── Glass ────────────────────────────────────────────────────────────────────
export { HalfPlaneGlass } from "./glass/HalfPlaneGlass.js";
export { IdealLens } from "./glass/IdealLens.js";
export type { PolygonVertex } from "./glass/PolygonGlass.js";
export { PolygonGlass } from "./glass/PolygonGlass.js";
export { SphericalLens } from "./glass/SphericalLens.js";
export { BeamSource } from "./light-sources/BeamSource.js";
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
// ── Core types & geometry ────────────────────────────────────────────────────
export * from "./optics/Geometry.js";
export type { SceneSettings } from "./optics/OpticsScene.js";
export { OpticsScene } from "./optics/OpticsScene.js";
export * from "./optics/OpticsTypes.js";
export type { RayTracerConfig, TracedSegment, TraceResult } from "./optics/RayTracer.js";
export { RayTracer } from "./optics/RayTracer.js";
