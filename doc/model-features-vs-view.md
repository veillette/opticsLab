# Model features vs. what the view uses

This note records **model or trace outputs that exist in code but are not surfaced** (or only partly surfaced) in the main ray-tracing screen UI (`RayTracingCommonView` / `SimScreenView`). It is a snapshot for future UI or instrumentation work—not a guarantee every item should be exposed.

---

## Scene model (`OpticsScene`)

| Feature | Role in model | View / app usage |
|--------|----------------|-------------------|
| **`history` (`CommandHistory`)** | Undo/redo stacks for add/remove element commands (`execute`, `undo`, `redo`, `canUndo`, `canRedo`). | No calls to `undo` / `redo` in `src/`. The view syncs via `opticalElementsGroup` create/dispose listeners only. **Could add** undo/redo buttons or keyboard shortcuts without new model APIs. |
| **`maxRayDepthProperty`** | Integer cap on ray recursion; passed into `RayTracer` on each `simulate()`. Instrumented for PhET-iO; included in `getSettings()` / serialization. | No slider or control in `SimScreenView`. The query parameter **`maximumLightRayDepth`** exists in `opticsLabQueryParameters.ts` but is **not** passed into `new OpticsScene(...)` in `RayTracingCommonModel`, so it does not affect startup. **Could add** a tools-panel control and wire the QP into scene construction. |
| **`sceneChangedEmitter`** | Fires when scene settings or element membership change (coarse notification). | Used in `SimScreenView` to **clear detector acquisitions** when the scene changes. Not otherwise used for first-party UI beyond that. |

Most other `OpticsScene` properties (`modeProperty`, `rayDensityProperty`, `showGridProperty`, `snapToGridProperty`, `gridSizeProperty`, `observerProperty`, `partialReflectionEnabledProperty`, `lensRimBlockingProperty`) are linked from preferences and/or the tools panel in `SimScreenView`.

---

## Trace result (`simulate()` → `TraceResult`)

`SimScreenView.updateRayPropagation()` uses **`result.segments`** for `RayPropagationView` and **`result.images`** for `ImageOverlayNode` when mode is `images` or `observer`.

| Field | Role | View usage |
|-------|------|------------|
| **`truncationError`** | Sum of brightness truncated when rays are dropped (e.g. weak Fresnel paths); see `RayTracer` and `RayInteractionResult.truncation`. | **Not read** in the view after `simulate()`. **Could surface** as a diagnostic, “lost power” indicator, or teaching note when partial reflection is on. |

---

## Optical elements (example: `DetectorElement`)

| Field | Role | View usage |
|-------|------|------------|
| **`totalHitCount`**, **`totalPower`** | Updated on every ray hit; `hits` uses reservoir sampling with a cap. | Detector UI focuses on **binned** histograms (`DetectorChartPanel`). Totals are **not shown**. **Could add** readouts for integrated intensity or hit count. |

---

## Already leveraged (brief)

- **`DetectedImage.brightness`** — Used in `ImageOverlayNode` for marker opacity.
- Observer-related segment metadata (`isObserverRay`, `observerEntryPoint`, etc.) — Part of the traced segment pipeline consumed by `RayPropagationView` in observer mode.
- **Preferences ↔ scene** — Grid, snap, partial reflection, and lens rim blocking are synced in `SimScreenView`.

---

## Related files

- Scene: `src/common/model/optics/OpticsScene.ts`, `src/common/model/optics/CommandHistory.ts`
- Trace: `src/common/model/optics/RayTracer.ts`, `src/common/model/optics/OpticsTypes.ts`
- View: `src/common/view/SimScreenView.ts`, `src/common/view/RayPropagationView.ts`, `src/common/view/ImageOverlayNode.ts`
- Detector: `src/common/model/detectors/DetectorElement.ts`, `src/common/view/detectors/DetectorChartPanel.ts`
- Model construction: `src/common/model/SimModel.ts`, `src/preferences/opticsLabQueryParameters.ts`
