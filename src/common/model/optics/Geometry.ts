/**
 * Geometry.ts
 *
 * Core geometric primitives and utilities for 2D optics simulation.
 * Provides point/line/circle operations, intersections, and transformations
 * used throughout the ray tracing engine.
 */

// ── Primitive Types ──────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  p1: Point;
  p2: Point;
}

export interface Circle {
  center: Point;
  radius: number;
}

export interface Segment {
  p1: Point;
  p2: Point;
}

// ── Factory Functions ────────────────────────────────────────────────────────

export function point(x: number, y: number): Point {
  return { x, y };
}

export function line(p1: Point, p2: Point): Line {
  return { p1, p2 };
}

export function segment(p1: Point, p2: Point): Segment {
  return { p1, p2 };
}

export function circle(center: Point, radius: number): Circle {
  return { center, radius };
}

// ── Vector Operations ────────────────────────────────────────────────────────

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function distanceSquared(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

export function segmentLength(seg: Segment): number {
  return distance(seg.p1, seg.p2);
}

export function segmentMidpoint(seg: Segment): Point {
  return point((seg.p1.x + seg.p2.x) / 2, (seg.p1.y + seg.p2.y) / 2);
}

export function midpoint(p1: Point, p2: Point): Point {
  return point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

/** Projects point p onto the infinite line through lineP1 and lineP2. */
export function projectPointOntoLine(p: Point, lineP1: Point, lineP2: Point): Point {
  const dx = lineP2.x - lineP1.x;
  const dy = lineP2.y - lineP1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-20) {
    return point(lineP1.x, lineP1.y);
  }
  const apx = p.x - lineP1.x;
  const apy = p.y - lineP1.y;
  const t = (apx * dx + apy * dy) / lenSq;
  return point(lineP1.x + t * dx, lineP1.y + t * dy);
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function normalize(p: Point): Point {
  const len = Math.hypot(p.x, p.y);
  if (len === 0) {
    return point(0, 0);
  }
  return point(p.x / len, p.y / len);
}

export function scale(p: Point, s: number): Point {
  return point(p.x * s, p.y * s);
}

export function add(a: Point, b: Point): Point {
  return point(a.x + b.x, a.y + b.y);
}

export function subtract(a: Point, b: Point): Point {
  return point(a.x - b.x, a.y - b.y);
}

export function rotate(p: Point, angle: number, center: Point = point(0, 0)): Point {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return point(center.x + dx * cos - dy * sin, center.y + dx * sin + dy * cos);
}

// ── Normal Computation ───────────────────────────────────────────────────────

/** Returns the outward-pointing unit normal of a segment (left-hand normal of p1→p2). */
export function segmentNormal(seg: Segment): Point {
  const dx = seg.p2.x - seg.p1.x;
  const dy = seg.p2.y - seg.p1.y;
  return normalize(point(dy, -dx));
}

// ── Intersections ────────────────────────────────────────────────────────────

/** Intersect two infinite lines. Returns null if parallel. */
export function linesIntersection(l1: Line, l2: Line): Point | null {
  const a1 = l1.p2.x - l1.p1.x;
  const b1 = l1.p2.y - l1.p1.y;
  const a2 = l2.p2.x - l2.p1.x;
  const b2 = l2.p2.y - l2.p1.y;
  const denom = a1 * b2 - a2 * b1;
  if (Math.abs(denom) < 1e-12) {
    return null;
  }
  const c1 = l2.p1.x - l1.p1.x;
  const c2 = l2.p1.y - l1.p1.y;
  const t = (c1 * b2 - c2 * a2) / denom;
  return point(l1.p1.x + a1 * t, l1.p1.y + b1 * t);
}

/**
 * Intersection of a ray with an infinite line defined by two points (seg.p1, seg.p2).
 * Unlike raySegmentIntersection, the u parameter is unconstrained (no segment clipping).
 * Returns null if the ray is parallel to the line or the intersection is behind the ray.
 */
export function rayLineIntersection(rayOrigin: Point, rayDir: Point, seg: Segment): { t: number; point: Point } | null {
  const dx = seg.p2.x - seg.p1.x;
  const dy = seg.p2.y - seg.p1.y;
  const denom = rayDir.x * dy - rayDir.y * dx;
  if (Math.abs(denom) < 1e-12) {
    return null;
  }
  const ox = seg.p1.x - rayOrigin.x;
  const oy = seg.p1.y - rayOrigin.y;
  const t = (ox * dy - oy * dx) / denom;
  if (t > 1e-6) {
    return { t, point: point(rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t) };
  }
  return null;
}

/** Returns t parameter of the intersection along the ray direction. null if no valid intersection. */
export function raySegmentIntersection(
  rayOrigin: Point,
  rayDir: Point,
  seg: Segment,
): { t: number; point: Point } | null {
  const dx = seg.p2.x - seg.p1.x;
  const dy = seg.p2.y - seg.p1.y;
  const denom = rayDir.x * dy - rayDir.y * dx;
  if (Math.abs(denom) < 1e-12) {
    return null;
  }
  const ox = seg.p1.x - rayOrigin.x;
  const oy = seg.p1.y - rayOrigin.y;
  const t = (ox * dy - oy * dx) / denom;
  const u = (ox * rayDir.y - oy * rayDir.x) / denom;
  if (t > 1e-6 && u >= 0 && u <= 1) {
    return { t, point: point(rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t) };
  }
  return null;
}

/** Intersection of ray with circle. Returns up to 2 intersection t-values sorted ascending. */
export function rayCircleIntersections(rayOrigin: Point, rayDir: Point, c: Circle): Array<{ t: number; point: Point }> {
  const ox = rayOrigin.x - c.center.x;
  const oy = rayOrigin.y - c.center.y;
  const a = rayDir.x * rayDir.x + rayDir.y * rayDir.y;
  const b = 2 * (ox * rayDir.x + oy * rayDir.y);
  const cc = ox * ox + oy * oy - c.radius * c.radius;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) {
    return [];
  }
  const sqrtDisc = Math.sqrt(disc);
  const results: Array<{ t: number; point: Point }> = [];
  for (const sign of [-1, 1]) {
    const t = (-b + sign * sqrtDisc) / (2 * a);
    if (t > 1e-6) {
      results.push({ t, point: point(rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t) });
    }
  }
  results.sort((r1, r2) => r1.t - r2.t);
  return results;
}

/** Intersection of ray with an arc (defined by center, radius, start/end angles). */
export function rayArcIntersection(
  rayOrigin: Point,
  rayDir: Point,
  arcCenter: Point,
  arcRadius: number,
  startAngle: number,
  endAngle: number,
  counterclockwise: boolean,
): { t: number; point: Point } | null {
  const hits = rayCircleIntersections(rayOrigin, rayDir, circle(arcCenter, arcRadius));
  for (const hit of hits) {
    const angle = Math.atan2(hit.point.y - arcCenter.y, hit.point.x - arcCenter.x);
    if (isAngleInArc(angle, startAngle, endAngle, counterclockwise)) {
      return hit;
    }
  }
  return null;
}

function isAngleInArc(angle: number, start: number, end: number, counterclockwise: boolean): boolean {
  const normalizeAngle = (v: number): number => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  const e = normalizeAngle(end);
  if (counterclockwise) {
    if (s <= e) {
      return a >= s && a <= e;
    }
    return a >= s || a <= e;
  }
  if (s >= e) {
    return a <= s && a >= e;
  }
  return a <= s || a >= e;
}

// ── Perpendicular Bisector ───────────────────────────────────────────────────

export function perpendicularBisector(seg: Segment): Line {
  const mid = segmentMidpoint(seg);
  const dx = seg.p2.x - seg.p1.x;
  const dy = seg.p2.y - seg.p1.y;
  return line(mid, point(mid.x - dy, mid.y + dx));
}

// ── Polygon centroid ─────────────────────────────────────────────────────────

/** Arithmetic centroid (mean of all vertices) of a polygon. */
export function polygonCentroid(path: { x: number; y: number }[]): Point {
  const n = path.length;
  let sx = 0;
  let sy = 0;
  for (const p of path) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / n, y: sy / n };
}

// ── Point-in-Polygon ─────────────────────────────────────────────────────────

export function pointInPolygon(p: Point, vertices: Point[]): boolean {
  let inside = false;
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];
    if (!(vi && vj)) {
      continue;
    }
    const xi = vi.x;
    const yi = vi.y;
    const xj = vj.x;
    const yj = vj.y;
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Whether a point is inside a circle. */
export function pointInCircle(p: Point, c: Circle): boolean {
  return distanceSquared(p, c.center) < c.radius * c.radius;
}

// ── Reflection ───────────────────────────────────────────────────────────────

/** Reflect a direction vector about a normal. */
export function reflect(direction: Point, normal: Point): Point {
  const d = dot(direction, normal);
  return point(direction.x - 2 * d * normal.x, direction.y - 2 * d * normal.y);
}

// ── Refraction (Snell's law) ─────────────────────────────────────────────────

/**
 * Compute the refracted direction using Snell's law.
 * Returns null for total internal reflection.
 * @param direction - Incident direction (unit vector)
 * @param normal - Surface normal at incidence point (pointing outward from surface)
 * @param n1 - Refractive index of the medium the ray is coming from
 * @param n2 - Refractive index of the medium the ray is entering
 */
export function refract(direction: Point, normal: Point, n1: number, n2: number): Point | null {
  const cosI = -dot(direction, normal);
  const sinI2 = 1 - cosI * cosI;
  const ratio = n1 / n2;
  const sinT2 = ratio * ratio * sinI2;
  if (sinT2 > 1) {
    return null; // total internal reflection
  }
  const cosT = Math.sqrt(1 - sinT2);
  return point(
    ratio * direction.x + (ratio * cosI - cosT) * normal.x,
    ratio * direction.y + (ratio * cosI - cosT) * normal.y,
  );
}

// ── Circumcenter / Arc Sampling ──────────────────────────────────────────────

/**
 * Compute the circumcenter (and circumradius) of the triangle formed by
 * three points.  Returns null if the points are collinear (degenerate arc).
 */
export function circumcenter(p1: Point, p2: Point, p3: Point): { center: Point; radius: number } | null {
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;

  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-10) {
    return null; // collinear
  }

  const a2 = ax * ax + ay * ay;
  const b2 = bx * bx + by * by;
  const c2 = cx * cx + cy * cy;

  const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / D;
  const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / D;

  const center = point(ux, uy);
  const radius = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);
  return { center, radius };
}

/**
 * Sample n+1 model-space points along the circular arc from p1 to p2
 * passing through p3.  Falls back to a straight line when the three points
 * are collinear.
 */
export function sampleArcPoints(p1: Point, p2: Point, p3: Point, n: number): Point[] {
  const geo = circumcenter(p1, p2, p3);
  if (!geo) {
    // Collinear: return a straight-line interpolation
    const pts: Point[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(point(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t));
    }
    return pts;
  }

  const { center, radius } = geo;
  const norm = (a: number): number => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const a1 = norm(Math.atan2(p1.y - center.y, p1.x - center.x));
  const a2 = norm(Math.atan2(p2.y - center.y, p2.x - center.x));
  const a3 = norm(Math.atan2(p3.y - center.y, p3.x - center.x));

  // CCW sweep from a1 to a2; check if a3 is within this sweep
  const ccwSweep12 = norm(a2 - a1);
  const ccwDist13 = norm(a3 - a1);

  // Go CCW if a3 lies within the CCW arc from a1 to a2; otherwise go CW
  const sweepAngle = ccwDist13 < ccwSweep12 ? ccwSweep12 : -(2 * Math.PI - ccwSweep12);

  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const angle = a1 + sweepAngle * (i / n);
    pts.push(point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle)));
  }
  return pts;
}

// ── Fresnel Equations ────────────────────────────────────────────────────────

/**
 * Fresnel reflectance for s and p polarizations.
 * @returns [Rs, Rp] reflectance values in [0, 1]
 */
export function fresnelReflectance(cosI: number, n1: number, n2: number): [number, number] {
  const sinI2 = 1 - cosI * cosI;
  const ratio = n1 / n2;
  const sinT2 = ratio * ratio * sinI2;
  if (sinT2 > 1) {
    return [1, 1]; // total internal reflection
  }
  const cosT = Math.sqrt(1 - sinT2);
  const absCosI = Math.abs(cosI);
  const Rs = ((n1 * absCosI - n2 * cosT) / (n1 * absCosI + n2 * cosT)) ** 2;
  const Rp = ((n1 * cosT - n2 * absCosI) / (n1 * cosT + n2 * absCosI)) ** 2;
  return [Rs, Rp];
}
