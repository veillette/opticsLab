/**
 * duplicate-element.test.ts
 *
 * Unit tests for OpticsScene.duplicateElement().
 *
 * Covers:
 *   1. Returns null for an unknown element ID.
 *   2. Clone gets a distinct ID from the original.
 *   3. Zero-offset clone is an exact positional copy (serialize round-trip).
 *   4. Position offset is applied to scalar x/y fields (PointSource).
 *   5. Position offset is applied to p1/p2 Point fields (SegmentMirror).
 *   6. Position offset is applied to cx/cy fields (EquilateralPrism).
 *   7. Position offset is applied to Glass path vertices.
 *   8. Clone is added to the scene (element count increases).
 *   9. The add operation is undo-able via the history stack.
 *  10. The original element is unchanged after duplication.
 */

import { Tandem } from "scenerystack/tandem";
import { describe, expect, it } from "vitest";
import { EquilateralPrism } from "../src/common/model/glass/EquilateralPrism.js";
import { Glass } from "../src/common/model/glass/Glass.js";
import { PointSourceElement } from "../src/common/model/light-sources/PointSourceElement.js";
import { SegmentMirror } from "../src/common/model/mirrors/SegmentMirror.js";
import { point } from "../src/common/model/optics/Geometry.js";
import { OpticsScene } from "../src/common/model/optics/OpticsScene.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeScene(): OpticsScene {
  return new OpticsScene(Tandem.OPT_OUT);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("OpticsScene.duplicateElement()", () => {
  it("returns null for an unknown element ID", () => {
    const scene = makeScene();
    expect(scene.duplicateElement("does-not-exist")).toBeNull();
  });

  it("assigns a distinct ID to the clone", () => {
    const scene = makeScene();
    const src = new PointSourceElement(point(0, 0), 1, 550);
    scene.addElement(src, false);

    const clone = scene.duplicateElement(src.id);
    expect(clone).not.toBeNull();
    expect(clone!.id).not.toBe(src.id);
  });

  it("zero-offset clone has the same serialized state (minus id)", () => {
    const scene = makeScene();
    const src = new PointSourceElement(point(10, 20), 0.8, 632);
    scene.addElement(src, false);

    const clone = scene.duplicateElement(src.id);
    expect(clone).not.toBeNull();

    const srcState = src.serialize();
    const cloneState = clone!.serialize();
    // Every field except the element ID should match.
    expect(cloneState).toMatchObject(srcState);
  });

  it("applies dx/dy offset to scalar x/y fields (PointSource)", () => {
    const scene = makeScene();
    const src = new PointSourceElement(point(5, 10), 1, 550);
    scene.addElement(src, false);

    const clone = scene.duplicateElement(src.id, point(3, -4));
    expect(clone).not.toBeNull();

    const s = clone!.serialize() as Record<string, number>;
    expect(s["x"]).toBeCloseTo(8);
    expect(s["y"]).toBeCloseTo(6);
  });

  it("applies offset to p1/p2 Point fields (SegmentMirror)", () => {
    const scene = makeScene();
    const src = new SegmentMirror(point(0, 0), point(10, 0));
    scene.addElement(src, false);

    const clone = scene.duplicateElement(src.id, point(5, 5));
    expect(clone).not.toBeNull();

    const s = clone!.serialize() as Record<string, { x: number; y: number }>;
    expect(s["p1"]).toMatchObject({ x: 5, y: 5 });
    expect(s["p2"]).toMatchObject({ x: 15, y: 5 });
  });

  it("applies offset to cx/cy fields (EquilateralPrism)", () => {
    const scene = makeScene();
    const src = new EquilateralPrism(point(0, 0), 1, 1.5);
    scene.addElement(src, false);

    const clone = scene.duplicateElement(src.id, point(2, -3));
    expect(clone).not.toBeNull();

    const s = clone!.serialize() as Record<string, number>;
    expect(s["cx"]).toBeCloseTo(2);
    expect(s["cy"]).toBeCloseTo(-3);
  });

  it("applies offset to all Glass path vertices", () => {
    const scene = makeScene();
    const src = new Glass(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ],
      1.5,
    );
    scene.addElement(src, false);

    const clone = scene.duplicateElement(src.id, point(1, 2));
    expect(clone).not.toBeNull();

    const s = clone!.serialize() as { path: Array<{ x: number; y: number }> };
    expect(s.path[0]).toMatchObject({ x: 1, y: 2 });
    expect(s.path[1]).toMatchObject({ x: 11, y: 2 });
    expect(s.path[2]).toMatchObject({ x: 6, y: 12 });
  });

  it("adds the clone to the scene (element count increases)", () => {
    const scene = makeScene();
    const src = new PointSourceElement(point(0, 0), 1, 550);
    scene.addElement(src, false);
    expect(scene.getAllElements()).toHaveLength(1);

    scene.duplicateElement(src.id);
    expect(scene.getAllElements()).toHaveLength(2);
  });

  it("the add is undoable via the history stack", () => {
    const scene = makeScene();
    const src = new PointSourceElement(point(0, 0), 1, 550);
    scene.addElement(src, false);

    scene.duplicateElement(src.id);
    expect(scene.getAllElements()).toHaveLength(2);

    scene.history.undo();
    expect(scene.getAllElements()).toHaveLength(1);
    // Original is still present after undoing the duplicate.
    expect(scene.getElement(src.id)).toBeDefined();
  });

  it("does not mutate the original element", () => {
    const scene = makeScene();
    const src = new PointSourceElement(point(7, 3), 1, 550);
    scene.addElement(src, false);

    const beforeState = src.serialize();
    scene.duplicateElement(src.id, point(100, 100));

    expect(src.serialize()).toMatchObject(beforeState);
  });
});
