/**
 * OpticsTypes.ts
 *
 * Core type definitions for the optics simulation model.
 * Defines rays, scene elements, intersection results, and simulation modes.
 */

import type { Point } from "./Geometry.js";

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

export type ElementCategory = "lightSource" | "mirror" | "glass" | "blocker";

// ── Base Optical Element ─────────────────────────────────────────────────────

export interface OpticalElement {
  /** Unique identifier for the element. */
  readonly id: string;
  /** Machine-readable type name. */
  readonly type: string;
  /** Display label for the element. */
  readonly category: ElementCategory;

  /**
   * Emit initial rays (for light sources).
   * Non-source elements return an empty array.
   */
  emitRays(rayDensity: number, mode: ViewMode): SimulationRay[];

  /**
   * Test if a simulation ray intersects with this element.
   * Returns the nearest intersection ahead of the ray origin, or null.
   */
  checkRayIntersection(ray: SimulationRay): IntersectionResult | null;

  /**
   * Compute the interaction when a ray hits this element at the given point.
   */
  onRayIncident(ray: SimulationRay, intersection: IntersectionResult): RayInteractionResult;

  /** Serialize the element for JSON persistence. */
  serialize(): Record<string, unknown>;
}

// ── Scene Snapshot ───────────────────────────────────────────────────────────

export interface SimulationResult {
  rays: SimulationRay[];
  images: DetectedImage[];
  truncationError: number;
}
