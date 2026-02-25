/**
 * OpticsScene.ts
 *
 * The top-level scene model for the optics simulation. Manages all optical
 * elements (light sources, mirrors, glass, blockers), simulation settings,
 * and runs the ray tracer on demand. This is the central data structure
 * that the view layer will eventually consume.
 */

import type { Point } from "./Geometry.js";
import type { DetectedImage, Observer, OpticalElement, ViewMode } from "./OpticsTypes.js";
import { RayTracer, type RayTracerConfig, type TraceResult } from "./RayTracer.js";

// ── Scene Settings ───────────────────────────────────────────────────────────

export interface SceneSettings {
  mode: ViewMode;
  rayDensity: number;
  maxRayDepth: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  observer: Observer | null;
}

const DEFAULT_SETTINGS: SceneSettings = {
  mode: "rays",
  rayDensity: 0.1,
  maxRayDepth: 200,
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  observer: null,
};

// ── Scene ────────────────────────────────────────────────────────────────────

export class OpticsScene {
  private elements: OpticalElement[] = [];
  private settings: SceneSettings;
  private cachedResult: TraceResult | null = null;
  private dirty = true;

  public constructor(settings: Partial<SceneSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  // ── Element Management ───────────────────────────────────────────────────

  public addElement(element: OpticalElement): void {
    this.elements.push(element);
    this.invalidate();
  }

  public removeElement(elementId: string): boolean {
    const index = this.elements.findIndex((e) => e.id === elementId);
    if (index === -1) {
      return false;
    }
    this.elements.splice(index, 1);
    this.invalidate();
    return true;
  }

  public getElement(elementId: string): OpticalElement | undefined {
    return this.elements.find((e) => e.id === elementId);
  }

  public getAllElements(): ReadonlyArray<OpticalElement> {
    return this.elements;
  }

  public getElementsByCategory(category: string): OpticalElement[] {
    return this.elements.filter((e) => e.category === category);
  }

  public clearElements(): void {
    this.elements = [];
    this.invalidate();
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  public getSettings(): Readonly<SceneSettings> {
    return this.settings;
  }

  public updateSettings(partial: Partial<SceneSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.invalidate();
  }

  public setMode(mode: ViewMode): void {
    this.settings.mode = mode;
    this.invalidate();
  }

  public setRayDensity(density: number): void {
    this.settings.rayDensity = density;
    this.invalidate();
  }

  public setObserver(position: Point, radius = 20): void {
    this.settings.observer = { position, radius };
    if (this.settings.mode !== "observer") {
      this.settings.mode = "observer";
    }
    this.invalidate();
  }

  public clearObserver(): void {
    this.settings.observer = null;
    if (this.settings.mode === "observer") {
      this.settings.mode = "rays";
    }
    this.invalidate();
  }

  // ── Simulation ───────────────────────────────────────────────────────────

  /** Mark the simulation as needing a re-run. */
  public invalidate(): void {
    this.dirty = true;
    this.cachedResult = null;
  }

  /** Run the ray tracer (or return cached result if scene hasn't changed). */
  public simulate(): TraceResult {
    if (!this.dirty && this.cachedResult) {
      return this.cachedResult;
    }

    const config: Partial<RayTracerConfig> = {
      maxRayDepth: this.settings.maxRayDepth,
      rayDensity: this.settings.rayDensity,
      mode: this.settings.mode,
      observer: this.settings.observer ?? undefined,
    };

    const tracer = new RayTracer(this.elements, config);
    this.cachedResult = tracer.trace();
    this.dirty = false;
    return this.cachedResult;
  }

  /** Shorthand to get detected images from the last simulation. */
  public getImages(): ReadonlyArray<DetectedImage> {
    const result = this.simulate();
    return result.images;
  }

  // ── Serialization ────────────────────────────────────────────────────────

  public toJSON(): string {
    return JSON.stringify(
      {
        settings: {
          mode: this.settings.mode,
          rayDensity: this.settings.rayDensity,
          maxRayDepth: this.settings.maxRayDepth,
          showGrid: this.settings.showGrid,
          snapToGrid: this.settings.snapToGrid,
          gridSize: this.settings.gridSize,
          observer: this.settings.observer,
        },
        elements: this.elements.map((e) => e.serialize()),
      },
      null,
      2,
    );
  }
}
