/**
 * Glass.ts
 *
 * A glass element whose boundary is a closed path of line segments and/or
 * circular arcs. Rays crossing any edge are refracted by Snell's law.
 * Inside/outside determination uses the test-ray parity approach from
 * optics-template/src/core/sceneObjs/glass/Glass.js.
 *
 * Path format:
 *   path[i].arc === false (or undefined): regular vertex.
 *     If both path[i] and path[i+1] are non-arc, the edge i→i+1 is a line.
 *   path[i].arc === true: arc control point.
 *     The triple (path[i-1], path[i], path[i+1]) defines a circular arc
 *     from the previous vertex through the control point to the next vertex.
 */

import { ELEMENT_TYPE_GLASS } from "../../../OpticsLabStrings.js";
import {
  circle,
  distance,
  distanceSquared,
  line,
  linesIntersection,
  normalize,
  type Point,
  perpendicularBisector,
  point,
  rayCircleIntersections,
  raySegmentIntersection,
  segment,
  segmentNormal,
  subtract,
} from "../optics/Geometry.js";
import { MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type { IntersectionResult, RayCallConfig, RayInteractionResult, SimulationRay } from "../optics/OpticsTypes.js";
import { BaseGlass } from "./BaseGlass.js";

export interface GlassPathPoint {
  x: number;
  y: number;
  arc?: boolean;
  /** When true, the edge from this vertex to the next non-arc vertex is a flat aperture-rim edge. */
  isApertureEdge?: boolean;
}

/**
 * Check whether a candidate point on a circle lies on the arc from p1
 * through p3 (control) to p2, by verifying the chord p1–p2 does NOT
 * cross the segment p3→q.
 */
function isHitOnArc(q: Point, p1: Point, p2: Point, p3: Point): boolean {
  const chordIntersection = linesIntersection(line(p1, p2), line(p3, q));
  if (!chordIntersection) {
    return true;
  }
  return !isInBoundingBox(chordIntersection, p3, q);
}

function isInBoundingBox(p: Point, s1: Point, s2: Point): boolean {
  return (
    Math.min(s1.x, s2.x) - 1e-6 <= p.x &&
    p.x <= Math.max(s1.x, s2.x) + 1e-6 &&
    Math.min(s1.y, s2.y) - 1e-6 <= p.y &&
    p.y <= Math.max(s1.y, s2.y) + 1e-6
  );
}

export class Glass extends BaseGlass {
  public readonly type: string = ELEMENT_TYPE_GLASS;

  public path: GlassPathPoint[];

  public constructor(path: GlassPathPoint[], refIndex = 1.5, cauchyB = 0.004, partialReflect = true) {
    super(refIndex, cauchyB, partialReflect);
    this.path = path;
  }

  // ── Ray intersection ─────────────────────────────────────────────────────

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    if (this.path.length < 3) {
      return null;
    }

    let bestDistSq = Infinity;
    let bestResult: IntersectionResult | null = null;
    const n = this.path.length;

    for (let i = 0; i < n; i++) {
      const current = this.path[i % n] as GlassPathPoint;
      const next = this.path[(i + 1) % n] as GlassPathPoint;

      if (next.arc && !current.arc) {
        const after = this.path[(i + 2) % n] as GlassPathPoint;
        const result = this.intersectArc(ray, current, next, after, bestDistSq);
        if (result && result.distSq < bestDistSq) {
          bestDistSq = result.distSq;
          bestResult = result.hit; // fresh object — hitOnApertureEdge absent (falsy)
        }
      } else if (!(next.arc || current.arc)) {
        const result = this.intersectSegment(ray, current, next, bestDistSq);
        if (result && result.distSq < bestDistSq) {
          bestDistSq = result.distSq;
          bestResult = result.hit;
          if (current.isApertureEdge) {
            bestResult.hitOnApertureEdge = true;
          }
        }
      }
    }

    return bestResult;
  }

  private intersectArc(
    ray: SimulationRay,
    current: GlassPathPoint,
    arcControlPoint: GlassPathPoint,
    after: GlassPathPoint,
    currentBest: number,
  ): { hit: IntersectionResult; distSq: number } | null {
    const p1 = point(current.x, current.y);
    const p3 = point(arcControlPoint.x, arcControlPoint.y);
    const p2 = point(after.x, after.y);

    const center = linesIntersection(perpendicularBisector(segment(p1, p3)), perpendicularBisector(segment(p2, p3)));

    if (!(center && Number.isFinite(center.x) && Number.isFinite(center.y))) {
      return this.intersectSegment(ray, current, after, currentBest);
    }

    const r = distance(center, p3);
    const hits = rayCircleIntersections(ray.origin, ray.direction, circle(center, r));

    for (const hit of hits) {
      const dSq = distanceSquared(hit.point, ray.origin);
      if (dSq < MIN_RAY_LENGTH_SQ || dSq >= currentBest) {
        continue;
      }
      if (!isHitOnArc(hit.point, p1, p2, p3)) {
        continue;
      }
      const normal = normalize(subtract(hit.point, center));
      return {
        hit: { point: hit.point, t: hit.t, element: this, normal },
        distSq: dSq,
      };
    }
    return null;
  }

  private intersectSegment(
    ray: SimulationRay,
    a: GlassPathPoint,
    b: GlassPathPoint,
    currentBest: number,
  ): { hit: IntersectionResult; distSq: number } | null {
    const seg = segment(point(a.x, a.y), point(b.x, b.y));
    const hit = raySegmentIntersection(ray.origin, ray.direction, seg);
    if (!hit) {
      return null;
    }

    const dSq = distanceSquared(hit.point, ray.origin);
    if (dSq < MIN_RAY_LENGTH_SQ || dSq >= currentBest) {
      return null;
    }

    const normal = segmentNormal(seg);
    return {
      hit: { point: hit.point, t: hit.t, element: this, normal },
      distSq: dSq,
    };
  }

  // ── Ray interaction ──────────────────────────────────────────────────────

  public override onRayIncident(
    ray: SimulationRay,
    intersection: IntersectionResult,
    config?: RayCallConfig,
  ): RayInteractionResult {
    if ((config?.lensRimBlockingEnabled ?? false) && intersection.hitOnApertureEdge) {
      return { isAbsorbed: true };
    }

    const incidentType = this.getIncidentType(ray);

    if (incidentType === 0) {
      return {
        isAbsorbed: false,
        outgoingRay: { ...ray, origin: intersection.point },
      };
    }

    if (Number.isNaN(incidentType)) {
      return { isAbsorbed: true };
    }

    const n1 =
      incidentType === 1
        ? this.getRefIndexAt(intersection.point, ray)
        : 1 / this.getRefIndexAt(intersection.point, ray);

    let normal = intersection.normal;
    const cosI = -(normal.x * ray.direction.x + normal.y * ray.direction.y);
    if (cosI < 0) {
      normal = point(-normal.x, -normal.y);
    }

    return this.refractRay(ray, intersection.point, normal, n1, config?.partialReflectionEnabled ?? true);
  }

  // ── Inside/outside determination ─────────────────────────────────────────

  public getIncidentType(ray: SimulationRay): number {
    const perturbX = (Math.random() - 0.5) * 1e-5;
    const perturbY = (Math.random() - 0.5) * 1e-5;
    const testDir = point(ray.direction.x + perturbX, ray.direction.y + perturbY);

    let count = 0;
    const n = this.path.length;

    for (let i = 0; i < n; i++) {
      const current = this.path[i % n] as GlassPathPoint;
      const next = this.path[(i + 1) % n] as GlassPathPoint;

      if (next.arc && !current.arc) {
        const after = this.path[(i + 2) % n] as GlassPathPoint;
        count += this.countArcIntersections(ray.origin, testDir, current, next, after);
      } else if (!(next.arc || current.arc)) {
        count += this.countSegmentIntersections(ray.origin, testDir, current, next);
      }
    }

    return count % 2 === 1 ? 1 : -1;
  }

  private countArcIntersections(
    origin: Point,
    dir: Point,
    current: GlassPathPoint,
    arcControlPoint: GlassPathPoint,
    after: GlassPathPoint,
  ): number {
    const p1 = point(current.x, current.y);
    const p3 = point(arcControlPoint.x, arcControlPoint.y);
    const p2 = point(after.x, after.y);

    const center = linesIntersection(perpendicularBisector(segment(p1, p3)), perpendicularBisector(segment(p2, p3)));

    if (!(center && Number.isFinite(center.x) && Number.isFinite(center.y))) {
      return this.countSegmentIntersections(origin, dir, current, after);
    }

    const r = distance(center, p3);
    const hits = rayCircleIntersections(origin, dir, circle(center, r));
    let count = 0;

    for (const hit of hits) {
      if (distanceSquared(hit.point, origin) < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      if (!isHitOnArc(hit.point, p1, p2, p3)) {
        continue;
      }
      count++;
    }
    return count;
  }

  private countSegmentIntersections(origin: Point, dir: Point, a: GlassPathPoint, b: GlassPathPoint): number {
    const seg = segment(point(a.x, a.y), point(b.x, b.y));
    const hit = raySegmentIntersection(origin, dir, seg);
    if (hit && distanceSquared(hit.point, origin) >= MIN_RAY_LENGTH_SQ) {
      return 1;
    }
    return 0;
  }

  // ── Vertex editing (prisms only; no arc points) ────────────────────────────

  /**
   * Insert a new vertex on the edge from path[edgeIndex] to path[(edgeIndex+1)%n].
   * Only valid for plain polygons (no arc points).
   */
  public addVertexOnEdge(edgeIndex: number, p: Point): void {
    if (this.path.some((v) => v.arc)) {
      return;
    }
    const n = this.path.length;
    const i = ((edgeIndex % n) + n) % n;
    const insertAt = (i + 1) % n;
    this.path.splice(insertAt, 0, { x: p.x, y: p.y });
  }

  /**
   * Remove the vertex at the given index. Requires at least 4 vertices.
   * Only valid for plain polygons (no arc points).
   */
  public removeVertex(vertexIndex: number): boolean {
    if (this.path.length <= 3 || this.path.some((v) => v.arc)) {
      return false;
    }
    const n = this.path.length;
    const i = ((vertexIndex % n) + n) % n;
    this.path.splice(i, 1);
    return true;
  }

  // ── Serialization ────────────────────────────────────────────────────────

  public serialize(): Record<string, unknown> {
    return { type: this.type, path: this.path, refIndex: this.refIndex };
  }
}
