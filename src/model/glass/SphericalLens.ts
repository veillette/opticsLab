/**
 * SphericalLens.ts
 *
 * A spherical lens defined by its diameter (distance p1↔p2 along the
 * optical axis) and the radii of curvature of its two surfaces (R1, R2).
 * Internally, the lens boundary is built as a PolygonGlass whose path
 * consists of two circular arcs. This class provides a convenient
 * constructor from lens-maker parameters.
 *
 * Sign convention for radii:
 *   R > 0 → center of curvature to the right of the surface
 *   R < 0 → center of curvature to the left of the surface
 *   R = Infinity → flat surface
 */

import { distance, normalize, type Point, point, subtract } from "../optics/Geometry.js";
import { PolygonGlass, type PolygonVertex } from "./PolygonGlass.js";

const ARC_SEGMENTS = 40;

export class SphericalLens extends PolygonGlass {
  public readonly serializedType = "SphericalLens";

  public readonly diameter: number;
  public readonly r1: number;
  public readonly r2: number;
  /** The two endpoints that define the optical axis of the lens. */
  public readonly axisP1: Point;
  public readonly axisP2: Point;

  /**
   * @param axisP1 - Center of the first surface (left endpoint of the lens axis).
   * @param axisP2 - Center of the second surface (right endpoint of the lens axis).
   * @param r1 - Radius of curvature of the first (left) surface.
   * @param r2 - Radius of curvature of the second (right) surface.
   * @param refIndex - Refractive index of the lens material.
   */
  public constructor(axisP1: Point, axisP2: Point, r1: number, r2: number, refIndex = 1.5) {
    const d = distance(axisP1, axisP2);
    const path = SphericalLens.buildLensPath(axisP1, axisP2, d, r1, r2);
    super(path, refIndex);
    this.axisP1 = axisP1;
    this.axisP2 = axisP2;
    this.diameter = d;
    this.r1 = r1;
    this.r2 = r2;
  }

  /**
   * Build the polygon path for a lens from its geometric parameters.
   * Each curved surface is approximated by a polyline (arc segments).
   */
  private static buildLensPath(axisP1: Point, axisP2: Point, d: number, r1: number, r2: number): PolygonVertex[] {
    if (d < 1e-10) {
      return [{ x: axisP1.x, y: axisP1.y }];
    }

    const axisDir = normalize(subtract(axisP2, axisP1));
    const perpDir = point(-axisDir.y, axisDir.x);
    const halfAperture = d / 2;
    const mid = point((axisP1.x + axisP2.x) / 2, (axisP1.y + axisP2.y) / 2);

    const vertices: PolygonVertex[] = [];

    // First surface (left): arc from top to bottom
    const arc1 = SphericalLens.arcPoints(mid, axisDir, perpDir, halfAperture, r1, -1, ARC_SEGMENTS);
    for (const p of arc1) {
      vertices.push({ x: p.x, y: p.y });
    }

    // Second surface (right): arc from bottom to top
    const arc2 = SphericalLens.arcPoints(mid, axisDir, perpDir, halfAperture, r2, 1, ARC_SEGMENTS);
    for (const p of arc2.reverse()) {
      vertices.push({ x: p.x, y: p.y });
    }

    return vertices;
  }

  /**
   * Generate points along a circular arc surface.
   * @param center - Center of the lens on the optical axis.
   * @param axisDir - Unit vector along the optical axis (left→right).
   * @param perpDir - Unit vector perpendicular to the axis (up).
   * @param halfAperture - Half the lens diameter.
   * @param R - Radius of curvature (signed).
   * @param side - -1 for left surface, +1 for right surface.
   * @param numSegments - Number of segments for arc approximation.
   */
  private static arcPoints(
    center: Point,
    axisDir: Point,
    perpDir: Point,
    halfAperture: number,
    R: number,
    side: number,
    numSegments: number,
  ): Point[] {
    const points: Point[] = [];

    if (!isFinite(R) || Math.abs(R) < 1e-10) {
      // Flat surface
      for (let i = 0; i <= numSegments; i++) {
        const t = -1 + (2 * i) / numSegments;
        const h = t * halfAperture;
        points.push(
          point(center.x + side * 0 * axisDir.x + h * perpDir.x, center.y + side * 0 * axisDir.y + h * perpDir.y),
        );
      }
      return points;
    }

    const absR = Math.abs(R);
    const effectiveHalfAperture = Math.min(halfAperture, absR);
    const sign = R > 0 ? 1 : -1;

    // Center of curvature
    const ccX = center.x + side * sign * absR * axisDir.x;
    const ccY = center.y + side * sign * absR * axisDir.y;

    const maxAngle = Math.asin(effectiveHalfAperture / absR);

    for (let i = 0; i <= numSegments; i++) {
      const t = -1 + (2 * i) / numSegments;
      const angle = t * maxAngle;
      // Point on arc: center_of_curvature + R * (-side*sign*cos(angle)*axis + sin(angle)*perp)
      const px = ccX + absR * (-side * sign * Math.cos(angle) * axisDir.x + Math.sin(angle) * perpDir.x);
      const py = ccY + absR * (-side * sign * Math.cos(angle) * axisDir.y + Math.sin(angle) * perpDir.y);
      points.push(point(px, py));
    }

    return points;
  }

  public override serialize(): Record<string, unknown> {
    return {
      type: this.type,
      axisP1: this.axisP1,
      axisP2: this.axisP2,
      r1: this.r1,
      r2: this.r2,
      refIndex: this.refIndex,
    };
  }
}
