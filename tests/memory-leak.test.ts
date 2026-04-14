/**
 * memory-leak.test.ts
 *
 * Creates optical elements + views, disposes them, forces garbage collection,
 * then asserts via WeakRef that the disposed objects were actually collected.
 *
 * Requires --expose-gc (configured in vitest.config.ts execArgv).
 *
 * V8 requires a *function* boundary (not merely a block scope) to release
 * local variables for garbage collection.  Every allocation is therefore
 * wrapped in a helper function so the strong references die when it returns.
 *
 * ## Test structure
 *
 * Suites 1–7 are the original regression suite (one test per element type).
 * Suites 8–11 add more realistic and subtle scenarios:
 *
 *   8.  External listeners on view.rebuildEmitter — the EditContainerNode /
 *       SimScreenView pattern of subscribing to geometry-change notifications.
 *       rebuildEmitter.dispose() must remove these so the view is collectible.
 *
 *   9.  Reversed disposal order — element disposed before its view.  Verifies
 *       that views neither crash nor retain elements when the element is gone.
 *
 *  10.  Scene lifecycle with the default recordHistory=true — the production
 *       call path that pushes undo/redo commands whose closures capture the
 *       element.  Once the scene is released the full closure chain must be
 *       collectible.
 *
 *  11.  View with selection state active — setSelected(true) populates an
 *       internal selection-frame rectangle; its bounds bookkeeping must not
 *       prevent the view from being collected after dispose().
 *
 * Standalone tests at the end cover:
 *   – scene.simulate() cache release after element removal
 *   – scene.resetAll() clearing both elements and undo-history closures
 *   – TrackView cleaning up from the global trackRegistry singleton
 *   – multiple sequential scenes not cross-retaining each other's elements
 */

import { Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Tandem } from "scenerystack/tandem";
import { describe, expect, it } from "vitest";
import { type ComponentKey, createDefaultElement } from "../src/common/model/ComponentFactory.js";
import { OpticsScene } from "../src/common/model/optics/OpticsScene.js";
import { createOpticalElementView } from "../src/common/view/OpticalElementViewFactory.js";
import { trackRegistry } from "../src/common/view/TrackRegistry.js";
import { ViewOptionsModel } from "../src/common/view/ViewOptionsModel.js";

// Shared default ViewOptionsModel used across all tests that construct views.
// Not disposed between tests — it acts as a long-lived sentinel with default values.
const viewOptions: ViewOptionsModel = new ViewOptionsModel();

// All component keys available in the factory — every element type must be covered.
const ALL_KEYS: ComponentKey[] = [
  // light sources
  "pointSource",
  "beam",
  "divergentBeam",
  "singleRay",
  "continuousSpectrum",
  "arcSource",
  // mirrors
  "flatMirror",
  "arcMirror",
  "parabolicMirror",
  "aperturedMirror",
  "idealMirror",
  "beamSplitter",
  // glass
  "idealLens",
  "circleGlass",
  "biconvexLens",
  "biconcaveLens",
  "planoConvexLens",
  "planoConcaveLens",
  "sphericalLens",
  "prism",
  "equilateralPrism",
  "rightAnglePrism",
  "porroPrism",
  "slabGlass",
  "parallelogramPrism",
  "dovePrism",
  "halfPlaneGlass",
  // blockers
  "lineBlocker",
  "aperture",
  // detectors / guides / fiber
  "detector",
  "track",
  "fiberOptic",
  // gratings
  "transmissionGrating",
  "reflectionGrating",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Force garbage collection with multiple passes.  When `earlyExitRef` is
 * supplied the loop bails as soon as the object is confirmed collected,
 * reducing test time in the common (no-leak) case while still applying
 * sufficient pressure when the object lingers.
 *
 * ## WeakRef liveness hazard
 *
 * Per the ECMAScript WeakRef specification, calling `deref()` and getting a
 * live value pins the referent alive for the rest of the **current macrotask**.
 * If the deref() check and the next `global.gc()` call are in the same
 * macrotask, GC can never collect the object — an infinite liveness cycle.
 *
 * Fix: after a non-undefined deref() result, yield to a new macrotask via
 * `setTimeout(0)` before the next gc() call.  The liveness guarantee from the
 * previous macrotask has then expired and gc() is free to collect the object.
 */
async function forceGC(earlyExitRef?: WeakRef<object>): Promise<void> {
  for (let i = 0; i < 15; i++) {
    global.gc?.();
    // Yield to a new macrotask so the GC has processed any pending finalization.
    await new Promise<void>((r) => setTimeout(r, 50));
    if (earlyExitRef !== undefined && earlyExitRef.deref() === undefined) {
      return; // Object collected — skip remaining passes.
    }
    if (earlyExitRef !== undefined) {
      // The deref() above returned a live value, pinning the referent for the
      // rest of this macrotask.  Yield to a fresh macrotask so that liveness
      // guarantee expires *before* the next gc() call at the top of the loop.
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }
}

/** Create a model element in a function scope, dispose it, return WeakRef. */
function createModelOnly(key: ComponentKey): WeakRef<object> {
  const el = createDefaultElement(key, 0, 0);
  const ref = new WeakRef<object>(el);
  el.dispose();
  return ref;
}

/** Create element + view, dispose both in normal order, return WeakRefs. */
function createWithView(
  key: ComponentKey,
  mvt: ModelViewTransform2,
): { elementRef: WeakRef<object>; viewRef: WeakRef<object> | null } {
  const el = createDefaultElement(key, 0, 0);
  const view = createOpticalElementView(el, mvt, Tandem.OPT_OUT, viewOptions);
  const elementRef = new WeakRef<object>(el);
  const viewRef = view ? new WeakRef<object>(view) : null;
  view?.dispose();
  el.dispose();
  return { elementRef, viewRef };
}

/**
 * Create element + view, add an external listener to view.rebuildEmitter
 * (the EditContainerNode / SimScreenView pattern), then dispose in normal
 * order.  rebuildEmitter.dispose() must remove the listener so neither the
 * view nor the emitter is held alive by the external observer.
 */
function createWithViewAndExternalListener(
  key: ComponentKey,
  mvt: ModelViewTransform2,
): { elementRef: WeakRef<object>; viewRef: WeakRef<object> | null } {
  const el = createDefaultElement(key, 0, 0);
  const view = createOpticalElementView(el, mvt, Tandem.OPT_OUT, viewOptions);
  const elementRef = new WeakRef<object>(el);
  const viewRef = view ? new WeakRef<object>(view) : null;

  // Simulate an external UI component (e.g. EditContainerNode) subscribing
  // to geometry-change notifications.  rebuildEmitter.dispose() must remove
  // this listener so it does not prevent the view from being collected.
  view?.rebuildEmitter.addListener(() => {
    /* no-op: simulates EditContainerNode syncing edit controls */
  });
  // Trigger the emitter once so the listener is exercised before disposal.
  view?.rebuild();

  // Normal disposal: rebuildEmitter.dispose() removes the external listener.
  view?.dispose();
  el.dispose();
  return { elementRef, viewRef };
}

/**
 * Create element + view, then dispose the *element first* (reversed order).
 * Views must neither crash during their own subsequent disposal nor retain
 * a reference that keeps the already-disposed element alive.
 */
function createWithViewReversedDisposal(
  key: ComponentKey,
  mvt: ModelViewTransform2,
): { elementRef: WeakRef<object>; viewRef: WeakRef<object> | null } {
  const el = createDefaultElement(key, 0, 0);
  const view = createOpticalElementView(el, mvt, Tandem.OPT_OUT, viewOptions);
  const elementRef = new WeakRef<object>(el);
  const viewRef = view ? new WeakRef<object>(view) : null;
  // Reversed order: element disposed before its view.
  el.dispose();
  view?.dispose();
  return { elementRef, viewRef };
}

/**
 * Create element + view, activate the selection highlight (exercises the
 * _selectionFrame bounds computation and setSelected bookkeeping), then
 * dispose in normal order.
 */
function createWithViewSelected(
  key: ComponentKey,
  mvt: ModelViewTransform2,
): { elementRef: WeakRef<object>; viewRef: WeakRef<object> | null } {
  const el = createDefaultElement(key, 0, 0);
  const view = createOpticalElementView(el, mvt, Tandem.OPT_OUT, viewOptions);
  const elementRef = new WeakRef<object>(el);
  const viewRef = view ? new WeakRef<object>(view) : null;
  // Rebuild first so the selection frame has real child bounds to measure.
  view?.rebuild();
  // Exercise select → deselect → select to stress bookkeeping state changes.
  view?.setSelected(true);
  view?.setSelected(false);
  view?.setSelected(true);
  view?.dispose();
  el.dispose();
  return { elementRef, viewRef };
}

/**
 * Create a scene, add an element to it, remove the element, dispose the scene.
 * Uses explicit recordHistory=false to avoid history-closure interactions
 * (those are tested separately in suite 10).
 */
function createSceneWithElement(key: ComponentKey): { sceneRef: WeakRef<object>; elementRef: WeakRef<object> } {
  const scene = new OpticsScene(Tandem.OPT_OUT);
  const el = createDefaultElement(key, 0, 0);
  scene.addElement(el, false);
  scene.removeElement(el.id, false);
  const elementRef = new WeakRef<object>(el);
  scene.dispose();
  el.dispose();
  const sceneRef = new WeakRef<object>(scene);
  return { sceneRef, elementRef };
}

/**
 * Realistic version of createSceneWithElement using the *default*
 * recordHistory=true call path (what production code does).
 *
 * Both addElement and removeElement push SceneCommand objects whose closures
 * capture the element reference.  The undo/redo stacks (owned by the scene's
 * CommandHistory) must not prevent collection once the scene is released.
 */
function createSceneDefaultHistory(key: ComponentKey): { sceneRef: WeakRef<object>; elementRef: WeakRef<object> } {
  const scene = new OpticsScene(Tandem.OPT_OUT);
  const el = createDefaultElement(key, 0, 0);
  // Default recordHistory=true: both calls push commands that close over `el`.
  scene.addElement(el); // → history.undoStack gains an add-command
  scene.removeElement(el.id); // → history.undoStack gains a remove-command
  // `el` is now referenced only by undo closures inside scene.history.
  // Releasing both `scene` and `el` must allow the entire chain to be GC'd.
  const elementRef = new WeakRef<object>(el);
  const sceneRef = new WeakRef<object>(scene);
  scene.dispose();
  return { sceneRef, elementRef };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Memory leak regression", () => {
  const mvt = ModelViewTransform2.createSinglePointScaleInvertedYMapping(Vector2.ZERO, new Vector2(500, 400), 100);

  it("global.gc is available (--expose-gc)", () => {
    expect(global.gc).toBeDefined();
  });

  it("sanity: plain object is collected", async () => {
    const ref = (() => {
      const obj = { hello: "world" };
      return new WeakRef(obj);
    })();
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  // ── 1. Model-only (no view created) ──────────────────────────────────────
  describe("model-only (no view)", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: model element is collected after dispose`, async () => {
        const ref = createModelOnly(key);
        await forceGC(ref);
        expect(ref.deref()).toBeUndefined();
      });
    }
  });

  // ── 2. View is collected after dispose ───────────────────────────────────
  describe("view disposal", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: view is collected after dispose`, async () => {
        const { viewRef } = createWithView(key, mvt);
        if (viewRef) {
          await forceGC(viewRef);
          expect(viewRef.deref()).toBeUndefined();
        }
      });
    }
  });

  // ── 3. Element + view together ───────────────────────────────────────────
  describe("element + view combined", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: both collected after disposal`, async () => {
        const { elementRef, viewRef } = createWithView(key, mvt);
        await forceGC(elementRef);

        const elementLeaked = elementRef.deref() !== undefined;
        const viewLeaked = viewRef?.deref() !== undefined;

        if (elementLeaked || viewLeaked) {
          const parts: string[] = [];
          if (elementLeaked) {
            parts.push("element");
          }
          if (viewLeaked) {
            parts.push("view");
          }
          expect.fail(`${key}: ${parts.join(" + ")} not collected`);
        }
      });
    }
  });

  // ── 4. Scene lifecycle: element added then removed before scene disposal ──
  describe("scene lifecycle", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: element collected after scene add/remove + dispose`, async () => {
        const { sceneRef, elementRef } = createSceneWithElement(key);
        await forceGC(elementRef);

        const sceneLeaked = sceneRef.deref() !== undefined;
        const elementLeaked = elementRef.deref() !== undefined;

        if (sceneLeaked || elementLeaked) {
          const parts: string[] = [];
          if (sceneLeaked) {
            parts.push("scene");
          }
          if (elementLeaked) {
            parts.push("element");
          }
          expect.fail(`${key}: ${parts.join(" + ")} not collected after scene lifecycle`);
        }
      });
    }
  });

  // ── 5. Double-dispose safety ──────────────────────────────────────────────
  describe("double-dispose safety (no crash)", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: second dispose() does not throw`, () => {
        const el = createDefaultElement(key, 0, 0);
        el.dispose();
        expect(() => el.dispose()).not.toThrow();
      });
    }
  });

  // ── 6. Model-only repeated allocation ────────────────────────────────────
  describe("model-only repeated allocation", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: 10 successive create/dispose cycles leave no survivors`, async () => {
        const refs: WeakRef<object>[] = [];
        for (let i = 0; i < 10; i++) {
          refs.push(createModelOnly(key));
        }
        await forceGC();
        const survivors = refs.filter((r) => r.deref() !== undefined).length;
        expect(survivors).toBe(0);
      });
    }
  });

  // ── 7. emitRays / serialize do not retain the element ────────────────────
  describe("operations before dispose do not cause retention", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: element collected after emitRays + serialize + dispose`, async () => {
        const ref = (() => {
          const el = createDefaultElement(key, 0, 0);
          // Exercise the element's main compute paths before disposal.
          try {
            el.emitRays(10, "rays");
          } catch {
            // Some element types are not light sources; ignore.
          }
          el.serialize();
          const weakRef = new WeakRef<object>(el);
          el.dispose();
          return weakRef;
        })();
        await forceGC(ref);
        expect(ref.deref()).toBeUndefined();
      });
    }
  });

  // ── 8. View rebuildEmitter with external listener ─────────────────────────
  //
  // EditContainerNode and SimScreenView add listeners to view.rebuildEmitter
  // to sync UI state after geometry changes.  BaseOpticalElementView.dispose()
  // calls rebuildEmitter.dispose(), which must remove all listeners so neither
  // the emitter's internal array nor any listener closure retains the view.
  describe("view rebuildEmitter with external listener", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: view collected after external rebuildEmitter listener + dispose`, async () => {
        const { viewRef } = createWithViewAndExternalListener(key, mvt);
        if (viewRef) {
          await forceGC(viewRef);
          expect(viewRef.deref()).toBeUndefined();
        }
      });
    }
  });

  // ── 9. Reversed disposal order (element disposed before view) ─────────────
  //
  // Production code disposes view before element, but the order can be
  // inverted in edge cases (e.g. scene.clearElements() disposing the model
  // wrapper while the view cleanup is still queued).  Views must not crash
  // and must still be collected after their model element is already gone.
  describe("reversed disposal order (element before view)", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: both collected when element disposed before view`, async () => {
        const { elementRef, viewRef } = createWithViewReversedDisposal(key, mvt);
        await forceGC(elementRef);
        expect(elementRef.deref()).toBeUndefined();
        if (viewRef) {
          expect(viewRef.deref()).toBeUndefined();
        }
      });
    }
  });

  // ── 10. Scene lifecycle with default recordHistory=true ───────────────────
  //
  // The production call sites use addElement(el) / removeElement(id) without
  // explicit false, so undo commands are pushed whose closures capture `el`.
  // Once the scene is released, the entire scene → history → command → element
  // chain must be collectible.  This tests the real user-facing code path.
  describe("scene lifecycle – default recordHistory (undo history closures)", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: element + scene collected when undo history retains closure`, async () => {
        const { sceneRef, elementRef } = createSceneDefaultHistory(key);
        await forceGC(sceneRef);

        const sceneLeaked = sceneRef.deref() !== undefined;
        const elementLeaked = elementRef.deref() !== undefined;

        if (sceneLeaked || elementLeaked) {
          const parts: string[] = [];
          if (sceneLeaked) {
            parts.push("scene");
          }
          if (elementLeaked) {
            parts.push("element (in undo closure)");
          }
          expect.fail(`${key}: ${parts.join(" + ")} not collected`);
        }
      });
    }
  });

  // ── 11. View selection state before dispose ───────────────────────────────
  //
  // setSelected(true) computes bounding boxes across child nodes and positions
  // a _selectionFrame Rectangle.  The set of excluded decoration nodes
  // (_decorationNodes) and the frame rectangle must not extend the view's
  // reachability after dispose().
  describe("view setSelected before dispose", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: view collected after setSelected + dispose`, async () => {
        const { viewRef } = createWithViewSelected(key, mvt);
        if (viewRef) {
          await forceGC(viewRef);
          expect(viewRef.deref()).toBeUndefined();
        }
      });
    }
  });

  // ── Bulk cycle (all keys, no known leaks) ─────────────────────────────────
  it("bulk create/dispose cycle does not leak", async () => {
    const refs: Array<{
      key: string;
      elementRef: WeakRef<object>;
      viewRef: WeakRef<object> | null;
    }> = [];

    const bulkKeys = ALL_KEYS;
    for (let i = 0; i < 100; i++) {
      const key = bulkKeys[i % bulkKeys.length] as ComponentKey;
      refs.push({ key, ...createWithView(key, mvt) });
    }

    await forceGC();

    const leaks = refs.filter((r) => r.elementRef.deref() !== undefined || r.viewRef?.deref() !== undefined);
    if (leaks.length > 0) {
      const names = [...new Set(leaks.map((l) => l.key))].join(", ");
      expect.fail(`Leaked ${leaks.length} object(s) across: ${names}`);
    }
  });

  // ── OpticsScene.clearElements + dispose ────────────────────────────────────
  it("OpticsScene.clearElements + dispose collects all added elements", async () => {
    const elementRefs: Array<{ key: string; ref: WeakRef<object> }> = [];
    let sceneRef!: WeakRef<object>;

    (() => {
      const scene = new OpticsScene(Tandem.OPT_OUT);
      // Add a representative spread of elements.
      const keysToAdd = ALL_KEYS.slice(0, 10);
      for (const key of keysToAdd) {
        const el = createDefaultElement(key, 0, 0);
        elementRefs.push({ key, ref: new WeakRef<object>(el) });
        scene.addElement(el, false);
      }
      scene.clearElements();
      sceneRef = new WeakRef<object>(scene);
      scene.dispose();
    })();

    await forceGC();

    const leakedElements = elementRefs.filter((e) => e.ref.deref() !== undefined);
    if (leakedElements.length > 0) {
      const names = leakedElements.map((e) => e.key).join(", ");
      expect.fail(`Elements still retained after scene.clearElements() + dispose(): ${names}`);
    }
    expect(sceneRef.deref()).toBeUndefined();
  });

  // ── scene.simulate() cache does not retain removed elements ──────────────
  //
  // OpticsScene caches the TraceResult between invalidations.  Adding then
  // removing elements must call invalidate(), clearing cachedResult so no
  // indirect element reference (e.g. via IntersectionResult.element) survives.
  it("scene.simulate() cache does not retain elements after clearElements", async () => {
    const elementRefs: Array<{ key: string; ref: WeakRef<object> }> = [];

    (() => {
      const scene = new OpticsScene(Tandem.OPT_OUT);
      // Include a light source so the tracer produces real ray-element interactions.
      const keysToTest: ComponentKey[] = ["pointSource", "flatMirror", "idealLens", "detector"];
      for (const key of keysToTest) {
        const el = createDefaultElement(key, 0, 0);
        elementRefs.push({ key, ref: new WeakRef<object>(el) });
        scene.addElement(el, false);
      }
      // Populate the trace cache — this may create TraceResult objects that
      // contain element references in intersection records.
      scene.simulate();
      // clearElements() → opticalElementsGroup.clear() → invalidate()
      // must null out cachedResult so no element is reachable from it.
      scene.clearElements();
      scene.dispose();
    })();

    await forceGC();

    const leaked = elementRefs.filter((e) => e.ref.deref() !== undefined);
    if (leaked.length > 0) {
      expect.fail(
        `Elements retained in simulate() cache after clearElements(): ${leaked.map((e) => e.key).join(", ")}`,
      );
    }
  });

  // ── scene.resetAll() clears history closures and collects elements ────────
  //
  // resetAll() calls clearElements() AND history.clear(), removing undo/redo
  // command closures that capture element references.  After dispose() both
  // the scene and all elements must be collectible.
  it("scene.resetAll() + dispose collects all elements and clears history", async () => {
    const elementRefs: Array<{ key: string; ref: WeakRef<object> }> = [];
    let sceneRef!: WeakRef<object>;

    (() => {
      const scene = new OpticsScene(Tandem.OPT_OUT);
      // Use default recordHistory=true so undo commands accumulate while adding.
      const keysToAdd = ALL_KEYS.slice(0, 10);
      for (const key of keysToAdd) {
        const el = createDefaultElement(key, 0, 0);
        elementRefs.push({ key, ref: new WeakRef<object>(el) });
        scene.addElement(el); // recordHistory=true (default)
      }
      // resetAll() clears the group AND purges history.undoStack / redoStack.
      scene.resetAll();
      sceneRef = new WeakRef<object>(scene);
      scene.dispose();
    })();

    await forceGC();

    const leakedElements = elementRefs.filter((e) => e.ref.deref() !== undefined);
    if (leakedElements.length > 0) {
      expect.fail(`Elements retained after resetAll() + dispose(): ${leakedElements.map((e) => e.key).join(", ")}`);
    }
    expect(sceneRef.deref()).toBeUndefined();
  });

  // ── TrackView unregisters from global trackRegistry on dispose ─────────────
  //
  // TrackView.constructor() calls trackRegistry.register(track.id, ...) so
  // other views can snap-to-track during drags.  If dispose() fails to call
  // trackRegistry.unregister(), the registry retains closure references to the
  // track element's endpoint getters, preventing GC and poisoning future snaps.
  it("TrackView unregisters from trackRegistry on dispose", () => {
    const el = createDefaultElement("track", 0, 0);
    const trackId = el.id;

    const view = createOpticalElementView(el, mvt, Tandem.OPT_OUT, viewOptions);

    // Immediately after construction the track must appear in the registry.
    const registeredBefore = trackRegistry.getAllTracks().some((t) => t.id === trackId);
    expect(registeredBefore).toBe(true);

    view?.dispose();
    el.dispose();

    // After disposal the entry must be gone.
    const registeredAfter = trackRegistry.getAllTracks().some((t) => t.id === trackId);
    expect(registeredAfter).toBe(false);
  });

  // ── Multiple sequential scenes do not cross-retain each other's elements ──
  //
  // Creating several independent scenes in sequence (as happens when the user
  // loads a preset or resets the app) must not leave any scene or its elements
  // reachable through a successor scene or global state.
  it("multiple sequential scenes do not cross-retain elements", async () => {
    const allRefs: Array<{ key: string; ref: WeakRef<object> }> = [];
    const sceneRefs: WeakRef<object>[] = [];

    (() => {
      const keysToAdd = ALL_KEYS.slice(0, 6);
      for (let s = 0; s < 3; s++) {
        const scene = new OpticsScene(Tandem.OPT_OUT);
        for (const key of keysToAdd) {
          const el = createDefaultElement(key, 0, 0);
          allRefs.push({ key, ref: new WeakRef<object>(el) });
          scene.addElement(el, false);
        }
        scene.clearElements();
        sceneRefs.push(new WeakRef<object>(scene));
        scene.dispose();
      }
    })();

    await forceGC();

    const leakedScenes = sceneRefs.filter((r) => r.deref() !== undefined).length;
    const leakedElements = allRefs.filter((e) => e.ref.deref() !== undefined);
    if (leakedScenes > 0 || leakedElements.length > 0) {
      const names = leakedElements.map((e) => e.key).join(", ");
      expect.fail(
        `${leakedScenes} scene(s) and ${leakedElements.length} element(s) leaked across sequential scenes: ${names}`,
      );
    }
  });
});
