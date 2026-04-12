/**
 * OpticsScene.ts
 *
 * The top-level scene model for the optics simulation. Manages all optical
 * elements (light sources, mirrors, glass, blockers), simulation settings,
 * and runs the ray tracer on demand. Instrumented with PhET-iO tandems.
 */

import { BooleanProperty, Emitter, Multilink, NumberProperty, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { BatchPropertyCommand, CommandHistory, EditPropertyCommand, type SceneCommand } from "./CommandHistory.js";

export type { SceneCommand } from "./CommandHistory.js";
export { BatchPropertyCommand, EditPropertyCommand } from "./CommandHistory.js";

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
  DEFAULT_MAX_RAY_DEPTH,
  DEFAULT_RAY_DENSITY,
  GRID_SPACING_M,
  GRID_SPACING_MAX_M,
  GRID_SPACING_MIN_M,
  MAX_RAY_DEPTH_PROPERTY_MAX,
  MAX_RAY_DEPTH_PROPERTY_MIN,
  RAY_DENSITY_MAX,
  RAY_DENSITY_MIN,
} from "../../../OpticsLabConstants.js";
import { VIEW_MODE_OBSERVER, VIEW_MODE_RAYS } from "../../../OpticsLabStrings.js";
import { DetectorElement } from "../detectors/DetectorElement.js";
import { FiberOpticElement } from "../fiber/FiberOpticElement.js";
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
  mode: VIEW_MODE_RAYS,
  rayDensity: DEFAULT_RAY_DENSITY,
  maxRayDepth: DEFAULT_MAX_RAY_DEPTH,
  showGrid: false,
  snapToGrid: false,
  gridSize: GRID_SPACING_M,
  observer: null,
};

const ViewModeIO = StringUnionIO(VIEW_MODE_VALUES);

const ObserverCoreIO = new IOType<Observer, { x: number; y: number; radius: number }>("ObserverIO", {
  supertype: ObjectLiteralIO,
  documentation: "Observer position (model metres, y up) and collection radius.",
  // isValidValue is required so that VALIDATOR_KEYS is satisfied and NullableIO can validate non-null values.
  isValidValue: (v: unknown): boolean =>
    typeof v === "object" &&
    v !== null &&
    Object.getPrototypeOf(v) === Object.prototype &&
    typeof (v as Record<string, unknown>)["radius"] === "number" &&
    typeof (v as Record<string, unknown>)["position"] === "object",
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
  /** Whether Fresnel partial reflection is computed for glass surfaces. Driven by user preferences. */
  public readonly partialReflectionEnabledProperty: BooleanProperty;
  /** Whether flat aperture-rim edges of SphericalLens elements absorb rays. Driven by user preferences. */
  public readonly lensRimBlockingProperty: BooleanProperty;

  public readonly opticalElementsGroup: PhetioGroup<OpticalElementPhetioObject, [Record<string, unknown>]>;

  public readonly sceneChangedEmitter: Emitter;

  /** Undo/redo history for add/remove element commands. */
  public readonly history: CommandHistory = new CommandHistory();

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
    const partialReflectionTandem = tandem.createTandem("partialReflectionEnabledProperty");
    const lensRimBlockingTandem = tandem.createTandem("lensRimBlockingProperty");

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

    this.partialReflectionEnabledProperty = new BooleanProperty(true, {
      tandem: partialReflectionTandem,
      phetioFeatured: true,
      phetioDocumentation: "Whether Fresnel partial reflection is computed for glass surfaces.",
    });

    this.lensRimBlockingProperty = new BooleanProperty(false, {
      tandem: lensRimBlockingTandem,
      phetioFeatured: true,
      phetioDocumentation:
        "Whether flat aperture-rim edges of SphericalLens elements absorb rays instead of refracting them.",
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
        this.partialReflectionEnabledProperty,
        this.lensRimBlockingProperty,
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

  /**
   * Add an element to the scene and record an undoable command.
   * Pass `recordHistory: false` for programmatic loads (e.g. deserializing a
   * preset) that should not pollute the undo stack.
   */
  public addElement(element: OpticalElement, recordHistory = true): void {
    const doAdd = (): void => {
      this.opticalElementsGroup.createNextElement({
        ...element.serialize(),
        id: element.id,
        [LIVE_ELEMENT_STATE_KEY]: element,
      });
    };

    if (recordHistory) {
      const command: SceneCommand = {
        description: `Add ${element.type}`,
        execute: doAdd,
        undo: () => this.removeElement(element.id, false),
      };
      this.history.execute(command);
    } else {
      doAdd();
    }
  }

  /**
   * Remove an element from the scene and record an undoable command.
   * Pass `recordHistory: false` for undo/redo infrastructure calls.
   */
  public removeElement(elementId: string, recordHistory = true): boolean {
    const element = this.getElement(elementId);
    if (!element) {
      return false;
    }

    const doRemove = (): boolean => {
      const wrapper = this.opticalElementsGroup.find((w) => w.opticalElement.id === elementId);
      if (!wrapper) {
        return false;
      }
      this.opticalElementsGroup.disposeElement(wrapper);
      return true;
    };

    if (recordHistory) {
      const command: SceneCommand = {
        description: `Remove ${element.type}`,
        execute: () => {
          doRemove();
        },
        undo: () => this.addElement(element, false),
      };
      this.history.execute(command);
      return true;
    }

    return doRemove();
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

  /**
   * Deep-clone an existing element via a serialize/deserialize round-trip,
   * apply an optional position offset, add the clone to the scene (with
   * undo history), and return it.
   *
   * @param id     ID of the element to duplicate.
   * @param offset Translation applied to every position field of the clone.
   *               Defaults to (0, 0) — an exact positional copy.
   * @returns The new element, or `null` when no element with that ID exists.
   */
  public duplicateElement(id: string, offset: Point = point(0, 0)): OpticalElement | null {
    const source = this.getElement(id);
    if (!source) {
      return null;
    }

    const state = source.serialize() as Record<string, unknown>;
    // Strip the original ID so deserializeElement assigns a fresh one via the
    // auto-increment counter in BaseElement.
    state["id"] = undefined;
    OpticsScene.applyOffsetToState(state, offset.x, offset.y);

    const clone = deserializeElement(state);
    if (!clone) {
      return null;
    }

    this.addElement(clone, true);
    return clone;
  }

  /**
   * Translate all position fields in a serialized element state by (dx, dy).
   * Handles every coordinate shape used across the element library:
   *   - scalar `x`/`y`   (PointSource, ArcLightSource)
   *   - scalar `cx`/`cy` (prisms, dimensional glass)
   *   - Point objects `p1`…`p4`, `cp1`…`cp3` (most two-endpoint elements)
   *   - `path` array of `{x, y, …}` (Glass and its subclasses)
   */
  private static applyOffsetToState(state: Record<string, unknown>, dx: number, dy: number): void {
    if (dx === 0 && dy === 0) {
      return;
    }

    if (typeof state["x"] === "number") {
      state["x"] += dx;
    }
    if (typeof state["y"] === "number") {
      state["y"] += dy;
    }

    if (typeof state["cx"] === "number") {
      state["cx"] += dx;
    }
    if (typeof state["cy"] === "number") {
      state["cy"] += dy;
    }

    for (const key of ["p1", "p2", "p3", "p4", "cp1", "cp2", "cp3"] as const) {
      const v = state[key];
      if (typeof v === "object" && v !== null) {
        const pt = v as Record<string, unknown>;
        if (typeof pt["x"] === "number" && typeof pt["y"] === "number") {
          state[key] = { ...pt, x: pt["x"] + dx, y: pt["y"] + dy };
        }
      }
    }

    if (Array.isArray(state["path"])) {
      state["path"] = (state["path"] as Array<Record<string, unknown>>).map((pt) => ({
        ...pt,
        ...(typeof pt["x"] === "number" ? { x: pt["x"] + dx } : {}),
        ...(typeof pt["y"] === "number" ? { y: pt["y"] + dy } : {}),
      }));
    }
  }

  /** Clear elements, reset all instrumented scene settings to construction defaults, and clear undo history. */
  public resetAll(): void {
    this.clearElements();
    this.history.clear();
    this.modeProperty.reset();
    this.rayDensityProperty.reset();
    this.maxRayDepthProperty.reset();
    this.showGridProperty.reset();
    this.snapToGridProperty.reset();
    this.gridSizeProperty.reset();
    this.observerProperty.reset();
  }

  // ── Property Edit History ────────────────────────────────────────────────

  /**
   * Record a single property change on an element as an undoable command.
   * Call this from view-layer drag/edit handlers:
   *
   *   scene.recordPropertyEdit(mirror, 'p1', oldP1, newP1);
   */
  public recordPropertyEdit<T extends Record<string, unknown>, K extends keyof T & string>(
    target: T,
    property: K,
    oldValue: T[K],
    newValue: T[K],
  ): void {
    const command = new EditPropertyCommand(target, property, oldValue, newValue, () => {
      this.invalidate();
      this.sceneChangedEmitter.emit();
    });
    // The property is already set to newValue by the caller (drag handler),
    // so we push directly without re-executing.
    this.history.push(command);
  }

  /**
   * Record a batch of property changes as a single undoable command.
   * Useful for drag operations that change multiple properties at once.
   *
   *   scene.recordBatchEdit([
   *     { target: mirror, property: 'p1', oldValue: oldP1, newValue: newP1 },
   *     { target: mirror, property: 'p2', oldValue: oldP2, newValue: newP2 },
   *   ], 'Move mirror');
   */
  public recordBatchEdit(
    entries: Array<{ target: Record<string, unknown>; property: string; oldValue: unknown; newValue: unknown }>,
    description: string,
  ): void {
    const command = new BatchPropertyCommand(entries, description, () => {
      this.invalidate();
      this.sceneChangedEmitter.emit();
    });
    this.history.push(command);
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
    if (this.modeProperty.value !== VIEW_MODE_OBSERVER) {
      this.modeProperty.value = VIEW_MODE_OBSERVER;
    }
  }

  public clearObserver(): void {
    this.observerProperty.value = null;
    if (this.modeProperty.value === VIEW_MODE_OBSERVER) {
      this.modeProperty.value = VIEW_MODE_RAYS;
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
      partialReflectionEnabled: this.partialReflectionEnabledProperty.value,
      lensRimBlockingEnabled: this.lensRimBlockingProperty.value,
    };

    // Expand elements that expose multiple physics objects (e.g. fiber optic core + cladding).
    const physicsElements = elements.flatMap((el) =>
      el instanceof FiberOpticElement ? el.getPhysicsElements() : [el],
    );
    const tracer = new RayTracer(physicsElements, config);
    this.cachedResult = tracer.trace();
    this.dirty = false;

    // truncationError is non-zero when the segment cap fired and rays were
    // silently dropped.  Views and tests should read this field from the
    // returned TraceResult to surface the condition to the user (e.g. a
    // warning banner or a reduced-opacity indicator).
    return this.cachedResult;
  }

  // ── Serialization ────────────────────────────────────────────────────────

  /**
   * Clamp all numeric settings to their valid Property ranges so that a
   * malformed JSON file cannot cause a PhET-iO Range assertion failure.
   */
  private static sanitizeSettings(raw: unknown): Partial<SceneSettings> {
    if (typeof raw !== "object" || raw === null) {
      return {};
    }
    const s = raw as Record<string, unknown>;
    const out: Partial<SceneSettings> = {};

    if (typeof s["rayDensity"] === "number" && Number.isFinite(s["rayDensity"])) {
      out.rayDensity = Math.max(RAY_DENSITY_MIN, Math.min(RAY_DENSITY_MAX, s["rayDensity"]));
    }
    if (typeof s["maxRayDepth"] === "number" && Number.isFinite(s["maxRayDepth"])) {
      out.maxRayDepth = Math.max(
        MAX_RAY_DEPTH_PROPERTY_MIN,
        Math.min(MAX_RAY_DEPTH_PROPERTY_MAX, Math.round(s["maxRayDepth"])),
      );
    }
    if (typeof s["gridSize"] === "number" && Number.isFinite(s["gridSize"])) {
      out.gridSize = Math.max(GRID_SPACING_MIN_M, Math.min(GRID_SPACING_MAX_M, s["gridSize"]));
    }
    if (typeof s["showGrid"] === "boolean") {
      out.showGrid = s["showGrid"];
    }
    if (typeof s["snapToGrid"] === "boolean") {
      out.snapToGrid = s["snapToGrid"];
    }
    if (VIEW_MODE_VALUES.includes(s["mode"] as (typeof VIEW_MODE_VALUES)[number])) {
      out.mode = s["mode"] as ViewMode;
    }
    return out;
  }

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

  public static fromJSON(json: string): OpticsScene | null {
    try {
      const data = JSON.parse(json) as {
        settings?: Partial<SceneSettings>;
        elements?: unknown[];
      };
      const scene = new OpticsScene(Tandem.OPT_OUT, OpticsScene.sanitizeSettings(data.settings));
      const elements = Array.isArray(data.elements) ? data.elements : [];
      for (const obj of elements) {
        if (typeof obj !== "object" || obj === null) {
          continue;
        }
        try {
          const element = deserializeElement(obj as Record<string, unknown>);
          if (element !== null) {
            scene.addElement(element, false);
          }
        } catch {
          // Invalid element — skip and continue loading remaining elements.
        }
      }
      return scene;
    } catch {
      return null;
    }
  }
}
