/**
 * OpticsScene.ts
 *
 * The top-level scene model for the optics simulation. Manages all optical
 * elements (light sources, mirrors, glass, blockers), simulation settings,
 * and runs the ray tracer on demand. Instrumented with PhET-iO tandems.
 */

import { BooleanProperty, Emitter, Multilink, NumberProperty, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import {
  IOType,
  NullableIO,
  ObjectLiteralIO,
  PhetioGroup,
  PhetioObject,
  StringUnionIO,
  Tandem,
} from "scenerystack/tandem";
import {
  DEFAULT_RAY_DENSITY,
  GRID_SPACING_MAX_M,
  GRID_SPACING_MIN_M,
  MAX_RAY_DEPTH_PROPERTY_MAX,
  MAX_RAY_DEPTH_PROPERTY_MIN,
  RAY_DENSITY_MAX,
  RAY_DENSITY_MIN,
} from "../../../OpticsLabConstants.js";
import { DetectorElement } from "../detectors/DetectorElement.js";
import { ARCHETYPE_ELEMENT_STATE, deserializeElement, LIVE_ELEMENT_STATE_KEY } from "./elementSerialization.js";
import type { Point } from "./Geometry.js";
import { point } from "./Geometry.js";
import OpticalElementPhetioObject from "./OpticalElementPhetioObject.js";
import type { Observer, OpticalElement, ViewMode } from "./OpticsTypes.js";
import { RayTracer, type RayTracerConfig, type TraceResult } from "./RayTracer.js";

// ── Scene Settings ───────────────────────────────────────────────────────────

export const VIEW_MODE_VALUES = ["rays", "extended", "images", "observer"] as const;

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
  gridSize: 1,
  observer: null,
};

const ViewModeIO = StringUnionIO(VIEW_MODE_VALUES);

const ObserverCoreIO = new IOType<Observer, { x: number; y: number; radius: number }>("ObserverIO", {
  supertype: ObjectLiteralIO,
  documentation: "Observer position (model metres, y up) and collection radius.",
  toStateObject: (o) => ({ x: o.position.x, y: o.position.y, radius: o.radius }),
  fromStateObject: (s) => ({ position: point(s.x, s.y), radius: s.radius }),
});

const NullableObserverIO = NullableIO(ObserverCoreIO);

// ── Scene ────────────────────────────────────────────────────────────────────

export class OpticsScene extends PhetioObject {
  public readonly modeProperty: Property<ViewMode>;
  public readonly rayDensityProperty: NumberProperty;
  public readonly maxRayDepthProperty: NumberProperty;
  public readonly showGridProperty: BooleanProperty;
  public readonly snapToGridProperty: BooleanProperty;
  public readonly gridSizeProperty: NumberProperty;
  public readonly observerProperty: Property<Observer | null>;

  public readonly opticalElementsGroup: PhetioGroup<OpticalElementPhetioObject, [Record<string, unknown>]>;

  public readonly sceneChangedEmitter: Emitter;

  private cachedResult: TraceResult | null = null;
  private dirty = true;

  public constructor(tandem: Tandem, settings: Partial<SceneSettings> = {}) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };

    super({
      tandem,
      phetioType: IOType.ObjectIO,
      phetioFeatured: true,
      phetioDocumentation: "Ray-tracing scene: settings and draggable optical elements.",
    });

    const modeTandem = tandem.createTandem("modeProperty");
    const rayTandem = tandem.createTandem("rayDensityProperty");
    const depthTandem = tandem.createTandem("maxRayDepthProperty");
    const showGridTandem = tandem.createTandem("showGridProperty");
    const snapTandem = tandem.createTandem("snapToGridProperty");
    const gridSizeTandem = tandem.createTandem("gridSizeProperty");
    const observerTandem = tandem.createTandem("observerProperty");

    this.modeProperty = new Property<ViewMode>(merged.mode, {
      tandem: modeTandem,
      phetioFeatured: true,
      phetioDocumentation: "Visualization mode for rays (rays, extended, images, or observer).",
      phetioValueType: ViewModeIO,
    });

    this.rayDensityProperty = new NumberProperty(merged.rayDensity, {
      tandem: rayTandem,
      range: new Range(RAY_DENSITY_MIN, RAY_DENSITY_MAX),
      phetioFeatured: true,
      phetioDocumentation: "Ray density used when tracing (higher = more rays).",
    });

    this.maxRayDepthProperty = new NumberProperty(merged.maxRayDepth, {
      tandem: depthTandem,
      range: new Range(MAX_RAY_DEPTH_PROPERTY_MIN, MAX_RAY_DEPTH_PROPERTY_MAX),
      numberType: "Integer",
      phetioFeatured: true,
      phetioDocumentation: "Maximum ray recursion depth before tracing stops.",
    });

    this.showGridProperty = new BooleanProperty(merged.showGrid, {
      tandem: showGridTandem,
      phetioFeatured: true,
      phetioDocumentation: "Whether the background grid is visible in the play area.",
    });

    this.snapToGridProperty = new BooleanProperty(merged.snapToGrid, {
      tandem: snapTandem,
      phetioFeatured: true,
      phetioDocumentation: "Whether components snap to the grid when dragged.",
    });

    this.gridSizeProperty = new NumberProperty(merged.gridSize, {
      tandem: gridSizeTandem,
      range: new Range(GRID_SPACING_MIN_M, GRID_SPACING_MAX_M),
      phetioFeatured: true,
      phetioDocumentation: "Grid spacing in model units (metres).",
    });

    this.observerProperty = new Property<Observer | null>(merged.observer, {
      tandem: observerTandem,
      phetioDocumentation: "Observer position and radius in observer mode; null when not used.",
      phetioValueType: NullableObserverIO,
    });

    this.opticalElementsGroup = new PhetioGroup(
      (t, state) => new OpticalElementPhetioObject(t, state),
      [ARCHETYPE_ELEMENT_STATE],
      {
        tandem: tandem.createTandem("opticalElementsGroup"),
        phetioType: PhetioGroup.PhetioGroupIO(OpticalElementPhetioObject.opticalElementInstanceIO),
        groupElementStartingIndex: 0,
      },
    );

    this.sceneChangedEmitter = new Emitter({
      tandem: tandem.createTandem("sceneChangedEmitter"),
      phetioReadOnly: true,
      phetioFeatured: true,
      phetioDocumentation: "Fires when scene elements or settings change (coarse notification for wrappers).",
    });

    Multilink.multilink(
      [
        this.modeProperty,
        this.rayDensityProperty,
        this.maxRayDepthProperty,
        this.showGridProperty,
        this.snapToGridProperty,
        this.gridSizeProperty,
        this.observerProperty,
      ],
      () => {
        this.invalidate();
        this.sceneChangedEmitter.emit();
      },
    );

    this.opticalElementsGroup.elementCreatedEmitter.addListener(() => {
      this.invalidate();
      this.sceneChangedEmitter.emit();
    });
    this.opticalElementsGroup.elementDisposedEmitter.addListener(() => {
      this.invalidate();
      this.sceneChangedEmitter.emit();
    });
  }

  private getElementsArray(): OpticalElement[] {
    return this.opticalElementsGroup.getArray().map((w) => w.opticalElement);
  }

  // ── Element Management ───────────────────────────────────────────────────

  public addElement(element: OpticalElement): void {
    this.opticalElementsGroup.createNextElement({
      ...element.serialize(),
      id: element.id,
      [LIVE_ELEMENT_STATE_KEY]: element,
    });
  }

  public removeElement(elementId: string): boolean {
    const wrapper = this.opticalElementsGroup.find((w) => w.opticalElement.id === elementId);
    if (!wrapper) {
      return false;
    }
    this.opticalElementsGroup.disposeElement(wrapper);
    return true;
  }

  public getElement(elementId: string): OpticalElement | undefined {
    return this.getElementsArray().find((e) => e.id === elementId);
  }

  public getAllElements(): ReadonlyArray<OpticalElement> {
    return this.getElementsArray();
  }

  public clearElements(): void {
    this.opticalElementsGroup.clear();
  }

  /** Clear elements and reset all instrumented scene settings to construction defaults. */
  public resetAll(): void {
    this.clearElements();
    this.modeProperty.reset();
    this.rayDensityProperty.reset();
    this.maxRayDepthProperty.reset();
    this.showGridProperty.reset();
    this.snapToGridProperty.reset();
    this.gridSizeProperty.reset();
    this.observerProperty.reset();
  }

  // ── Settings (backward-compatible helpers) ─────────────────────────────

  public getSettings(): Readonly<SceneSettings> {
    return {
      mode: this.modeProperty.value,
      rayDensity: this.rayDensityProperty.value,
      maxRayDepth: this.maxRayDepthProperty.value,
      showGrid: this.showGridProperty.value,
      snapToGrid: this.snapToGridProperty.value,
      gridSize: this.gridSizeProperty.value,
      observer: this.observerProperty.value,
    };
  }

  public updateSettings(partial: Partial<SceneSettings>): void {
    if (partial.mode !== undefined) {
      this.modeProperty.value = partial.mode;
    }
    if (partial.rayDensity !== undefined) {
      this.rayDensityProperty.value = partial.rayDensity;
    }
    if (partial.maxRayDepth !== undefined) {
      this.maxRayDepthProperty.value = partial.maxRayDepth;
    }
    if (partial.showGrid !== undefined) {
      this.showGridProperty.value = partial.showGrid;
    }
    if (partial.snapToGrid !== undefined) {
      this.snapToGridProperty.value = partial.snapToGrid;
    }
    if (partial.gridSize !== undefined) {
      this.gridSizeProperty.value = partial.gridSize;
    }
    if (partial.observer !== undefined) {
      this.observerProperty.value = partial.observer;
    }
  }

  public setMode(mode: ViewMode): void {
    this.modeProperty.value = mode;
  }

  public setRayDensity(density: number): void {
    this.rayDensityProperty.value = density;
  }

  public setObserver(position: Point, radius = 20): void {
    this.observerProperty.value = { position, radius };
    if (this.modeProperty.value !== "observer") {
      this.modeProperty.value = "observer";
    }
  }

  public clearObserver(): void {
    this.observerProperty.value = null;
    if (this.modeProperty.value === "observer") {
      this.modeProperty.value = "rays";
    }
  }

  // ── Simulation ───────────────────────────────────────────────────────────

  public invalidate(): void {
    this.dirty = true;
    this.cachedResult = null;
  }

  public simulate(): TraceResult {
    const elements = this.getElementsArray();
    const anyAcquiring = elements.some((el) => el instanceof DetectorElement && el.isAcquiring);

    if (!(anyAcquiring || this.dirty) && this.cachedResult) {
      return this.cachedResult;
    }

    for (const el of elements) {
      if (el instanceof DetectorElement) {
        el.clearHits();
      }
    }

    const config: Partial<RayTracerConfig> = {
      maxRayDepth: this.maxRayDepthProperty.value,
      rayDensity: this.rayDensityProperty.value,
      mode: this.modeProperty.value,
      observer: this.observerProperty.value ?? undefined,
      jitter: anyAcquiring,
    };

    const tracer = new RayTracer(elements, config);
    this.cachedResult = tracer.trace();
    this.dirty = false;
    return this.cachedResult;
  }

  // ── Serialization ────────────────────────────────────────────────────────

  public toJSON(): string {
    return JSON.stringify(
      {
        settings: this.getSettings(),
        elements: this.getElementsArray().map((e) => ({ ...e.serialize(), id: e.id })),
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
    const scene = new OpticsScene(Tandem.OPT_OUT, data.settings ?? {});
    for (const obj of data.elements ?? []) {
      const element = deserializeElement(obj);
      if (element !== null) {
        scene.addElement(element);
      }
    }
    return scene;
  }
}
