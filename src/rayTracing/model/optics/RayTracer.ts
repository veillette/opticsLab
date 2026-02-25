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

import { add, distance, distanceSquared, normalize, type Point, point, scale, subtract } from "./Geometry.js";
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
  brightnessS: number;
  brightnessP: number;
  wavelength?: number | undefined;
  /** Whether this is a backward extension (virtual ray). */
  isExtension: boolean;
  /** Whether this ray would be seen by the observer (mode = "observer"). */
  isObserved: boolean;
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
}

const DEFAULT_CONFIG: RayTracerConfig = {
  maxRayDepth: 200,
  minBrightness: 0.01,
  rayDensity: 0.1,
  mode: "rays",
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
    const allSegments: TracedSegment[] = [];
    const allImages: DetectedImage[] = [];
    let totalTruncation = 0;

    // Collect initial rays from all light sources
    const initialRays: SimulationRay[] = [];
    for (const element of this.elements) {
      const emitted = element.emitRays(this.config.rayDensity, this.config.mode);
      initialRays.push(...emitted);
    }

    // Process each ray through the scene
    const queue: Array<{ ray: SimulationRay; depth: number }> = initialRays.map((ray) => ({ ray, depth: 0 }));

    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) {
        continue;
      }
      totalTruncation += this.processRayEntry(entry.ray, entry.depth, queue, allSegments, allImages);
    }

    // Image detection in "images" mode
    if (this.config.mode === "images") {
      this.detectImages(allSegments, allImages);
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
    allImages: DetectedImage[],
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
      this.recordEscapedRay(ray, allSegments);
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
    });

    if (this.config.mode === "extended" || this.config.mode === "images") {
      this.processExtendedRay(ray, intersection, allSegments, allImages);
    }

    if (this.config.mode === "observer" && this.config.observer) {
      this.processObserverRay(ray, intersection, allSegments);
    }

    const result = intersection.element.onRayIncident(ray, intersection);

    if (!result.isAbsorbed && result.outgoingRay) {
      queue.push({ ray: result.outgoingRay, depth: depth + 1 });
    }

    if (result.newRays) {
      for (const newRay of result.newRays) {
        queue.push({ ray: newRay, depth: depth + 1 });
      }
    }

    return result.truncation ?? 0;
  }

  private recordEscapedRay(ray: SimulationRay, allSegments: TracedSegment[]): void {
    const farPoint = add(ray.origin, scale(ray.direction, 10000));
    allSegments.push({
      p1: ray.origin,
      p2: farPoint,
      brightnessS: ray.brightnessS,
      brightnessP: ray.brightnessP,
      wavelength: ray.wavelength,
      isExtension: false,
      isObserved: false,
    });

    if ((this.config.mode === "extended" || this.config.mode === "images") && !ray.gap) {
      const backPoint = add(ray.origin, scale(ray.direction, -10000));
      allSegments.push({
        p1: ray.origin,
        p2: backPoint,
        brightnessS: ray.brightnessS,
        brightnessP: ray.brightnessP,
        wavelength: ray.wavelength,
        isExtension: true,
        isObserved: false,
      });
    }
  }

  private findNearestIntersection(ray: SimulationRay): IntersectionResult | null {
    let nearest: IntersectionResult | null = null;

    for (const element of this.elements) {
      if (element.category === "lightSource") {
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
  private processExtendedRay(
    ray: SimulationRay,
    _intersection: IntersectionResult,
    segments: TracedSegment[],
    _images: DetectedImage[],
  ): void {
    if (ray.gap) {
      return;
    }
    // Backward extension from the ray origin
    const backPoint = add(ray.origin, scale(ray.direction, -10000));
    segments.push({
      p1: ray.origin,
      p2: backPoint,
      brightnessS: ray.brightnessS,
      brightnessP: ray.brightnessP,
      wavelength: ray.wavelength,
      isExtension: true,
      isObserved: false,
    });
  }

  /**
   * Check if the observer can see this ray and mark it accordingly.
   */
  private processObserverRay(ray: SimulationRay, intersection: IntersectionResult, segments: TracedSegment[]): void {
    const observer = this.config.observer;
    if (!observer) {
      return;
    }
    const rayLen = distanceSquared(ray.origin, intersection.point);

    // Check if the observer is along the ray path (roughly)
    const toObserver = subtract(observer.position, ray.origin);
    const projLen = toObserver.x * ray.direction.x + toObserver.y * ray.direction.y;
    if (projLen < 0) {
      return;
    }

    const closest = add(ray.origin, scale(ray.direction, projLen));
    const perpDist = distance(closest, observer.position);

    if (perpDist < observer.radius && projLen * projLen < rayLen) {
      // Observer sees this ray
      const lastSeg = segments[segments.length - 1];
      if (lastSeg) {
        lastSeg.isObserved = true;
      }

      // In observer mode, also trace backward to show the apparent source
      const backPoint = add(ray.origin, scale(ray.direction, -10000));
      segments.push({
        p1: ray.origin,
        p2: backPoint,
        brightnessS: ray.brightnessS * 0.5,
        brightnessP: ray.brightnessP * 0.5,
        wavelength: ray.wavelength,
        isExtension: true,
        isObserved: true,
      });
    }
  }

  /**
   * Detect images by finding convergence/divergence points of ray bunches.
   * Groups non-gap rays and finds pairwise intersections of their extensions.
   */
  private detectImages(segments: TracedSegment[], images: DetectedImage[]): void {
    // Collect forward and backward rays (non-extension, non-gap)
    const forwardRays: Array<{ origin: Point; direction: Point; brightness: number }> = [];
    const backwardRays: Array<{ origin: Point; direction: Point; brightness: number }> = [];

    for (const seg of segments) {
      const dir = normalize(subtract(seg.p2, seg.p1));
      const brightness = seg.brightnessS + seg.brightnessP;
      if (!seg.isExtension) {
        forwardRays.push({ origin: seg.p1, direction: dir, brightness });
      } else {
        backwardRays.push({ origin: seg.p1, direction: dir, brightness });
      }
    }

    // Find convergence points among forward rays → real images
    this.findConvergencePoints(forwardRays, "real", images);

    // Find convergence points among backward extensions → virtual images
    this.findConvergencePoints(backwardRays, "virtual", images);
  }

  private findConvergencePoints(
    rays: Array<{ origin: Point; direction: Point; brightness: number }>,
    imageType: "real" | "virtual",
    images: DetectedImage[],
  ): void {
    const CONVERGENCE_THRESHOLD = 5;
    const seen = new Set<string>();

    for (let i = 0; i < rays.length && i < 500; i++) {
      for (let j = i + 1; j < rays.length && j < 500; j++) {
        const r1 = rays[i];
        const r2 = rays[j];
        if (!(r1 && r2)) {
          continue;
        }

        // Find intersection of two rays
        const denom = r1.direction.x * r2.direction.y - r1.direction.y * r2.direction.x;
        if (Math.abs(denom) < 1e-10) {
          continue;
        }

        const dx = r2.origin.x - r1.origin.x;
        const dy = r2.origin.y - r1.origin.y;
        const t1 = (dx * r2.direction.y - dy * r2.direction.x) / denom;

        const ix = r1.origin.x + r1.direction.x * t1;
        const iy = r1.origin.y + r1.direction.y * t1;

        // Quantize to a grid to avoid duplicate detections
        const key = `${Math.round(ix / CONVERGENCE_THRESHOLD)},${Math.round(iy / CONVERGENCE_THRESHOLD)}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        images.push({
          position: point(ix, iy),
          imageType,
          brightness: (r1.brightness + r2.brightness) / 2,
        });
      }
    }
  }
}
