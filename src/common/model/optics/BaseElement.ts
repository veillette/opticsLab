/**
 * BaseElement.ts
 *
 * Abstract base class for all optical elements in the scene.
 * Provides a unique ID, serialization skeleton, and default no-op
 * implementations for the OpticalElement interface.
 */

import type { Bounds } from "./Geometry.js";
import type {
  ElementCategory,
  IntersectionResult,
  OpticalElement,
  RayCallConfig,
  RayInteractionResult,
  SimulationRay,
  ViewMode,
} from "./OpticsTypes.js";

let nextElementId = 1;

export abstract class BaseElement implements OpticalElement {
  private _id: string;
  public get id(): string {
    return this._id;
  }
  public abstract readonly type: string;
  public abstract readonly category: ElementCategory;

  protected constructor() {
    this._id = `element-${nextElementId++}`;
  }

  emitRays(_rayDensity: number, _mode: ViewMode): SimulationRay[] {
    return [];
  }

  checkRayIntersection(_ray: SimulationRay): IntersectionResult | null {
    return null;
  }

  onRayIncident(_ray: SimulationRay, _intersection: IntersectionResult, _config?: RayCallConfig): RayInteractionResult {
    return { isAbsorbed: true };
  }

  abstract serialize(): Record<string, unknown>;

  /**
   * Compute the axis-aligned bounding box of this element's geometry.
   * Used by the spatial index in the ray tracer for efficient intersection culling.
   */
  abstract getBounds(): Bounds;

  /**
   * Restore a stable id when deserializing from JSON or PhET-iO state (ids are normally assigned in the constructor).
   */
  public reassignIdForDeserialization(id: string): void {
    this._id = id;
  }

  /**
   * Release any resources held by this element to prevent memory leaks.
   * Subclasses with internal state (e.g. hit arrays) should override this
   * and call super.dispose().
   */
  dispose(): void {
    // Default: nothing to clean up in the base class.
  }
}
