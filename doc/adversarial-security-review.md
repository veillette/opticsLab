# Adversarial Security & Correctness Review

**Date:** 2026-04-07
**Reviewed by:** Senior Security Engineer / Staff Systems Architect
**Scope:** Full codebase (139 TypeScript files, ~1.3 MB)
**Architecture:** Pure client-side PWA, single production dependency (`scenerystack`)

---

## Executive Summary

OpticsLab has a minimal network attack surface — no backend, no authentication, no external APIs. However, eleven concrete defects were identified across the physics engine, deserialization layer, and concurrency model. The most critical cluster around a shared root cause: **the deserialization layer is a trust boundary treated as an internal API**. All slider ranges and constructor invariants are enforced by the UI, not the model. The moment a value crosses `JSON.parse`, it re-enters as an unvalidated `unknown` immediately re-cast to a trusted type, bypassing every guard.

---

## FINDING #1 — Global Mutable Static State in `BaseGlass`

**File:** `src/common/model/glass/BaseGlass.ts:24–32`
**Severity: HIGH (Architectural Fragility / Logic Failure)**

### Code

```typescript
public static partialReflectionEnabled = true;
public static lensRimBlockingEnabled = false;
```

These statics are mutated by `RayTracer.trace()` on every call:

```typescript
// RayTracer.ts:122–123
BaseGlass.partialReflectionEnabled = this.config.partialReflectionEnabled ?? true;
BaseGlass.lensRimBlockingEnabled   = this.config.lensRimBlockingEnabled  ?? false;
```

### Attack / Failure Vector

The app has 4 screens (`Intro`, `Lab`, `Diffraction`, `Presets`). If any two screens trigger simulation in the same event loop tick — for example, a `Multilink` fired by a scene switch during an animation frame — the second tracer overwrites the static before the first tracer's glass elements finish reading it. One scene's preference silently poisons every other scene's physics, with no error or log entry.

The constraint "Never set this directly from the view layer" is a comment enforced by nothing. No mechanism prevents a test, a preset loader, or a future developer from writing `BaseGlass.partialReflectionEnabled = false`.

### Why This Is Dangerous

This is a classic ambient authority anti-pattern. A class with static mutable state becomes a hidden global communication channel invisible to callers. The discipline applied to the guarded `refIndex` setter is entirely absent from these flags.

### Fix

Pass `partialReflectionEnabled` and `lensRimBlockingEnabled` through `RayTracerConfig` and forward them into `element.onRayIncident(ray, intersection, config)`. The statics must be removed.

---

## FINDING #2 — `asPoint()` Has No Runtime Guard: Crash and NaN Injection via Malformed JSON

**File:** `src/common/model/optics/elementSerialization.ts:85–88`
**Severity: HIGH (Unhandled Exception / Silent Logic Error)**

### Code

```typescript
function asPoint(v: unknown): Point {
  const p = v as { x: number; y: number }; // TypeScript cast — zero runtime effect
  return point(p.x, p.y);
}
```

### Attack Vector A — `TypeError` crash

```json
{ "elements": [{ "type": "segmentMirror", "p1": null, "p2": {"x":0,"y":0} }] }
```

`asPoint(null)` → `const p = null` → `p.x` → `TypeError: Cannot read properties of null`. No `try/catch` exists anywhere in the `OpticsScene.fromJSON` call chain. The application crashes; state is undefined.

### Attack Vector B — Silent NaN poisoning

```json
{ "elements": [{ "type": "segmentMirror", "p1": {"x":"infinity","y":"infinity"}, "p2": {"x":0,"y":0} }] }
```

`as {x: number; y: number}` is erased at runtime. `point("infinity", "infinity")` creates `{x: "infinity", y: "infinity"}`. Every downstream arithmetic operation yields `NaN`. The ray tracer runs to completion, produces no segments for this element, and logs nothing. **Wrong output, no indication of failure.**

### Why This Is Dangerous

TypeScript `as` casts are compile-time only. `JSON.parse()` returns `any`. Every `as number` and `as Point` cast in `elementSerialization.ts` (80+ occurrences) silently trusts external data. The strict TypeScript config protects application code, not external input.

### Fix

Add a `safeAsPoint` helper that performs an explicit runtime check:

```typescript
function safeAsPoint(v: unknown, field: string): Point {
  if (typeof v !== 'object' || v === null ||
      typeof (v as Record<string, unknown>)['x'] !== 'number' ||
      typeof (v as Record<string, unknown>)['y'] !== 'number') {
    throw new Error(`Invalid point at field "${field}": ${JSON.stringify(v)}`);
  }
  const p = v as { x: number; y: number };
  return point(p.x, p.y);
}
```

Apply similarly to all `as number` casts in `deserializeElement`.

---

## FINDING #3 — No `try/catch` Around `JSON.parse` in `fromJSON`

**File:** `src/common/model/optics/OpticsScene.ts:442`
**Severity: HIGH (Unhandled Exception)**

### Code

```typescript
public static fromJSON(json: string): OpticsScene {
  const data = JSON.parse(json) as { ... }; // throws SyntaxError — uncaught
  ...
}
```

### Attack / Failure Vector

Any truncated save file, encoding corruption, HTML error page, or user-edited JSON with a stray comma causes `JSON.parse` to throw `SyntaxError`. This is uncaught. The `OpticsScene` object is never returned. Any caller that expected a scene now has an uninitialized reference and undefined application state.

The unvalidated settings object is also passed directly to the `OpticsScene` constructor, which creates `NumberProperty` instances with `Range` bounds. A settings field outside the allowed range (e.g., `"maxRayDepth": 99999`) causes the PhET-iO constructor to throw — also uncaught.

### Fix

```typescript
public static fromJSON(json: string): OpticsScene | null {
  try {
    const data = JSON.parse(json) as { settings?: Partial<SceneSettings>; elements?: unknown[] };
    // Clamp all numeric settings to valid ranges before passing to constructor
    const scene = new OpticsScene(Tandem.OPT_OUT, sanitizeSettings(data.settings ?? {}));
    for (const obj of Array.isArray(data.elements) ? data.elements : []) {
      if (typeof obj === 'object' && obj !== null) {
        const element = deserializeElement(obj as Record<string, unknown>);
        if (element !== null) { scene.addElement(element); }
      }
    }
    return scene;
  } catch (e) {
    console.error('Failed to load scene:', e);
    return null;
  }
}
```

---

## FINDING #4 — `polygonCentroid([])` Divides by Zero

**File:** `src/common/model/optics/Geometry.ts:265–274`
**Severity: MEDIUM (Silent NaN)**

### Code

```typescript
export function polygonCentroid(path: { x: number; y: number }[]): Point {
  const n = path.length; // 0 for empty arrays
  let sx = 0, sy = 0;
  for (const p of path) { sx += p.x; sy += p.y; }
  return { x: sx / n, y: sy / n }; // 0/0 = NaN
}
```

### Attack / Failure Vector

Deserializing `{"type":"glass","path":[],"refIndex":1.5}` (no minimum vertex count is enforced in `deserializeElement`) and then calling `polygonCentroid` on it returns `{x: NaN, y: NaN}`. This NaN centroid propagates into UI positioning, drag handle placement, and ray-intersection lookups. The element silently renders at position NaN.

### Fix

```typescript
if (n === 0) { return point(0, 0); }
```

Or, preferably, assert `n > 0` at the call site and enforce a minimum polygon vertex count in `deserializeElement` for `ELEMENT_TYPE_GLASS`.

---

## FINDING #5 — Grating Sinc Singularity: NaN Brightness Cascade

**File:** `src/common/model/gratings/gratingRayInteraction.ts:43–44`
**Severity: MEDIUM (Silent NaN Cascade)**

### Code

```typescript
const arg = m * dutyCycle;
const intensity = m === 0 ? 1.0 : (Math.sin(Math.PI * arg) / (Math.PI * arg)) ** 2;
```

### Attack / Failure Vector

`dutyCycle = 0` is injectable via JSON (`{"dutyCycle": 0}`) — the slider range `[0.01, 0.99]` is not enforced during deserialization. With `dutyCycle = 0` and `m ≠ 0`, `arg = 0`, giving `sin(0)/0 = 0/0 = NaN`.

The guard `if (intensity < 0.001)` **does not filter NaN** — `NaN < 0.001 = false` in IEEE 754 — so the order is pushed with `intensity = NaN`.

Downstream:

```typescript
const totalIntensity = orders.reduce((sum, o) => sum + o.intensity, 0); // NaN
const scale = totalIntensity > 0 ? 1 / totalIntensity : 0; // NaN > 0 = false → scale = 0
const brightness = avgBrightness * NaN_intensity * 0; // NaN (0 * NaN = NaN in IEEE 754)
```

Every ray from this grating has `brightnessS = NaN`, `brightnessP = NaN`. The check `totalBrightness < minBrightness` at `RayTracer.ts:176` evaluates `NaN < 0.01 = false`, so the ray is never culled and propagates until `maxRayDepth` is hit, polluting the entire output with NaN segments.

### Fix

Replace the raw sinc expression with a numerically safe implementation:

```typescript
function sinc(x: number): number {
  if (Math.abs(x) < 1e-10) { return 1.0; }
  return Math.sin(Math.PI * x) / (Math.PI * x);
}
const intensity = m === 0 ? 1.0 : sinc(arg) ** 2;
```

Also enforce `dutyCycle ∈ (0, 1)` in `deserializeElement`.

---

## FINDING #6 — `normalize({x:0, y:0})` Returns Zero Vector, Cascades to Infinity

**File:** `src/common/model/optics/Geometry.ts:95–101`
**Severity: MEDIUM (Silent Cascade)**

### Code

```typescript
export function normalize(p: Point): Point {
  const len = Math.hypot(p.x, p.y);
  if (len === 0) {
    return point(0, 0); // "Safe" return — actually dangerous in a physics engine
  }
  return point(p.x / len, p.y / len);
}
```

### Attack / Failure Vector

A zero-direction vector returned here enters `rayCircleIntersections` (used in observer mode and fiber optic boundary checks):

```typescript
const a = rayDir.x * rayDir.x + rayDir.y * rayDir.y; // = 0
const t = (-b + sign * sqrtDisc) / (2 * a);           // → ±Infinity or NaN
```

`Infinity` passes the `t > 1e-6` guard and is returned as a valid intersection point: `origin.x + 0 * Infinity = NaN`. NaN coordinates then corrupt all segment data downstream.

**Trigger:** Any degenerate element where two control points are identical (e.g., `p1 === p2` in a `SegmentMirror`) causes the tangent to be `{x:0, y:0}`, `normalize` to return `{x:0, y:0}`, and the zero vector to become a ray direction.

### Fix

In a physics engine, `normalize` of the zero vector is a contract violation. The function should `throw` or callers should guard before calling. At minimum, document that the zero return is unsafe and audit all call sites.

---

## FINDING #7 — `BaseGlass` Constructor Bypasses the Setter Guard for `refIndex`

**File:** `src/common/model/glass/BaseGlass.ts:41–53`
**Severity: MEDIUM (Hidden Assumption)**

### Code

```typescript
// Setter correctly guards against zero:
public set refIndex(v: number) {
  if (v === 0) { throw new Error(`refIndex must not be zero...`); }
  this._refIndex = v;
}

// Constructor bypasses the setter:
protected constructor(refIndex = DEFAULT_REFRACTIVE_INDEX, ...) {
  super();
  this._refIndex = refIndex; // Direct write to backing field — zero passes through
}
```

### Attack / Failure Vector

`{"type": "glass", "refIndex": 0, ...}` → `new Glass(path, 0)` → `this._refIndex = 0`. `getRefIndexAt()` returns `0`. The calling element computes `n1 = 1.0 / 0 = Infinity`, then:

```
sq1 = 1 - Infinity² * (1 - cos1²) = -Infinity < 0 → total internal reflection always
```

The glass element acts as a perfect mirror for every ray regardless of angle or wavelength. Wrong physics, no error.

### Fix

Delegate to the setter from the constructor, or inline the check:

```typescript
protected constructor(refIndex = DEFAULT_REFRACTIVE_INDEX, ...) {
  super();
  this.refIndex = refIndex; // Use setter, not backing field
  ...
}
```

---

## FINDING #8 — Undo/Redo May Resurrect Disposed PhET-iO Objects

**File:** `src/common/model/optics/OpticsScene.ts:279–300`
**Severity: MEDIUM (Architectural Fragility)**

### Code

```typescript
const doRemove = (): boolean => {
  this.opticalElementsGroup.disposeElement(wrapper); // PhET-iO tandem disposed
  return true;
};

const command: SceneCommand = {
  execute: () => { doRemove(); },
  undo: () => this.addElement(element, false), // `element` captured by closure post-dispose
};
```

### Attack / Failure Vector

The undo closure re-uses the same `element` object reference that was previously disposed. `disposeElement` in PhET-iO unregisters the tandem and cleans up listeners. `addElement(element, false)` then calls `element.serialize()` on a potentially disposed object, followed by `createNextElement` re-registering it. If PhET-iO marks objects as disposed and checks that flag, this silently fails. If it does not, it registers a zombie element with stale listener state, creating UI inconsistency (element appears but internal state is broken).

The issue is compounded by the `CommandHistory` allowing 100 undoable operations: a user who removes 100 elements can attempt to re-add all of them via undo, with all the corresponding resurrections.

### Fix

Re-serialize the element's state at remove-time and reconstruct from data at undo-time, rather than capturing a live object reference across a dispose boundary.

---

## FINDING #9 — No Invariant `coreRefIndex > claddingRefIndex` in Fiber Optic

**File:** `src/common/model/fiber/FiberOpticElement.ts:261–262`
**Severity: MEDIUM (Silent Physics Error)**

### Attack / Failure Vector

Deserializing `{"type": "fiberOptic", "refIndex": 1.5, "coreRefIndex": 1.3}` creates a fiber where `n_core < n_cladding`. `FiberCoreGlass.onRayIncident` computes `n1 = nCore / nCladding = 1.3/1.5 < 1`, making total internal reflection geometrically impossible. Light "leaks" out of the core at every surface interaction. The simulation runs to completion producing physically nonsensical results with no warning.

### Fix

Enforce `coreRefIndex > outerRefIndex` in both the `FiberOpticElement` constructor and `deserializeElement`:

```typescript
if (coreRefIndex <= refIndex) {
  throw new Error(`Fiber core index (${coreRefIndex}) must exceed cladding index (${refIndex}) for TIR guiding`);
}
```

---

## FINDING #10 — `sampleArcPoints(p1, p2, p3, 0)` Produces NaN

**File:** `src/common/model/optics/Geometry.ts:372–404`
**Severity: LOW (Edge Case)**

```typescript
for (let i = 0; i <= n; i++) {
  const t = i / n;  // When n = 0: 0/0 = NaN
  ...
}
```

With `n = 0`, `i = 0`, `t = NaN`. The resulting point array contains `[{x: NaN, y: NaN}]`, which propagates into polygon construction. Add a guard: `if (n <= 0) { return [p1]; }`.

---

## FINDING #11 — `maxRayDepth=500` + `rayDensity=5.0` = Main-Thread Freeze

**File:** `src/OpticsLabConstants.ts:83–87`
**Severity: LOW (DoS via URL parameters)**

### Attack / Failure Vector

URL: `?maximumLightRayDepth=500&rayDensity=5` + a retroreflecting cavity (two facing mirrors + beam splitter). With `RAY_DENSITY_SCALE = 500`, a point source emits `5 × 500 = 2500` initial rays. The beam splitter spawns a reflected ray at each bounce. With `FRESNEL_REFLECTION_THRESHOLD = 0.01` and a high-reflectance surface (Rs ≈ 0.99), a single ray bounces `log(0.01)/log(0.99) ≈ 458` times before being culled. The BFS queue at `RayTracer.ts:137` has no total size cap. On a 20-element scene this computes ~25 M intersection tests per animation frame synchronously on the main thread, freezing the browser tab.

### Fix

Add a `maxTotalSegments` cap to `RayTracerConfig` (e.g., 50,000) and terminate early when the queue exceeds it, returning a `truncationError` to the caller.

---

## Systemic Root Cause

All medium/high findings share a single root cause: **the deserialization layer is a trust boundary treated as an internal API.** The TypeScript type system, slider range constraints, constructor guards, and setter validators are all bypassed the moment data enters through `JSON.parse`. The correct fix is a dedicated deserialization validation layer that:

1. Wraps `JSON.parse` in a try/catch.
2. Validates the structure and types of the parsed object before any cast.
3. Clamps or rejects out-of-range numeric values.
4. Returns a typed result (`OpticsScene | null`) so callers can handle failure without crashing.

---

## Recommended Fixes by Priority

| Priority | Action |
|----------|--------|
| P0 | Wrap `fromJSON` in try/catch; return `null` on failure |
| P0 | Replace `asPoint()` with a runtime-validating equivalent |
| P0 | Remove `BaseGlass` statics; pass flags via `RayTracerConfig` |
| P1 | Clamp/validate all numeric fields in `deserializeElement` |
| P1 | Fix sinc singularity in `gratingRayInteraction` |
| P1 | Route `BaseGlass` constructor through the `refIndex` setter |
| P2 | Guard `normalize` zero-vector case at call sites |
| P2 | Add `polygonCentroid` empty-array guard |
| P2 | Add total queue-size cap to `RayTracer` |
| P3 | Enforce `coreRefIndex > claddingRefIndex` in fiber deserialization |
| P3 | Guard `sampleArcPoints` against `n = 0` |
