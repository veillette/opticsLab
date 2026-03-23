# Implementation notes (OpticsLab)

Notes for developers maintaining or extending the simulation. For **physics assumptions**, see [`model.md`](model.md). For **setup and scripts**, see the root [`README.md`](../README.md).

---

## Stack and runtime

- **TypeScript** (strict), **Vite** (dev/build), **SceneryStack** (`scenerystack` on npm): PhET-style **Sim** + **Screen** lifecycle, **Scenery** scene graph, **dot** math, **axon** properties where used.
- **Biome** replaces ESLint/Prettier for lint and format.
- **ES modules** everywhere: source imports use **`.js` extensions** in TypeScript paths (Node/Vite ESM resolution).

---

## Application bootstrap (load order matters)

1. **`index.html`** loads `src/main.ts` as a module.
2. **`init.ts`** is pulled in early via the SceneryStack pattern: it configures locale, splash, color profiles, and internal sim name **before** most of the app runs.
3. **`brand.js`** must load before other app code (see comment in `main.ts`).
4. **`main.ts`** calls `onReadyToLaunch`, builds **Screen** instances, **`Sim`**, then **`sim.start()`**.

Changing locale list or color profiles: edit **`src/init.ts`**. Screen list and carousel composition: **`src/main.ts`** (`standardComponents` vs `diffractionComponents`).

---

## Screen / model / view shape

Most screens follow:

```text
Screen<Model, View>( modelFactory, viewFactory, options )
```

- **Intro / Lab / Presets** use screen-specific **Model** + **View** classes (e.g. `LabScreen` → `LabModel`, `LabScreenView`) but share the same **ray-tracing stack** under `src/common/` where applicable.
- **Diffraction** is a separate screen with a reduced **carousel** set (see `main.ts`).
- Shared options include **`OpticsLabPreferencesModel`**, **`createKeyboardHelpNode`**, and **`carouselComponents`**.

The common ray-tracing UI lives in **`RayTracingCommonView`** (`SimScreenView.ts`) and **`RayTracingCommonModel`** / **`OpticsScene`**: one **`OpticsScene`** owns all **`OpticalElement`** instances and runs **`RayTracer`** when the scene is dirty.

---

## Model layer (`src/common/model`)

### `OpticalElement` contract (`optics/OpticsTypes.ts`)

Every element implements:

- **`emitRays(rayDensity, mode)`** — sources produce **`SimulationRay`**[]; others return `[]`.
- **`checkRayIntersection(ray)`** — nearest hit along the ray, or `null`.
- **`onRayIncident(ray, intersection)`** — returns absorption, single **`outgoingRay`**, and/or **`newRays`** (e.g. beam splitter, Fresnel split).
- **`serialize()`** / **`dispose()`** — persistence and listener cleanup.

**Categories** (`ElementCategory`) drive UI grouping; they are not used for ray sorting (the tracer scans all elements).

### `OpticsScene` (`optics/OpticsScene.ts`)

- Holds **`elements[]`** and **`SceneSettings`** (mode, ray density, max depth, grid, observer, etc.).
- **`invalidate()`** marks the cached trace stale; **`simulate()`** clears detector state, builds **`RayTracer`**, runs **`trace()`**, caches **`TraceResult`**.
- The view typically calls **`invalidate()`** on model changes and **`simulate()`** each frame (see **`SimScreenView`**).

### `RayTracer` (`optics/RayTracer.ts`)

- Breadth-first style queue over **`SimulationRay`** + depth; respects **`maxRayDepth`** and **minimum brightness** cutoffs.
- **`ViewMode`** (`rays` | `extended` | `images` | `observer`) adds extra segments (extensions, image helpers, observer cone) on top of the core hit logic.

### Geometry and physics helpers (`optics/Geometry.ts`, `optics/OpticsConstants.ts`)

Shared math: intersections, Snell/Fresnel helpers, arc sampling, etc. **Glass-specific** Snell + Fresnel + Cauchy index live in **`glass/BaseGlass.ts`**.

### Serialization

- **`OpticsScene.toJSON()` / `fromJSON()`** — round-trip scene + settings; **`deserializeElement`** in `OpticsScene.ts` must know every **`type`** string from **`serialize()`**.
- Adding a new element type **requires** a **`deserializeElement` branch** or the type will not load from saved JSON.

---

## View layer (`src/common/view`)

### Coordinates

- **Model space**: metres, **y up** (standard optics sketch convention).
- **View space**: Scenery pixels, **y down**; use **`ModelViewTransform2`** (inverted Y) from the screen view. Comments in **`SimScreenView`** document scale (e.g. pixels per metre).

### Single registry for views + edit panels

**`ElementRegistry.ts`** is the **only** place that should map a model type to:

1. **`guard`** — `instanceof` (or compound) check.
2. **`createView`** — Scenery node constructor.
3. **`buildEditControls`** (optional) — sliders/controls for the edit panel.

**`OpticalElementViewFactory.ts`** and **`EditControlFactory.ts`** are thin wrappers that call into the registry—do not duplicate dispatch tables.

**Ordering matters**: more specific classes (e.g. a named prism type) must appear **before** generic bases (e.g. **`Glass`**) so the first matching guard wins.

### Carousel

**`ComponentCarousel.ts`** + **`ComponentKey`** map toolbar buttons to **element constructors** and icons. A new draggable type needs a **key**, **descriptor**, and usually a matching **registry** + **model** class.

### Element views and `BaseOpticalElementView`

Many views extend **`BaseOpticalElementView`**: handles **`modelViewTransform`**, **`rebuildEmitter`** (notify edit panel after drags), and **`bodyDragListener`** for picking/moving the whole element. **`SimScreenView._setupView`** reparents nodes during drag and returns dropped tools to the carousel.

### Rays on canvas

**`RayPropagationView`** is a **CanvasNode**: receives **`TracedSegment[]`** from the model trace; draws in view space. High ray counts use batched alpha drawing.

---

## Internationalization

- Copy lives in **`src/i18n/strings_en.json`** and **`strings_fr.json`**; keys must stay **in parity** (TypeScript enforces via `StringManager`).
- **`StringManager.getNestedStringProperties`** exposes **`ReadOnlyProperty<string>`** trees for UI.
- Add strings in JSON first, then wire through **`StringManager`** methods if you need typed accessors.

---

## Constants

- **`OpticsLabConstants.ts`**: UI layout, slider ranges, default physics numbers, ray-render tuning, grating defaults, etc.
- **`optics/OpticsConstants.ts`**: small shared physics thresholds (e.g. Fresnel spawn threshold, polarization split).

Prefer **named constants** over magic numbers in new code.

---

## Debugging / introspection

**`OpticsLabNamespace`** (`OpticsLabNamespace.ts`): important classes and factories are **`opticsLab.register(...)`** so they can be reached from the browser console during development.

---

## Tooling expectations

- **`npm run lint`** — `biome check .` (format + lint + assist).
- **`npm run check`** — `tsc --noEmit` (currently **`src/`** only per `tsconfig.json`; **`scripts/`** uses **tsx** without project check).
- **`npm run build`** — `tsc && vite build` (PWA plugin in **`vite.config.js`**).
- **Git hooks** (`.githooks/pre-commit`): **`biome check --write`** on staged TS/JS/JSON/HTML.

---

## Adding a new optical element (checklist)

1. **Model**: class implementing **`OpticalElement`**; **`serialize()`** `type` string stable and unique.
2. **`OpticsScene.deserializeElement`**: parse JSON → instance.
3. **View**: Scenery node (often **`BaseOpticalElementView`** subclass).
4. **`ElementRegistry`**: `guard`, `createView`, optional `buildEditControls` (correct order vs subclasses).
5. **Carousel**: **`ComponentKey`** + **`ComponentCarousel`** descriptor + icon if it should appear in the toolbox.
6. **Strings**: labels for component name and any new controls.
7. **Manual test**: drag, delete, reset, save/load JSON if the scene is persisted on that screen.

---

## Related paths (quick map)

| Area | Path |
|------|------|
| Ray trace core | `src/common/model/optics/RayTracer.ts` |
| Scene + cache + JSON | `src/common/model/optics/OpticsScene.ts` |
| Types + ray/result shapes | `src/common/model/optics/OpticsTypes.ts` |
| Registry | `src/common/view/ElementRegistry.ts` |
| Shared screen UI | `src/common/view/SimScreenView.ts` |
| Preferences | `src/preferences/` |
| Screen entry | `src/main.ts` |
