/**
 * OpticsScene.ts
 *
 * The top-level scene model for the optics simulation. Manages all optical
 * elements (light sources, mirrors, glass, blockers), simulation settings,
 * and runs the ray tracer on demand. This is the central data structure
 * that the view layer will eventually consume.
 */

import { DEFAULT_RAY_DENSITY } from "../../../OpticsLabConstants.js";
import { ApertureElement } from "../blockers/ApertureElement.js";
import { CircleBlocker } from "../blockers/CircleBlocker.js";
import { LineBlocker } from "../blockers/LineBlocker.js";
import { DetectorElement } from "../detectors/DetectorElement.js";
import { CircleGlass } from "../glass/CircleGlass.js";
import { DovePrism } from "../glass/DovePrism.js";
import { EquilateralPrism } from "../glass/EquilateralPrism.js";
import type { GlassPathPoint } from "../glass/Glass.js";
import { Glass } from "../glass/Glass.js";
import { HalfPlaneGlass } from "../glass/HalfPlaneGlass.js";
import { IdealLens } from "../glass/IdealLens.js";
import { ParallelogramPrism } from "../glass/ParallelogramPrism.js";
import { PorroPrism } from "../glass/PorroPrism.js";
import { RightAnglePrism } from "../glass/RightAnglePrism.js";
import { SlabGlass } from "../glass/SlabGlass.js";
import { SphericalLens } from "../glass/SphericalLens.js";
import { ReflectionGrating } from "../gratings/ReflectionGrating.js";
import { TransmissionGrating } from "../gratings/TransmissionGrating.js";
import { ArcLightSource } from "../light-sources/ArcLightSource.js";
import { BeamSource } from "../light-sources/BeamSource.js";
import { ContinuousSpectrumSource } from "../light-sources/ContinuousSpectrumSource.js";
import { PointSourceElement } from "../light-sources/PointSourceElement.js";
import { SingleRaySource } from "../light-sources/SingleRaySource.js";
import { ArcMirror } from "../mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "../mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../mirrors/SegmentMirror.js";
import type { Point } from "./Geometry.js";
import { point } from "./Geometry.js";
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
  rayDensity: DEFAULT_RAY_DENSITY,
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
    const [removed] = this.elements.splice(index, 1);
    removed?.dispose();
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
    for (const element of this.elements) {
      element.dispose();
    }
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

    // Clear detector bins before re-simulating
    for (const el of this.elements) {
      if (el instanceof DetectorElement) {
        el.clearHits();
      }
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

  public static fromJSON(json: string): OpticsScene {
    const data = JSON.parse(json) as {
      settings?: Partial<SceneSettings>;
      elements?: Record<string, unknown>[];
    };
    const scene = new OpticsScene(data.settings ?? {});
    for (const obj of data.elements ?? []) {
      const element = deserializeElement(obj);
      if (element !== null) {
        scene.addElement(element);
      }
    }
    return scene;
  }
}

function asPoint(v: unknown): Point {
  const p = v as { x: number; y: number };
  return point(p.x, p.y);
}

function deserializeElement(obj: Record<string, unknown>): OpticalElement | null {
  switch (obj["type"]) {
    case "PointSource":
      return new PointSourceElement(
        point(obj["x"] as number, obj["y"] as number),
        obj["brightness"] as number,
        obj["wavelength"] as number,
      );
    case "Beam":
      return new BeamSource(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["brightness"] as number,
        obj["wavelength"] as number,
        obj["emisAngle"] as number,
      );
    case "SingleRay":
      return new SingleRaySource(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["brightness"] as number,
        obj["wavelength"] as number,
      );
    case "ArcSource":
      return new ArcLightSource(
        point(obj["x"] as number, obj["y"] as number),
        obj["direction"] as number,
        obj["emissionAngle"] as number,
        obj["brightness"] as number,
        obj["wavelength"] as number,
      );
    case "continuousSpectrumSource":
      return new ContinuousSpectrumSource(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["wavelengthMin"] as number,
        obj["wavelengthStep"] as number,
        obj["wavelengthMax"] as number,
        obj["brightness"] as number,
      );
    case "Mirror":
      return new SegmentMirror(asPoint(obj["p1"]), asPoint(obj["p2"]));
    case "ArcMirror":
      return new ArcMirror(asPoint(obj["p1"]), asPoint(obj["p2"]), asPoint(obj["p3"]));
    case "ParabolicMirror":
      return new ParabolicMirror(asPoint(obj["p1"]), asPoint(obj["p2"]), asPoint(obj["p3"]));
    case "IdealMirror":
      return new IdealCurvedMirror(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["focalLength"] as number);
    case "BeamSplitter":
      return new BeamSplitterElement(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["transRatio"] as number);
    case "Glass":
      return new Glass(obj["path"] as GlassPathPoint[], obj["refIndex"] as number);
    case "EquilateralPrism":
      return new EquilateralPrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["size"] as number,
        obj["refIndex"] as number,
      );
    case "RightAnglePrism":
      return new RightAnglePrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["legLength"] as number,
        obj["refIndex"] as number,
      );
    case "PorroPrism":
      return new PorroPrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["legLength"] as number,
        obj["refIndex"] as number,
      );
    case "SlabGlass":
      return new SlabGlass(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["width"] as number,
        obj["height"] as number,
        obj["refIndex"] as number,
      );
    case "ParallelogramPrism":
      return new ParallelogramPrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["width"] as number,
        obj["height"] as number,
        obj["refIndex"] as number,
      );
    case "DovePrism":
      return new DovePrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["width"] as number,
        obj["height"] as number,
        obj["refIndex"] as number,
      );
    case "SphericalLens": {
      const lens = new SphericalLens(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["r1"] as number,
        obj["r2"] as number,
        obj["refIndex"] as number,
      );
      lens.createLensWithDR1R2(obj["d"] as number, obj["r1"] as number, obj["r2"] as number);
      return lens;
    }
    case "CircleGlass":
      return new CircleGlass(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["refIndex"] as number);
    case "PlaneGlass":
      return new HalfPlaneGlass(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["refIndex"] as number);
    case "IdealLens":
      return new IdealLens(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["focalLength"] as number);
    case "Aperture":
      return new ApertureElement(asPoint(obj["p1"]), asPoint(obj["p2"]), asPoint(obj["p3"]), asPoint(obj["p4"]));
    case "Blocker":
      return new LineBlocker(asPoint(obj["p1"]), asPoint(obj["p2"]));
    case "Detector":
      return new DetectorElement(asPoint(obj["p1"]), asPoint(obj["p2"]));
    case "CircleBlocker":
      return new CircleBlocker(asPoint(obj["p1"]), asPoint(obj["p2"]));
    case "ReflectionGrating":
      return new ReflectionGrating(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["linesDensity"] as number,
        obj["dutyCycle"] as number,
      );
    case "TransmissionGrating":
      return new TransmissionGrating(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["linesDensity"] as number,
        obj["dutyCycle"] as number,
      );
    default:
      return null;
  }
}
