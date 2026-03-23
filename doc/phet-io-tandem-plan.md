# PhET-iO / tandem instrumentation (OpticsLab)

This document records how OpticsLab is wired for [PhET-iO](https://github.com/phetsims/phet-io)-style instrumentation using **SceneryStack**’s `tandem` package, following patterns from [circuit-construction-kit-common](https://github.com/phetsims/circuit-construction-kit-common) (constructor tandem threading, featured `*Property` nodes, `PhetioGroup` for dynamic collections, read-only emitters, and `Tandem.OPT_OUT` for non-API UI).

For general architecture of the sim, see [implementation-notes.md](implementation-notes.md).

---

## SceneryStack 3.x tandem surface (audit)

The `scenerystack` npm package re-exports the full PhET tandem stack from `scenerystack/tandem`, including:

- `Tandem`, `PhetioObject`, `PhetioGroup`, `PhetioDynamicElementContainer`, `PhetioCapsule`, `PhetioAction`
- `IOType`, `ObjectLiteralIO`, `StringUnionIO`, `NullableIO`, `NumberIO`, `BooleanIO`, etc.
- `isSettingPhetioStateProperty`, `isClearingPhetioDynamicElementsProperty`, `phetioStateSetEmitter`
- `EventType`, `LinkedElementIO`, validation helpers

Use these for model and view instrumentation; full Studio/wrapper deliverables still depend on PhET-iO branding, query parameters, and metadata pipelines beyond this Vite app.

---

## Implemented instrumentation

### Screen and preferences (existing, unchanged pattern)

- [`src/main.ts`](../src/main.ts): `Tandem.ROOT` children for each screen and `opticsLabPreferences`.
- [`src/preferences/OpticsLabPreferencesModel.ts`](../src/preferences/OpticsLabPreferencesModel.ts): preference properties under a preferences tandem.

### Model: `RayTracingCommonModel` → `OpticsScene`

- [`src/common/model/SimModel.ts`](../src/common/model/SimModel.ts): passes `tandem.createTandem("scene")` into `OpticsScene`.
- [`src/common/model/optics/OpticsScene.ts`](../src/common/model/optics/OpticsScene.ts):
  - Extends `PhetioObject` with documented, featured API root.
  - **Settings** as instrumented axon properties: `modeProperty`, `rayDensityProperty`, `maxRayDepthProperty`, `showGridProperty`, `snapToGridProperty`, `gridSizeProperty`, `observerProperty` (with `StringUnionIO` / `NullableIO` value types as appropriate).
  - **`opticalElementsGroup`**: `PhetioGroup` of [`OpticalElementPhetioObject`](../src/common/model/optics/OpticalElementPhetioObject.ts), with `PhetioGroup.PhetioGroupIO` and `opticalElementInstanceIO` (`ObjectLiteralIO` supertype, `applyState`, `stateObjectToCreateElementArguments`).
  - **`sceneChangedEmitter`**: coarse notification when settings or group membership change (read-only, featured).
  - **`resetAll()`**: clears the group and resets all settings properties (used by `RayTracingCommonModel.reset()`).
  - **`getSettings()` / `updateSettings()` / setters**: remain as convenience wrappers over the properties.
  - **`fromJSON`**: builds a non-instrumented subtree with `Tandem.OPT_OUT` (file import / utilities).

### Live element reference (avoid clone on drag-and-drop)

User-driven `addElement` passes the **same** model instance as the toolbox by attaching a non-serialized key on the create-arguments object:

- [`elementSerialization.ts`](../src/common/model/optics/elementSerialization.ts): `LIVE_ELEMENT_STATE_KEY` (`__opticsLabLiveElement__`).
- `OpticalElementPhetioObject` constructor: if that key is present, use the live reference; otherwise deserialize from plain state (PhET-iO / JSON).
- `toStateObject` for the element IO type only emits `{ ...serialize(), id }`, so the live key never appears in PhET-iO state.

### Deserialization and stable ids

- [`elementSerialization.ts`](../src/common/model/optics/elementSerialization.ts): central `deserializeElement` (moved from `OpticsScene`), optional `id` in JSON restores stable element ids via [`BaseElement.reassignIdForDeserialization`](../src/common/model/optics/BaseElement.ts).
- **`Track`** type added to deserialization (was missing previously).
- Scene **`toJSON`** includes `id` per element for round-trip.

### Presets and diffraction

- [`PresetsModel`](../src/presets/PresetsModel.ts): `selectedPresetProperty` tandem + `StringUnionIO(PRESET_ID_VALUES)`; [`PresetScenes.ts`](../src/presets/PresetScenes.ts) exports `PRESET_ID_VALUES` for the IO type.
- [`PresetsScreenView`](../src/presets/PresetsScreenView.ts): `presetComboBox` tandem under the screen view when provided.
- [`DiffractionModel`](../src/diffraction/DiffractionModel.ts): comment documenting CCK-style `Tandem.OPT_OUT` for screen-specific properties when added later.

### View: `RayTracingCommonView`

- [`SimScreenView.ts`](../src/common/view/SimScreenView.ts):
  - Ray density uses **`model.scene.rayDensityProperty`** (model tandem); slider/control get view sub-tandems when the screen tandem is supplied.
  - Extended-rays checkbox syncs with **`model.scene.modeProperty`** (bidirectional with a small guard).
  - Grid visibility and grid spacing use **`model.scene.showGridProperty`** / **`gridSizeProperty`**, kept in sync with global preferences (bidirectional guards) so PhET-iO and the preferences dialog stay aligned.
  - Tool checkboxes, accordion, and density control use screen view tandems when available; internal-only pieces remain `Tandem.OPT_OUT` where appropriate (e.g. page control, measuring tape drag listener).

---

## References

- PhET Circuit Construction Kit (model patterns): [CircuitConstructionKitModel.ts](https://github.com/phetsims/circuit-construction-kit-common/blob/main/js/model/CircuitConstructionKitModel.ts), [Circuit.ts](https://github.com/phetsims/circuit-construction-kit-common/blob/main/js/model/Circuit.ts)
- PhET-iO dynamic elements: [phet-io instrumentation technical guide](https://github.com/phetsims/phet-io/blob/main/doc/phet-io-instrumentation-technical-guide.md)

---

## Possible follow-ups

- Use `isSettingPhetioStateProperty` around any new listeners that should not run side effects during PhET-iO state application (e.g. animations).
- Add migration/API baseline workflow if this sim ships a frozen PhET-iO API.
- Further replace `Tandem.OPT_OUT` on secondary tools (measuring tape, protractor) if they should appear in Studio.
