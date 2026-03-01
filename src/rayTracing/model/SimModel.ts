import type { Tandem } from "scenerystack/tandem";
import opticsLab from "../../OpticsLabNamespace.js";
import { CircleGlass } from "./glass/CircleGlass.js";
import { HalfPlaneGlass } from "./glass/HalfPlaneGlass.js";
import { IdealLens } from "./glass/IdealLens.js";
import { PolygonGlass } from "./glass/PolygonGlass.js";
import { SphericalLens } from "./glass/SphericalLens.js";
import { BeamSource } from "./light-sources/BeamSource.js";
import { PointSourceElement } from "./light-sources/PointSourceElement.js";
import { SingleRaySource } from "./light-sources/SingleRaySource.js";
import { ArcMirror } from "./mirrors/ArcMirror.js";
import { BeamSplitterElement } from "./mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "./mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "./mirrors/ParabolicMirror.js";
import { SegmentMirror } from "./mirrors/SegmentMirror.js";
import { OpticsScene } from "./optics/OpticsScene.js";

// ── Demo scene layout ─────────────────────────────────────────────────────────
// Screen dimensions: 1024 × 618 (typical SceneryStack ScreenView layout bounds).
// Light sources along the top row, mirrors on the left half, glass / lenses
// on the right half.

function buildDemoScene(): OpticsScene {
  const scene = new OpticsScene();

  // ── Light Sources (top row) ───────────────────────────────────────────────

  // A. 360° point source – positioned in the top-center area
  scene.addElement(new PointSourceElement({ x: 200, y: 40 }, /* brightness= */ 0.6));

  // B. Parallel beam – vertical aperture on the left edge, aimed rightward
  //    p1/p2 define the aperture cross-section; rays emit perpendicular (→)
  scene.addElement(
    new BeamSource(
      { x: 420, y: 20 },
      { x: 420, y: 75 },
      /* brightness= */ 0.5,
      /* wavelength= */ 532,
      /* emisAngle= */ 0,
    ),
  );

  // C. Single directional ray – aimed at the arc mirror below
  scene.addElement(
    new SingleRaySource(
      { x: 600, y: 30 }, // origin
      { x: 650, y: 80 }, // direction point
      /* brightness= */ 1.0,
    ),
  );

  // ── Mirrors (left column) ─────────────────────────────────────────────────

  // 1. Flat segment mirror — horizontal, near top-left
  scene.addElement(new SegmentMirror({ x: 80, y: 90 }, { x: 320, y: 90 }));

  // 2. Concave arc mirror — circular arc opening upward
  scene.addElement(
    new ArcMirror(
      { x: 80, y: 210 },
      { x: 320, y: 210 },
      { x: 200, y: 160 }, // control point above midpoint → concave side up
    ),
  );

  // 3. Parabolic mirror — parabola opening upward
  scene.addElement(
    new ParabolicMirror(
      { x: 80, y: 330 },
      { x: 320, y: 330 },
      { x: 200, y: 275 }, // vertex above midpoint → concave side up
    ),
  );

  // 4. Ideal curved mirror (obeys mirror equation exactly)
  scene.addElement(new IdealCurvedMirror({ x: 80, y: 450 }, { x: 320, y: 450 }, /* focalLength= */ 80));

  // 5. Beam splitter — diagonal line in the lower-left
  scene.addElement(new BeamSplitterElement({ x: 100, y: 540 }, { x: 300, y: 580 }, /* transRatio= */ 0.5));

  // ── Glass / Lenses (right half) ───────────────────────────────────────────

  // 6. Circular glass element
  scene.addElement(
    new CircleGlass(
      { x: 680, y: 120 }, // center
      { x: 745, y: 120 }, // point on boundary (radius ≈ 65 px)
      /* refIndex= */ 1.5,
    ),
  );

  // 7. Ideal thin lens — vertical segment with converging arrows
  scene.addElement(new IdealLens({ x: 860, y: 60 }, { x: 860, y: 200 }, /* focalLength= */ 120));

  // 8. Half-plane glass — horizontal boundary with hatching below it
  scene.addElement(new HalfPlaneGlass({ x: 560, y: 290 }, { x: 960, y: 290 }, /* refIndex= */ 1.5));

  // 9. Spherical biconvex lens — two circular arc surfaces
  //    axisP1/axisP2 define the optical axis; their distance sets the aperture.
  scene.addElement(
    new SphericalLens(
      { x: 680, y: 380 }, // axisP1
      { x: 680, y: 520 }, // axisP2 (axis runs vertically; aperture ≈ 140 px)
      /* r1= */ 120,
      /* r2= */ -120,
      /* refIndex= */ 1.5,
    ),
  );

  // 10. Triangular prism (polygon glass)
  scene.addElement(
    new PolygonGlass(
      [
        { x: 870, y: 350 },
        { x: 970, y: 530 },
        { x: 770, y: 530 },
      ],
      /* refIndex= */ 1.5,
    ),
  );

  return scene;
}

export class SimModel {
  /** The central optics scene containing all demo optical elements. */
  public readonly scene: OpticsScene;

  public constructor(public readonly tandem: Tandem) {
    this.scene = buildDemoScene();
  }

  public reset(): void {
    // Called when the user presses the reset-all button
  }

  public step(_dt: number): void {
    // Called every frame, with the time since the last frame in seconds
  }
}

opticsLab.register("SimModel", SimModel);
