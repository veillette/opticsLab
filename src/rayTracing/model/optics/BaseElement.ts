/**
 * BaseElement.ts
 *
 * Abstract base class for all optical elements in the scene.
 * Provides a unique ID, serialization skeleton, and default no-op
 * implementations for the OpticalElement interface.
 */

import type { Point } from "./Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  OpticalElement,
  RayInteractionResult,
  SimulationRay,
  ViewMode,
} from "./OpticsTypes.js";

let nextElementId = 1;

export abstract class BaseElement implements OpticalElement {
  public readonly id: string;
  public abstract readonly type: string;
  public abstract readonly category: ElementCategory;

  protected constructor() {
    this.id = `element-${nextElementId++}`;
  }

  emitRays(_rayDensity: number, _mode: ViewMode): SimulationRay[] {
    return [];
  }

  checkRayIntersection(_ray: SimulationRay): IntersectionResult | null {
    return null;
  }

  onRayIncident(_ray: SimulationRay, _intersection: IntersectionResult): RayInteractionResult {
    return { isAbsorbed: true };
  }

  abstract serialize(): Record<string, unknown>;

  // ── Geometric Transform Helpers ──────────────────────────────────────────

  protected static movePoint(p: Point, dx: number, dy: number): Point {
    return { x: p.x + dx, y: p.y + dy };
  }

  protected static rotatePoint(p: Point, angle: number, center: Point): Point {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
  }

  protected static scalePoint(p: Point, factor: number, center: Point): Point {
    return {
      x: center.x + (p.x - center.x) * factor,
      y: center.y + (p.y - center.y) * factor,
    };
  }
}
