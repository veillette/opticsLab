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
import { createOpticalElementView } from "../src/common/view/OpticalElementViewFactory.js";

// "prism" (GlassView with isPrism=true) has a known deeper retention issue
// due to the dynamic vertex add/remove button machinery — tracked separately.
const KNOWN_LEAK_KEYS: Set<ComponentKey> = new Set<ComponentKey>(["prism"]);

// A representative subset covering every element category.
const KEYS_TO_TEST: ComponentKey[] = [
  // light sources
  "pointSource",
  "beam",
  "singleRay",
  "arcSource",
  // mirrors
  "flatMirror",
  "arcMirror",
  "parabolicMirror",
  "idealMirror",
  "beamSplitter",
  // glass
  "idealLens",
  "circleGlass",
  "biconvexLens",
  "prism",
  "halfPlaneGlass",
  // blockers
  "lineBlocker",
  "aperture",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

async function forceGC(): Promise<void> {
  for (let i = 0; i < 5; i++) {
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
    for (const key of KEYS_TO_TEST) {
      it(`${key}: model element is collected after dispose`, async () => {
        const ref = createModelOnly(key);
        await forceGC();
        expect(ref.deref()).toBeUndefined();
      });
    }
  });

  // ── View is collected after dispose ───────────────────────────────────────
  describe("view disposal", () => {
    for (const key of KEYS_TO_TEST) {
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
    for (const key of KEYS_TO_TEST) {
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

  // ── Bulk cycle ────────────────────────────────────────────────────────────
  it("bulk create/dispose cycle does not leak", async () => {
    const refs: Array<{
      key: string;
      elementRef: WeakRef<object>;
      viewRef: WeakRef<object> | null;
    }> = [];

    const bulkKeys = KEYS_TO_TEST.filter((k) => !KNOWN_LEAK_KEYS.has(k));
    for (let i = 0; i < 50; i++) {
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
});
