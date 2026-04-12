/**
 * FiberOpticView.ts
 *
 * Scenery node for a FiberOpticElement.  Renders a curved ribbon waveguide
 * following the Catmull–Rom spline defined by five user-controllable points:
 *
 *   p1 → cp1 → cp2 → cp3 → p2
 *
 * Five visible drag handles let the user reshape and reposition the fiber:
 *
 *  • handle1 (p1)  – endpoint drag: moves the start anchor.
 *  • handle2 (p2)  – endpoint drag: moves the end anchor.
 *  • handle3 (cp1) – endpoint drag: reshapes the spline near the 1/4 point.
 *  • handle4 (cp2) – endpoint drag: reshapes the spline at the midpoint.
 *  • handle5 (cp3) – endpoint drag: reshapes the spline near the 3/4 point.
 *
 * The invisible body hit-path covers the full fiber area and exposes the
 * primary bodyDragListener used by the carousel forwarding mechanism.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { InteractiveHighlighting, Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors, { glassFill } from "../../../OpticsLabColors.js";
import { GLASS_STROKE_WIDTH } from "../../../OpticsLabConstants.js";
import opticsLab from "../../../OpticsLabNamespace.js";
import type { FiberOpticElement } from "../../model/fiber/FiberOpticElement.js";
import type { Point } from "../../model/optics/Geometry.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import { attachEndpointDrag, attachTranslationDrag, createHandle, type DragHandle } from "../ViewHelpers.js";

// ── Internal geometry helpers ─────────────────────────────────────────────────

/**
 * Builds a closed ribbon Shape in VIEW (pixel) space from spline samples.
 * Each sample has a model-space { point, tangent }.  We compute the
 * perpendicular unit normal, offset by radius r (in model units), then
 * transform both offset points to view space.
 */
function buildRibbonShape(
  samples: Array<{ point: Point; tangent: Point }>,
  r: number,
  mvt: ModelViewTransform2,
): Shape {
  if (samples.length < 2) {
    return new Shape();
  }

  const topV: Array<{ x: number; y: number }> = [];
  const botV: Array<{ x: number; y: number }> = [];

  for (const { point, tangent } of samples) {
    const tLen = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
    if (tLen < 1e-10) {
      continue;
    }
    // Normal in model space (90° CCW of tangent, y-up).
    const nx = -tangent.y / tLen;
    const ny = tangent.x / tLen;
    topV.push({
      x: mvt.modelToViewX(point.x + nx * r),
      y: mvt.modelToViewY(point.y + ny * r),
    });
    botV.push({
      x: mvt.modelToViewX(point.x - nx * r),
      y: mvt.modelToViewY(point.y - ny * r),
    });
  }

  if (topV.length < 2) {
    return new Shape();
  }

  const first = topV[0];
  if (!first) {
    return new Shape();
  }

  const shape = new Shape();
  shape.moveTo(first.x, first.y);
  for (let i = 1; i < topV.length; i++) {
    const v = topV[i];
    if (v) {
      shape.lineTo(v.x, v.y);
    }
  }
  for (let i = botV.length - 1; i >= 0; i--) {
    const v = botV[i];
    if (v) {
      shape.lineTo(v.x, v.y);
    }
  }
  shape.close();
  return shape;
}

// ── View class ────────────────────────────────────────────────────────────────

export class FiberOpticView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;

  private readonly claddingPath: Path;
  private readonly corePath: Path;
  private readonly bodyHitPath: Path;

  /** Endpoint handle at p1. */
  private readonly handle1: DragHandle;
  /** Endpoint handle at p2. */
  private readonly handle2: DragHandle;
  /** Spline control-point handle at cp1. */
  private readonly handle3: DragHandle;
  /** Spline control-point handle at cp2 (midpoint). */
  private readonly handle4: DragHandle;
  /** Spline control-point handle at cp3. */
  private readonly handle5: DragHandle;

  private readonly fiber: FiberOpticElement;
  private readonly modelViewTransform: ModelViewTransform2;
  public constructor(fiber: FiberOpticElement, modelViewTransform: ModelViewTransform2, tandem: Tandem) {
    super();
    this.fiber = fiber;
    this.modelViewTransform = modelViewTransform;

    // ── Outer cladding (glass physics boundary, visual background layer) ──
    this.claddingPath = new Path(null, {
      fill: glassFill(fiber.refIndex),
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: GLASS_STROKE_WIDTH,
      pickable: false,
    });

    // ── Inner core (visual only, amber/warm yellow) ────────────────────────
    this.corePath = new Path(null, {
      fill: OpticsLabColors.fiberCoreFillProperty,
      stroke: OpticsLabColors.fiberCoreStrokeProperty,
      lineWidth: 0.8,
      pickable: false,
    });

    // ── Invisible body hit area ────────────────────────────────────────────
    this.bodyHitPath = new (InteractiveHighlighting(Path))(null, {
      fill: OpticsLabColors.hitAreaFillProperty,
    });

    // ── Endpoint + control-point handles ──────────────────────────────────
    const rebuild = () => this.rebuild();

    this.handle1 = this._makeEndpointHandle(
      () => fiber.p1,
      (p) => {
        fiber.p1 = p;
      },
      rebuild,
      tandem.createTandem("handle1DragListener"),
    );

    this.handle2 = this._makeEndpointHandle(
      () => fiber.p2,
      (p) => {
        fiber.p2 = p;
      },
      rebuild,
      tandem.createTandem("handle2DragListener"),
    );

    this.handle3 = this._makeEndpointHandle(
      () => fiber.cp1,
      (p) => {
        fiber.cp1 = p;
      },
      rebuild,
      tandem.createTandem("handle3DragListener"),
    );

    this.handle4 = this._makeEndpointHandle(
      () => fiber.cp2,
      (p) => {
        fiber.cp2 = p;
      },
      rebuild,
      tandem.createTandem("handle4DragListener"),
    );

    this.handle5 = this._makeEndpointHandle(
      () => fiber.cp3,
      (p) => {
        fiber.cp3 = p;
      },
      rebuild,
      tandem.createTandem("handle5DragListener"),
    );

    // ── Scene graph ───────────────────────────────────────────────────────
    this.addChild(this.claddingPath);
    this.addChild(this.corePath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);
    this.addChild(this.handle4);
    this.addChild(this.handle5);

    this.rebuild();

    // ── Body drag listener (translates all 5 control points) ──────────────
    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      [
        {
          get: () => fiber.p1,
          set: (p) => {
            fiber.p1 = p;
          },
        },
        {
          get: () => fiber.cp1,
          set: (p) => {
            fiber.cp1 = p;
          },
        },
        {
          get: () => fiber.cp2,
          set: (p) => {
            fiber.cp2 = p;
          },
        },
        {
          get: () => fiber.cp3,
          set: (p) => {
            fiber.cp3 = p;
          },
        },
        {
          get: () => fiber.p2,
          set: (p) => {
            fiber.p2 = p;
          },
        },
      ],
      rebuild,
      modelViewTransform,
      tandem.createTandem("bodyDragListener"),
    );
  }

  /**
   * Creates an endpoint-drag handle whose model position is tracked by
   * getPoint/setPoint, and repositioned on every rebuild().
   */
  private _makeEndpointHandle(
    getPoint: () => Point,
    setPoint: (p: Point) => void,
    rebuild: () => void,
    tandem: Tandem,
  ): DragHandle {
    const handle = createHandle(getPoint(), this.modelViewTransform) as DragHandle;
    attachEndpointDrag(handle, getPoint, setPoint, rebuild, this.modelViewTransform, tandem);
    Object.assign(handle, {
      syncToModel: () => {
        const p = getPoint();
        handle.x = this.modelViewTransform.modelToViewX(p.x);
        handle.y = this.modelViewTransform.modelToViewY(p.y);
      },
    });
    return handle;
  }

  protected override _doRebuild(): void {
    // Rebuild the Glass polygon path from the current spline geometry.
    this.fiber.rebuildPath();

    const mvt = this.modelViewTransform;
    const { outerRadius, coreRadiusFraction } = this.fiber;
    const innerRadius = outerRadius * coreRadiusFraction;

    const samples = this.fiber.getSamples();

    this.claddingPath.shape = buildRibbonShape(samples, outerRadius, mvt);
    this.corePath.shape = buildRibbonShape(samples, innerRadius, mvt);
    this.bodyHitPath.shape = buildRibbonShape(samples, outerRadius, mvt);

    // Update cladding fill color when refIndex changes.
    this.claddingPath.fill = glassFill(this.fiber.refIndex);

    // Sync all handle positions.
    (this.handle1 as DragHandle & { syncToModel?(): void }).syncToModel?.();
    (this.handle2 as DragHandle & { syncToModel?(): void }).syncToModel?.();
    (this.handle3 as DragHandle & { syncToModel?(): void }).syncToModel?.();
    (this.handle4 as DragHandle & { syncToModel?(): void }).syncToModel?.();
    (this.handle5 as DragHandle & { syncToModel?(): void }).syncToModel?.();

    this.rebuildEmitter.emit();
  }
}

opticsLab.register("FiberOpticView", FiberOpticView);
