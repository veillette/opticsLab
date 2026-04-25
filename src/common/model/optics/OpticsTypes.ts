/**
 * OpticsTypes.ts
 *
 * Core type definitions for the optics simulation model.
 * Defines rays, scene elements, intersection results, and simulation modes.
 */

import type { Bounds, Point } from "./Geometry.js";

// ── Ray ──────────────────────────────────────────────────────────────────────

export interface SimulationRay {
  /** Origin of the ray. */
  origin: Point;
  /** Unit direction vector. */
  direction: Point;
  /** s-polarization brightness (0..1). */
  brightnessS: number;
  /** p-polarization brightness (0..1). */
  brightnessP: number;
  /** Whether this ray starts a new group (gap in the extended-ray chain). */
  gap: boolean;
  /** Whether this is a newly emitted ray (not yet propagated). */
  isNew: boolean;
  /** Wavelength in nm (only used when color simulation is on). */
  wavelength?: number | undefined;
  /** ID of the emitting light source (used for continuous-ray rendering). */
  sourceId?: string | undefined;
  /** Index of this ray within its source's emission fan (used for continuous-ray rendering). */
  rayIndex?: number | undefined;
  /**
   * When true, traced segments use additive canvas blending so overlapping
   * wavelengths read as white (continuous-spectrum source).
   */
  spectrumAdditiveBlend?: boolean | undefined;
}

// ── Display / Visualization Modes ────────────────────────────────────────────

export type ViewMode = "rays" | "extended" | "images" | "observer";

// ── Intersection Result ──────────────────────────────────────────────────────

export interface IntersectionResult {
  point: Point;
  /** Distance (parameter t) from ray origin to the intersection. */
  t: number;
  /** The scene element that was intersected. */
  element: OpticalElement;
  /** Surface normal at the intersection point (outward-facing). */
  normal: Point;
  /** True when the hit was on a flat aperture-rim edge of a lens (set by Glass). */
  hitOnApertureEdge?: boolean;
}

// ── Ray Interaction Result ───────────────────────────────────────────────────

export interface RayInteractionResult {
  /** True if the ray is fully absorbed by the element. */
  isAbsorbed: boolean;
  /** The primary outgoing ray (modified from the incident ray). */
  outgoingRay?: SimulationRay;
  /** Any secondary rays produced (e.g., reflected ray from a beam splitter). */
  newRays?: SimulationRay[];
  /** Brightness of truncated rays (for error estimation). */
  truncation?: number;
}

// ── Image Detection ──────────────────────────────────────────────────────────

export type ImageType = "real" | "virtual" | "virtualObject";

export interface DetectedImage {
  position: Point;
  imageType: ImageType;
  brightness: number;
}

// ── Observer ─────────────────────────────────────────────────────────────────

export interface Observer {
  position: Point;
  radius: number;
}

// ── Optical Element Categories ───────────────────────────────────────────────

export type ElementCategory = "lightSource" | "mirror" | "glass" | "blocker" | "guide";

// ── Composable sub-interfaces ────────────────────────────────────────────────
// Code that only needs a subset of element behaviour can type-narrow to these.

/** An element that emits simulation rays (light sources). */
export interface IEmitter {
  emitRays(rayDensity: number, mode: ViewMode, jitter?: boolean): SimulationRay[];
}

/**
 * Per-call configuration forwarded by RayTracer into each element's onRayIncident.
 * Replaces the former static flags on BaseGlass so that parallel traces never
 * corrupt each other's preferences.
 */
export interface RayCallConfig {
  partialReflectionEnabled: boolean;
  lensRimBlockingEnabled: boolean;
}

/** An element that can be intersected by a ray (mirrors, glass, blockers, …). */
export interface IIntersectable {
  checkRayIntersection(ray: SimulationRay): IntersectionResult | null;
  onRayIncident(ray: SimulationRay, intersection: IntersectionResult, config?: RayCallConfig): RayInteractionResult;
}

/** An element that can be serialized for persistence. */
export interface ISerializable {
  serialize(): Record<string, unknown>;
}

/**
 * An element that accumulates measurements across simulation frames.
 *
 * Implemented by DetectorElement. OpticsScene uses this interface instead of
 * `instanceof DetectorElement` so that future detector-like elements do not
 * require changes inside the core scene logic.
 */
export interface IAcquirable {
  /** True while the element is actively accumulating a histogram pass. */
  readonly isAcquiring: boolean;
  /** Discard all hit data accumulated so far (called at the start of each trace). */
  clearHits(): void;
}

/**
 * An element that expands into multiple physics objects for ray tracing.
 *
 * Implemented by FiberOpticElement (outer cladding + inner core). The tracer
 * receives the expanded list so it handles both boundaries automatically.
 * OpticsScene uses this interface instead of `instanceof FiberOpticElement`.
 */
export interface ICompound {
  /** Return the concrete physics elements that this composite element comprises. */
  getPhysicsElements(): OpticalElement[];
}

// ── Type guard helpers ───────────────────────────────────────────────────────

/** Returns true when the element implements IAcquirable (accumulates measurements). */
export function isAcquirable(element: OpticalElement): element is OpticalElement & IAcquirable {
  return "isAcquiring" in element && "clearHits" in element;
}

/** Returns true when the element implements ICompound (expands to multiple physics objects). */
export function isCompound(element: OpticalElement): element is OpticalElement & ICompound {
  return "getPhysicsElements" in element;
}

// ── Base Optical Element ─────────────────────────────────────────────────────

export interface OpticalElement extends IEmitter, IIntersectable, ISerializable {
  /** Unique identifier for the element. */
  readonly id: string;
  /** Machine-readable type name. */
  readonly type: string;
  /** Display label for the element. */
  readonly category: ElementCategory;

  /** Compute the axis-aligned bounding box of this element's geometry. */
  getBounds(): Bounds;

  /** Release any resources held by this element to prevent memory leaks. */
  dispose(): void;
}

// ── Scene Snapshot ───────────────────────────────────────────────────────────

export interface SimulationResult {
  rays: SimulationRay[];
  images: DetectedImage[];
  truncationError: number;
}
