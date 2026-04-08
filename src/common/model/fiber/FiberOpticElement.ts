/**
 * FiberOpticElement.ts
 *
 * A fiber-optic waveguide whose centreline follows a Catmull–Rom spline with
 * tension τ = 0.5 through five user-controllable points:
 *
 *   p1 → cp1 → cp2 → cp3 → p2
 *
 * The spline is sampled to build two nested ribbon polygons:
 *
 *   • Outer cladding  — Glass with refIndex (n_cladding), physics boundary
 *     at the outer wall.  Rays entering from air are refracted here.
 *   • Inner core      — FiberCoreGlass with coreRefIndex (n_core > n_cladding).
 *     Its outside medium is the cladding, not air, so refraction at the
 *     core–cladding interface uses the correct n_cladding / n_core ratio.
 *     TIR at this boundary guides rays through the core.
 *
 * The scene receives both physics objects via getPhysicsElements() so the ray
 * tracer handles both boundaries automatically.
 *
 * coreRadiusFraction (fraction of outerRadius) sets the core half-width for
 * both rendering and physics.
 */

import {
  DEFAULT_REFRACTIVE_INDEX,
  FIBER_OPTIC_CORE_REFRACTIVE_INDEX,
  FIBER_OPTIC_DEFAULT_OUTER_RADIUS_M,
} from "../../../OpticsLabConstants.js";
import { ELEMENT_TYPE_FIBER_CORE_GLASS, ELEMENT_TYPE_FIBER_OPTIC } from "../../../OpticsLabStrings.js";
import { Glass, type GlassPathPoint } from "../glass/Glass.js";
import type { Point } from "../optics/Geometry.js";
import type {
  IntersectionResult,
  OpticalElement,
  RayCallConfig,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

// ── Default indices ────────────────────────────────────────────────────────────

/** Default cladding refractive index. Equal to DEFAULT_REFRACTIVE_INDEX. */
const DEFAULT_CLADDING_REFRACTIVE_INDEX = DEFAULT_REFRACTIVE_INDEX;

// ── FiberCoreGlass ─────────────────────────────────────────────────────────────

/**
 * Inner-core ribbon Glass whose outside medium is the cladding (not air).
 *
 * Overrides onRayIncident to use outerRefIndex (= cladding n) instead of 1
 * when computing the Snell's-law ratio at the core–cladding interface.
 */
export class FiberCoreGlass extends Glass {
  public override readonly type = ELEMENT_TYPE_FIBER_CORE_GLASS;

  /** The refractive index of the surrounding cladding medium. */
  public outerRefIndex: number;

  public constructor(coreRefIndex: number, claddingRefIndex: number) {
    super([], coreRefIndex, 0.004, true);
    this.outerRefIndex = claddingRefIndex;
  }

  public override onRayIncident(
    ray: SimulationRay,
    intersection: IntersectionResult,
    config?: RayCallConfig,
  ): RayInteractionResult {
    const incidentType = this.getIncidentType(ray);

    if (incidentType === 0) {
      return { isAbsorbed: false, outgoingRay: { ...ray, origin: intersection.point } };
    }
    if (Number.isNaN(incidentType)) {
      return { isAbsorbed: true };
    }

    // n1 = n_incident / n_transmitted
    const nCore = this.getRefIndexAt(intersection.point, ray);
    const nCladding = this.outerRefIndex;
    const n1 =
      incidentType === 1
        ? nCore / nCladding // core → cladding
        : nCladding / nCore; // cladding → core

    let normal = intersection.normal;
    const cosI = -(normal.x * ray.direction.x + normal.y * ray.direction.y);
    if (cosI < 0) {
      normal = { x: -normal.x, y: -normal.y };
    }

    return this.refractRay(ray, intersection.point, normal, n1, config?.partialReflectionEnabled ?? true);
  }

  /** Never serialized independently — the parent FiberOpticElement owns serialization. */
  public override serialize(): Record<string, unknown> {
    return {};
  }
}

// ── Catmull–Rom maths ─────────────────────────────────────────────────────────

const TENSION = 0.5;

/**
 * Position on the Catmull–Rom segment from p1 to p2, with context points
 * p0 (before) and p3 (after), evaluated at parameter t ∈ [0, 1].
 */
function crPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  const tension = TENSION;
  const c0 = tension * (-t3 + 2 * t2 - t);
  const c1 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
  const c2 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
  const c3 = tension * (t3 - t2);
  return {
    x: c0 * p0.x + c1 * p1.x + c2 * p2.x + c3 * p3.x,
    y: c0 * p0.y + c1 * p1.y + c2 * p2.y + c3 * p3.y,
  };
}

/**
 * Tangent (derivative dP/dt) of the same segment, evaluated at t.
 * The tangent at t=0 is τ*(p2−p0) and at t=1 is τ*(p3−p1).
 */
function crTangent(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const tension = TENSION;
  const d0 = tension * (-3 * t * t + 4 * t - 1);
  const d1 = 3 * (2 - tension) * t * t + 2 * (tension - 3) * t;
  const d2 = 3 * (tension - 2) * t * t + 2 * (3 - 2 * tension) * t + tension;
  const d3 = tension * (3 * t * t - 2 * t);
  return {
    x: d0 * p0.x + d1 * p1.x + d2 * p2.x + d3 * p3.x,
    y: d0 * p0.y + d1 * p1.y + d2 * p2.y + d3 * p3.y,
  };
}

// ── Number of samples used to approximate the spline ─────────────────────────

/** Intervals per Catmull–Rom segment. Total samples = 4 × N + 1. */
const N_PER_SEG = 8;

// ── Ribbon path builder ───────────────────────────────────────────────────────

function buildRibbonPath(samples: Array<{ point: Point; tangent: Point }>, r: number): GlassPathPoint[] {
  const top: GlassPathPoint[] = [];
  const bot: GlassPathPoint[] = [];
  for (const { point, tangent } of samples) {
    const tLen = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
    if (tLen < 1e-10) {
      continue;
    }
    const nx = -tangent.y / tLen;
    const ny = tangent.x / tLen;
    top.push({ x: point.x + nx * r, y: point.y + ny * r });
    bot.push({ x: point.x - nx * r, y: point.y - ny * r });
  }
  bot.reverse();
  return [...top, ...bot];
}

// ── Model class ───────────────────────────────────────────────────────────────

export class FiberOpticElement extends Glass {
  public override readonly type = ELEMENT_TYPE_FIBER_OPTIC;

  /** Start endpoint (anchor, does not affect tangent direction). */
  public p1: Point;
  /** Control point ~1/4 along the fibre. */
  public cp1: Point;
  /** Control point ~1/2 along the fibre (midpoint). */
  public cp2: Point;
  /** Control point ~3/4 along the fibre. */
  public cp3: Point;
  /** End endpoint. */
  public p2: Point;

  /** Half-width of the full fibre boundary (used for cladding physics and visual). */
  public outerRadius: number;

  /**
   * Inner-core half-width as a fraction of outerRadius [0, 1].
   * Controls both the core visual and the core physics polygon radius.
   */
  public coreRadiusFraction: number;

  /** Refractive index of the inner core (physics + rendering). */
  public get coreRefIndex(): number {
    return this.coreGlass.refIndex;
  }
  public set coreRefIndex(v: number) {
    this.coreGlass.refIndex = v;
  }

  /**
   * The inner-core physics element.  Registered in the scene via
   * getPhysicsElements() so the ray tracer handles core–cladding refraction.
   */
  public readonly coreGlass: FiberCoreGlass;

  public constructor(
    p1: Point,
    cp1: Point,
    cp2: Point,
    cp3: Point,
    p2: Point,
    outerRadius = FIBER_OPTIC_DEFAULT_OUTER_RADIUS_M,
    refIndex = DEFAULT_CLADDING_REFRACTIVE_INDEX,
    coreRadiusFraction = 0.45,
    coreRefIndex = FIBER_OPTIC_CORE_REFRACTIVE_INDEX,
  ) {
    super([], refIndex, 0.004, true);
    this.p1 = p1;
    this.cp1 = cp1;
    this.cp2 = cp2;
    this.cp3 = cp3;
    this.p2 = p2;
    this.outerRadius = outerRadius;
    this.coreRadiusFraction = coreRadiusFraction;
    this.coreGlass = new FiberCoreGlass(coreRefIndex, refIndex);
    this.rebuildPath();
  }

  /**
   * Sample the Catmull–Rom spline at N_PER_SEG × 4 + 1 evenly-spaced
   * parameter values.  Returns { point, tangent } pairs in model space.
   *
   * Phantom end-points are mirrored so the curve interpolates p1 and p2
   * with a smooth tangent defined by the first/last interior control points.
   */
  public getSamples(): Array<{ point: Point; tangent: Point }> {
    const { p1, cp1, cp2, cp3, p2 } = this;
    const ph0: Point = { x: 2 * p1.x - cp1.x, y: 2 * p1.y - cp1.y };
    const ph4: Point = { x: 2 * p2.x - cp3.x, y: 2 * p2.y - cp3.y };

    // 4 Catmull–Rom segments: p1→cp1, cp1→cp2, cp2→cp3, cp3→p2
    const segs: [Point, Point, Point, Point][] = [
      [ph0, p1, cp1, cp2],
      [p1, cp1, cp2, cp3],
      [cp1, cp2, cp3, p2],
      [cp2, cp3, p2, ph4],
    ];

    const result: Array<{ point: Point; tangent: Point }> = [];
    for (let s = 0; s < segs.length; s++) {
      const seg = segs[s];
      if (!seg) {
        continue;
      }
      const [a, b, c, d] = seg;
      const kMax = s < segs.length - 1 ? N_PER_SEG : N_PER_SEG + 1;
      for (let k = 0; k < kMax; k++) {
        const t = k / N_PER_SEG;
        result.push({ point: crPoint(a, b, c, d, t), tangent: crTangent(a, b, c, d, t) });
      }
    }
    return result;
  }

  /**
   * Rebuild both ribbon polygon paths (cladding and core) from the current
   * spline geometry.  Also syncs coreGlass.outerRefIndex to match refIndex
   * so that a cladding-index edit is immediately reflected at the core boundary.
   */
  public rebuildPath(): void {
    const samples = this.getSamples();
    this.path = buildRibbonPath(samples, this.outerRadius);
    this.coreGlass.path = buildRibbonPath(samples, this.outerRadius * this.coreRadiusFraction);
    // Keep the core's outside-medium index in sync with the cladding.
    this.coreGlass.outerRefIndex = this.refIndex;
  }

  /**
   * Returns both the outer cladding (this) and the inner core glass so the
   * ray tracer handles refraction at both boundaries.
   */
  public getPhysicsElements(): OpticalElement[] {
    return [this, this.coreGlass];
  }

  public override serialize(): Record<string, unknown> {
    return {
      type: this.type,
      p1: this.p1,
      cp1: this.cp1,
      cp2: this.cp2,
      cp3: this.cp3,
      p2: this.p2,
      outerRadius: this.outerRadius,
      refIndex: this.refIndex,
      coreRadiusFraction: this.coreRadiusFraction,
      coreRefIndex: this.coreRefIndex,
      id: this.id,
    };
  }
}
