/**
 * RayTracer.ts
 *
 * The core ray tracing engine. Given a set of optical elements and a list
 * of initial rays, propagates each ray through the scene by repeatedly:
 *   1. Finding the nearest intersection with any element
 *   2. Computing the interaction (reflection, refraction, absorption)
 *   3. Continuing with the outgoing ray(s)
 *
 * Supports four view modes:
 *   - "rays"     : Trace rays, record segments
 *   - "extended" : Trace rays plus backward extensions to find virtual images
 *   - "images"   : Detect real/virtual image positions
 *   - "observer" : Show rays as seen from a specific observer position
 */

import {
  DEFAULT_MAX_RAY_DEPTH,
  DEFAULT_MIN_BRIGHTNESS,
  DEFAULT_RAY_DENSITY,
  FAR_DISTANCE,
  RAY_CONVERGENCE_THRESHOLD,
} from "../../../OpticsLabConstants.js";
import { ELEMENT_CATEGORY_LIGHT_SOURCE, VIEW_MODE_RAYS } from "../../../OpticsLabStrings.js";
import { BaseGlass } from "../glass/BaseGlass.js";
import {
  add,
  distanceSquared,
  line,
  linesIntersection,
  type Point,
  point,
  rayCircleIntersections,
  scale,
} from "./Geometry.js";
import type {
  DetectedImage,
  IntersectionResult,
  Observer,
  OpticalElement,
  SimulationRay,
  SimulationResult,
  ViewMode,
} from "./OpticsTypes.js";

// ── Traced Ray Segment (for rendering) ───────────────────────────────────────

export interface TracedSegment {
  p1: Point;
  p2: Point;
  /** True for the forward escaped ray and its backward extension in recordEscapedRay(). Only terminal segments are used for image-position detection. */
  isTerminal?: boolean;
  brightnessS: number;
  brightnessP: number;
  wavelength?: number | undefined;
  /** Whether this is a backward extension (virtual ray). */
  isExtension: boolean;
  /** Whether this ray would be seen by the observer (mode = "observer"). */
  isObserved: boolean;
  /** ID of the emitting light source (used for continuous-ray rendering). */
  sourceId?: string | undefined;
  /** Index of this ray within its source's emission fan (used for continuous-ray rendering). */
  rayIndex?: number | undefined;
  /** Additive blend in the view when true (continuous-spectrum rays). */
  spectrumAdditiveBlend?: boolean | undefined;
  /** True only for the first segment emitted directly from a light source (depth 0). */
  isFromSource?: boolean | undefined;
  /** True for observer-mode ray segments drawn from observer entry to apparent image. */
  isObserverRay?: boolean | undefined;
  /** Where this ray enters the observer circle (set on observed terminal segments). */
  observerEntryPoint?: Point | undefined;
}

// ── Full Trace Result ────────────────────────────────────────────────────────

export interface TraceResult extends SimulationResult {
  segments: TracedSegment[];
}

// ── Configuration ────────────────────────────────────────────────────────────

export interface RayTracerConfig {
  maxRayDepth: number;
  minBrightness: number;
  rayDensity: number;
  mode: ViewMode;
  observer?: Observer | undefined;
  jitter?: boolean;
  /** Whether Fresnel partial reflection is computed for glass surfaces. */
  partialReflectionEnabled?: boolean;
  /** Whether flat aperture-rim edges of SphericalLens elements absorb rays instead of refracting them. */
  lensRimBlockingEnabled?: boolean;
}

const DEFAULT_CONFIG: RayTracerConfig = {
  maxRayDepth: DEFAULT_MAX_RAY_DEPTH,
  minBrightness: DEFAULT_MIN_BRIGHTNESS,
  rayDensity: DEFAULT_RAY_DENSITY,
  mode: VIEW_MODE_RAYS,
  partialReflectionEnabled: true,
};

// ── Ray Tracer ───────────────────────────────────────────────────────────────

export class RayTracer {
  private readonly elements: OpticalElement[];
  private readonly config: RayTracerConfig;

  public constructor(elements: OpticalElement[], config: Partial<RayTracerConfig> = {}) {
    this.elements = elements;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run the full simulation: emit rays from all light sources and
   * propagate them through the scene.
   */
  public trace(): TraceResult {
    // Apply the partial-reflection flag to the glass base class before tracing.
    // This keeps the preference in the model layer rather than requiring the view
    // to mutate a model static directly.
    BaseGlass.partialReflectionEnabled = this.config.partialReflectionEnabled ?? true;
    BaseGlass.lensRimBlockingEnabled = this.config.lensRimBlockingEnabled ?? false;

    const allSegments: TracedSegment[] = [];
    const allImages: DetectedImage[] = [];
    let totalTruncation = 0;

    // Collect initial rays from all light sources
    const initialRays: SimulationRay[] = [];
    for (const element of this.elements) {
      const emitted = element.emitRays(this.config.rayDensity, this.config.mode, this.config.jitter);
      initialRays.push(...emitted);
    }

    // Process each ray through the scene
    const queue: Array<{ ray: SimulationRay; depth: number }> = initialRays.map((ray) => ({ ray, depth: 0 }));

    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) {
        continue;
      }
      totalTruncation += this.processRayEntry(entry.ray, entry.depth, queue, allSegments);
    }

    // Image detection in "images" mode
    if (this.config.mode === "images") {
      this.detectImages(allSegments, allImages);
    }

    // Observer mode: find apparent images and create observer ray segments
    if (this.config.mode === "observer" && this.config.observer) {
      this.processObserverImages(allSegments, allImages);
    }

    return {
      segments: allSegments,
      rays: initialRays,
      images: allImages,
      truncationError: totalTruncation,
    };
  }

  private processRayEntry(
    ray: SimulationRay,
    depth: number,
    queue: Array<{ ray: SimulationRay; depth: number }>,
    allSegments: TracedSegment[],
  ): number {
    if (depth >= this.config.maxRayDepth) {
      return ray.brightnessS + ray.brightnessP;
    }

    const totalBrightness = ray.brightnessS + ray.brightnessP;
    if (totalBrightness < this.config.minBrightness) {
      return totalBrightness;
    }

    const intersection = this.findNearestIntersection(ray);

    if (!intersection) {
      this.recordEscapedRay(ray, allSegments, depth === 0);
      return 0;
    }

    allSegments.push({
      p1: ray.origin,
      p2: intersection.point,
      brightnessS: ray.brightnessS,
      brightnessP: ray.brightnessP,
      wavelength: ray.wavelength,
      isExtension: false,
      isObserved: false,
      sourceId: ray.sourceId,
      rayIndex: ray.rayIndex,
      spectrumAdditiveBlend: ray.spectrumAdditiveBlend,
      isFromSource: depth === 0,
    });

    if (this.config.mode === "extended" || this.config.mode === "images") {
      this.processExtendedRay(ray, intersection, allSegments);
    }

    if (this.config.mode === "observer" && this.config.observer) {
      this.processObserverRay(ray, intersection, allSegments);
    }

    const result = intersection.element.onRayIncident(ray, intersection);

    if (!result.isAbsorbed && result.outgoingRay) {
      result.outgoingRay.sourceId = ray.sourceId;
      result.outgoingRay.rayIndex = ray.rayIndex;
      result.outgoingRay.spectrumAdditiveBlend = ray.spectrumAdditiveBlend;
      queue.push({ ray: result.outgoingRay, depth: depth + 1 });
    }

    if (result.newRays) {
      for (const newRay of result.newRays) {
        newRay.sourceId = ray.sourceId;
        newRay.rayIndex = ray.rayIndex;
        newRay.spectrumAdditiveBlend = ray.spectrumAdditiveBlend;
        queue.push({ ray: newRay, depth: depth + 1 });
      }
    }

    return result.truncation ?? 0;
  }

  private recordEscapedRay(ray: SimulationRay, allSegments: TracedSegment[], isFromSource = false): void {
    const farPoint = add(ray.origin, scale(ray.direction, FAR_DISTANCE));

    // Check observer intersection for escaped rays (infinite ray from origin)
    let observerEntry: Point | undefined;
    if (this.config.mode === "observer" && this.config.observer) {
      observerEntry = this.findObserverEntry(ray, null);
    }

    allSegments.push({
      p1: ray.origin,
      p2: farPoint,
      brightnessS: ray.brightnessS,
      brightnessP: ray.brightnessP,
      wavelength: ray.wavelength,
      isExtension: false,
      isObserved: !!observerEntry,
      isTerminal: true,
      sourceId: ray.sourceId,
      rayIndex: ray.rayIndex,
      spectrumAdditiveBlend: ray.spectrumAdditiveBlend,
      isFromSource,
      observerEntryPoint: observerEntry,
    });

    if ((this.config.mode === "extended" || this.config.mode === "images") && !ray.gap && !ray.isNew) {
      const backPoint = add(ray.origin, scale(ray.direction, -FAR_DISTANCE));
      allSegments.push({
        p1: ray.origin,
        p2: backPoint,
        brightnessS: ray.brightnessS,
        brightnessP: ray.brightnessP,
        wavelength: ray.wavelength,
        isExtension: true,
        isObserved: false,
        isTerminal: true,
      });
    }
  }

  private findNearestIntersection(ray: SimulationRay): IntersectionResult | null {
    let nearest: IntersectionResult | null = null;

    for (const element of this.elements) {
      if (element.category === ELEMENT_CATEGORY_LIGHT_SOURCE) {
        continue; // light sources don't interact with rays
      }
      const hit = element.checkRayIntersection(ray);
      if (hit && (!nearest || hit.t < nearest.t)) {
        nearest = hit;
      }
    }

    return nearest;
  }

  /**
   * Add backward-extended ray segments for virtual image detection.
   */
  private processExtendedRay(ray: SimulationRay, intersection: IntersectionResult, segments: TracedSegment[]): void {
    if (ray.gap || ray.isNew) {
      return;
    }
    // Backward extension: from origin going backwards (virtual image direction)
    const backPoint = add(ray.origin, scale(ray.direction, -FAR_DISTANCE));
    segments.push({
      p1: ray.origin,
      p2: backPoint,
      brightnessS: ray.brightnessS,
      brightnessP: ray.brightnessP,
      wavelength: ray.wavelength,
      isExtension: true,
      isObserved: false,
    });
    // Forward extension: from hit point continuing in incident direction
    const fwdPoint = add(intersection.point, scale(ray.direction, FAR_DISTANCE));
    segments.push({
      p1: intersection.point,
      p2: fwdPoint,
      brightnessS: ray.brightnessS,
      brightnessP: ray.brightnessP,
      wavelength: ray.wavelength,
      isExtension: true,
      isObserved: false,
    });
  }

  /**
   * Find where a ray enters the observer circle. Returns the entry point
   * or undefined if the ray doesn't pass through the observer.
   * @param ray - The simulation ray
   * @param intersection - The intersection with an element, or null for escaped rays
   */
  private findObserverEntry(ray: SimulationRay, intersection: IntersectionResult | null): Point | undefined {
    const observer = this.config.observer;
    if (!observer) {
      return undefined;
    }

    // Use proper line-circle intersection (matching the optics-template approach)
    const hits = rayCircleIntersections(ray.origin, ray.direction, {
      center: observer.position,
      radius: observer.radius,
    });

    if (hits.length === 0) {
      return undefined;
    }

    // The first intersection (entry point) with the observer circle
    const entry = hits[0];
    if (!entry) {
      return undefined;
    }

    // For rays that hit an element, check the entry is before the intersection
    if (intersection) {
      if (entry.t * entry.t > distanceSquared(ray.origin, intersection.point)) {
        return undefined; // Observer is beyond the hit point
      }
    }

    return entry.point;
  }

  /**
   * Check if the observer can see this ray and mark the segment accordingly.
   */
  private processObserverRay(ray: SimulationRay, intersection: IntersectionResult, segments: TracedSegment[]): void {
    const entry = this.findObserverEntry(ray, intersection);
    if (!entry) {
      return;
    }

    // Mark the last segment (the one just added for this ray) as observed
    const lastSeg = segments[segments.length - 1];
    if (lastSeg) {
      lastSeg.isObserved = true;
      lastSeg.observerEntryPoint = entry;
    }
  }

  /**
   * Observer mode post-processing: for consecutive observed rays from the same source,
   * find where their line extensions intersect to locate the apparent image.
   * Creates observer-ray segments from the observer entry point back to the apparent image.
   * Adapted from the optics-template Simulator.js observer logic.
   */
  private processObserverImages(allSegments: TracedSegment[], allImages: DetectedImage[]): void {
    const bySource = this.groupObservedSegmentsBySource(allSegments);
    const thresholdSq = (RAY_CONVERGENCE_THRESHOLD / 100) ** 2;

    for (const segs of bySource.values()) {
      segs.sort((a, b) => (a.rayIndex ?? 0) - (b.rayIndex ?? 0));
      this.processObservedGroup(segs, allSegments, allImages, thresholdSq);
    }
  }

  /** Group observed terminal segments by sourceId (excludes extensions and observer rays). */
  private groupObservedSegmentsBySource(allSegments: TracedSegment[]): Map<string, TracedSegment[]> {
    const bySource = new Map<string, TracedSegment[]>();
    for (const seg of allSegments) {
      if (!(seg.isObserved && seg.observerEntryPoint) || seg.isExtension || seg.isObserverRay) {
        continue;
      }
      const key = seg.sourceId ?? "__unknown__";
      let arr = bySource.get(key);
      if (!arr) {
        arr = [];
        bySource.set(key, arr);
      }
      arr.push(seg);
    }
    return bySource;
  }

  /** Process one sorted group of observed segments, emitting observer rays and image detections. */
  private processObservedGroup(
    segs: TracedSegment[],
    allSegments: TracedSegment[],
    allImages: DetectedImage[],
    thresholdSq: number,
  ): void {
    let lastSeg: TracedSegment | null = null;
    let lastIntersection: Point | null = null;

    for (const seg of segs) {
      if (lastSeg !== null) {
        const inter = linesIntersection(line(lastSeg.p1, lastSeg.p2), line(seg.p1, seg.p2));
        if (inter !== null) {
          if (lastIntersection !== null && distanceSquared(inter, lastIntersection) < thresholdSq) {
            this.handleConvergentIntersection(seg, inter, allSegments, allImages, thresholdSq);
          } else if (seg.observerEntryPoint) {
            this.pushObserverRay(seg.observerEntryPoint, seg.p1, seg, allSegments, 0.5);
          }
          lastIntersection = inter;
        } else {
          lastIntersection = null;
        }
      }
      lastSeg = seg;
    }
  }

  /** Handle a convergent pair: record the apparent image and emit an observer ray to it. */
  private handleConvergentIntersection(
    seg: TracedSegment,
    inter: Point,
    allSegments: TracedSegment[],
    allImages: DetectedImage[],
    thresholdSq: number,
  ): void {
    const dx = inter.x - seg.p1.x;
    const dy = inter.y - seg.p1.y;
    const segDx = seg.p2.x - seg.p1.x;
    const segDy = seg.p2.y - seg.p1.y;
    const rpd = dx * segDx + dy * segDy;
    const segLenSq = segDx * segDx + segDy * segDy;

    const imageType = rpd < 0 ? "virtual" : rpd < segLenSq ? "real" : "virtual";
    const brightness = (seg.brightnessS + seg.brightnessP) * 0.5;

    const isDuplicate = allImages.some((img) => distanceSquared(img.position, inter) < thresholdSq);
    if (!isDuplicate) {
      allImages.push({ position: inter, imageType, brightness });
    }

    if (seg.observerEntryPoint) {
      this.pushObserverRay(seg.observerEntryPoint, inter, seg, allSegments, 1);
    }
  }

  /** Append an observer-ray segment with an optional brightness scale. */
  private pushObserverRay(
    p1: Point,
    p2: Point,
    seg: TracedSegment,
    allSegments: TracedSegment[],
    brightnessScale: number,
  ): void {
    allSegments.push({
      p1,
      p2,
      brightnessS: seg.brightnessS * brightnessScale,
      brightnessP: seg.brightnessP * brightnessScale,
      wavelength: seg.wavelength,
      isExtension: false,
      isObserved: true,
      isObserverRay: true,
    });
  }

  /**
   * Detect images by finding convergence/divergence points of ray bunches.
   * Groups non-gap rays and finds pairwise intersections of their extensions.
   */
  private detectImages(segments: TracedSegment[], images: DetectedImage[]): void {
    // Group terminal forward segments by sourceId, sorted by rayIndex.
    // Using only terminal segments gives us each ray's final outgoing direction
    // after all optical interactions — the correct input for image detection.
    const bySource = new Map<string, TracedSegment[]>();

    for (const seg of segments) {
      if (!seg.isTerminal || seg.isExtension) {
        continue;
      }
      const key = seg.sourceId ?? "__unknown__";
      let arr = bySource.get(key);
      if (!arr) {
        arr = [];
        bySource.set(key, arr);
      }
      arr.push(seg);
    }

    for (const segs of bySource.values()) {
      // Sort by emission order so consecutive entries are adjacent rays.
      segs.sort((a, b) => (a.rayIndex ?? 0) - (b.rayIndex ?? 0));
      this.findImagesInSequence(segs, images);
    }
  }

  /**
   * Consecutive-ray-pair image detection, adapted from the optics-template reference.
   *
   * For each adjacent pair of rays (i-1, i) in emission order, compute their line
   * intersection. An image is detected when two *successive* such intersections are
   * close to each other — meaning three consecutive rays all pass near the same
   * focus point. This eliminates spurious markers from coincidental two-ray crossings
   * without needing the O(n²) pairwise approach.
   *
   * Image type is determined by a dot-product test (rpd):
   *   rpd < 0          → virtual image  (focus is behind the ray's exit point)
   *   rpd ≥ 0          → real image     (focus is ahead of the ray's exit point)
   */
  private findImagesInSequence(segs: TracedSegment[], images: DetectedImage[]): void {
    // Convergence threshold in model metres (RAY_CONVERGENCE_THRESHOLD is in pixels,
    // 100 px = 1 m).
    const thresholdSq = (RAY_CONVERGENCE_THRESHOLD / 100) ** 2;

    const candidates: DetectedImage[] = [];

    let lastSeg: TracedSegment | null = null;
    let lastIntersection: Point | null = null;

    for (const seg of segs) {
      if (lastSeg !== null) {
        const inter = this.linesIntersection(seg, lastSeg);

        if (inter !== null) {
          if (lastIntersection !== null && distanceSquared(inter, lastIntersection) < thresholdSq) {
            // Three consecutive rays all converge near the same point → image.
            const dx = inter.x - seg.p1.x;
            const dy = inter.y - seg.p1.y;
            const dirX = seg.p2.x - seg.p1.x;
            const dirY = seg.p2.y - seg.p1.y;
            const rpd = dx * dirX + dy * dirY;

            // rpd < 0: focus is behind the ray's exit point → virtual image.
            // rpd ≥ 0: focus is ahead                       → real image.
            const imageType = rpd < 0 ? "virtual" : "real";
            const brightness = (seg.brightnessS + seg.brightnessP) * 0.5;

            candidates.push({ position: inter, imageType, brightness });
          }
          lastIntersection = inter;
        } else {
          lastIntersection = null; // parallel rays, reset
        }
      }
      lastSeg = seg;
    }

    // Deduplicate candidates that landed in the same threshold cell.
    const thresholdM = RAY_CONVERGENCE_THRESHOLD / 100;
    const seen = new Set<string>();
    for (const c of candidates) {
      const key = `${Math.round(c.position.x / thresholdM)},${Math.round(c.position.y / thresholdM)}`;
      if (!seen.has(key)) {
        seen.add(key);
        images.push(c);
      }
    }
  }

  /**
   * Intersection of two infinite lines, each defined by two points (p1, p2).
   * Returns null if the lines are parallel.
   * Formula from the optics-template reference (geometry.js linesIntersection).
   */
  private linesIntersection(s1: TracedSegment, s2: TracedSegment): Point | null {
    const xa = s1.p2.x - s1.p1.x;
    const ya = s1.p2.y - s1.p1.y;
    const xb = s2.p2.x - s2.p1.x;
    const yb = s2.p2.y - s2.p1.y;
    const denom = xa * yb - xb * ya;
    if (Math.abs(denom) < 1e-10) {
      return null;
    }
    const A = s1.p2.x * s1.p1.y - s1.p1.x * s1.p2.y;
    const B = s2.p2.x * s2.p1.y - s2.p1.x * s2.p2.y;
    return point((A * xb - B * xa) / denom, (A * yb - B * ya) / denom);
  }
}
