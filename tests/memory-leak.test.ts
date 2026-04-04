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
 */

import { Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Tandem } from "scenerystack/tandem";
import { describe, expect, it } from "vitest";
import { type ComponentKey, createDefaultElement } from "../src/common/model/ComponentFactory.js";
import { OpticsScene } from "../src/common/model/optics/OpticsScene.js";
import { createOpticalElementView } from "../src/common/view/OpticalElementViewFactory.js";

// Known view-layer retention issues — tracked separately as individual bugs.
// "prism": GlassView with isPrism=true has deeper retention from dynamic vertex
//   add/remove button machinery.
// "aperturedMirror": AperturedParabolicMirrorView retains decoration nodes after dispose.
const KNOWN_LEAK_KEYS: Set<ComponentKey> = new Set<ComponentKey>(["prism", "aperturedMirror"]);

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

async function forceGC(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    global.gc?.();
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** Create a model element in a function scope, dispose it, return WeakRef. */
function createModelOnly(key: ComponentKey): WeakRef<object> {
  const el = createDefaultElement(key, 0, 0);
  const ref = new WeakRef<object>(el);
  el.dispose();
  return ref;
}

/** Create element + view, dispose both, return WeakRefs. */
function createWithView(
  key: ComponentKey,
  mvt: ModelViewTransform2,
): { elementRef: WeakRef<object>; viewRef: WeakRef<object> | null } {
  const el = createDefaultElement(key, 0, 0);
  const view = createOpticalElementView(el, mvt, Tandem.OPT_OUT);
  const elementRef = new WeakRef<object>(el);
  const viewRef = view ? new WeakRef<object>(view) : null;
  view?.dispose();
  el.dispose();
  return { elementRef, viewRef };
}

/**
 * Create a scene, add an element to it, remove the element, dispose the scene.
 * Returns WeakRefs to both the scene and the element so we can assert collection.
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
    await forceGC();
    expect(ref.deref()).toBeUndefined();
  });

  // ── Model-only (no view created) ──────────────────────────────────────────
  describe("model-only (no view)", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: model element is collected after dispose`, async () => {
        const ref = createModelOnly(key);
        await forceGC();
        expect(ref.deref()).toBeUndefined();
      });
    }
  });

  // ── View is collected after dispose ───────────────────────────────────────
  describe("view disposal", () => {
    for (const key of ALL_KEYS) {
      const testFn = KNOWN_LEAK_KEYS.has(key) ? it.todo : it;
      testFn(`${key}: view is collected after dispose`, async () => {
        const { viewRef } = createWithView(key, mvt);
        if (viewRef) {
          await forceGC();
          expect(viewRef.deref()).toBeUndefined();
        }
      });
    }
  });

  // ── Element + view together ───────────────────────────────────────────────
  describe("element + view combined", () => {
    for (const key of ALL_KEYS) {
      const testFn = KNOWN_LEAK_KEYS.has(key) ? it.todo : it;
      testFn(`${key}: both collected after disposal`, async () => {
        const { elementRef, viewRef } = createWithView(key, mvt);
        await forceGC();

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

  // ── Scene lifecycle: element added then removed before scene disposal ─────
  describe("scene lifecycle", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: element collected after scene add/remove + dispose`, async () => {
        const { sceneRef, elementRef } = createSceneWithElement(key);
        await forceGC();

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

  // ── Double-dispose safety ─────────────────────────────────────────────────
  describe("double-dispose safety (no crash)", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: second dispose() does not throw`, () => {
        const el = createDefaultElement(key, 0, 0);
        el.dispose();
        expect(() => el.dispose()).not.toThrow();
      });
    }
  });

  // ── Model-only repeated allocation ───────────────────────────────────────
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

  // ── Bulk cycle (all keys, no known leaks) ─────────────────────────────────
  it("bulk create/dispose cycle does not leak", async () => {
    const refs: Array<{
      key: string;
      elementRef: WeakRef<object>;
      viewRef: WeakRef<object> | null;
    }> = [];

    const bulkKeys = ALL_KEYS.filter((k) => !KNOWN_LEAK_KEYS.has(k));
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

  // ── emitRays / serialize do not retain the element ────────────────────────
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
        await forceGC();
        expect(ref.deref()).toBeUndefined();
      });
    }
  });

  // ── Scene: clear all elements then dispose ────────────────────────────────
  it("OpticsScene.clearElements + dispose collects all added elements", async () => {
    const elementRefs: Array<{ key: string; ref: WeakRef<object> }> = [];
    let sceneRef!: WeakRef<object>;

    (() => {
      const scene = new OpticsScene(Tandem.OPT_OUT);
      // Add a representative spread of elements.
      const keysToAdd = ALL_KEYS.filter((k) => !KNOWN_LEAK_KEYS.has(k)).slice(0, 10);
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
});
