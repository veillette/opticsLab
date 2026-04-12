/**
 * SpatialIndex.ts
 *
 * A uniform-grid spatial hash for accelerating ray–element intersection tests.
 * Each element is inserted into every grid cell its bounding box overlaps.
 * When querying a ray, only cells along the ray path are visited and the
 * candidate set is deduplicated, reducing intersection tests from O(E) to
 * O(1) amortized per ray in typical scenes.
 *
 * Elements with infinite bounds (e.g. HalfPlaneGlass) are stored in a
 * separate "unbounded" list and always included in every query.
 */

import type { Point } from "./Geometry.js";
import type { OpticalElement } from "./OpticsTypes.js";

/** Default cell size in model units (metres). */
const DEFAULT_CELL_SIZE = 2.0;

/**
 * Maximum number of cells to traverse along a ray before falling back to
 * the full element list. Prevents degenerate rays from traversing the
 * entire grid.
 */
const MAX_TRAVERSAL_STEPS = 200;

export class SpatialIndex {
  private readonly cellSize: number;
  private readonly invCellSize: number;
  private readonly grid = new Map<number, OpticalElement[]>();
  /** Elements with infinite or degenerate bounds that must always be tested. */
  private readonly unbounded: OpticalElement[] = [];
  /** Total number of finite-bounded elements in the index. */
  private finiteCount = 0;
  /** Grid bounds (min/max cell coordinates) for ray traversal clamping. */
  private gridMinCX = 0;
  private gridMinCY = 0;
  private gridMaxCX = 0;
  private gridMaxCY = 0;

  public constructor(elements: OpticalElement[], cellSize = DEFAULT_CELL_SIZE) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
    this.build(elements);
  }

  /** Number of finite-bounded elements in the index. */
  public get size(): number {
    return this.finiteCount;
  }

  private cellKey(cx: number, cy: number): number {
    // Cantor-style pairing; shift to positive range to avoid negative-hash issues.
    // 20_000 is well above any expected grid extent.
    const a = cx + 10_000;
    const b = cy + 10_000;
    return a * 20_001 + b;
  }

  private build(elements: OpticalElement[]): void {
    let minCX = Infinity;
    let minCY = Infinity;
    let maxCX = -Infinity;
    let maxCY = -Infinity;

    for (const el of elements) {
      const b = el.getBounds();

      if (!(Number.isFinite(b.minX) && Number.isFinite(b.maxX) && Number.isFinite(b.minY) && Number.isFinite(b.maxY))) {
        this.unbounded.push(el);
        continue;
      }

      this.finiteCount++;
      const cxMin = Math.floor(b.minX * this.invCellSize);
      const cyMin = Math.floor(b.minY * this.invCellSize);
      const cxMax = Math.floor(b.maxX * this.invCellSize);
      const cyMax = Math.floor(b.maxY * this.invCellSize);

      if (cxMin < minCX) {
        minCX = cxMin;
      }
      if (cyMin < minCY) {
        minCY = cyMin;
      }
      if (cxMax > maxCX) {
        maxCX = cxMax;
      }
      if (cyMax > maxCY) {
        maxCY = cyMax;
      }

      for (let cx = cxMin; cx <= cxMax; cx++) {
        for (let cy = cyMin; cy <= cyMax; cy++) {
          const key = this.cellKey(cx, cy);
          let list = this.grid.get(key);
          if (!list) {
            list = [];
            this.grid.set(key, list);
          }
          list.push(el);
        }
      }
    }

    this.gridMinCX = Number.isFinite(minCX) ? minCX : 0;
    this.gridMinCY = Number.isFinite(minCY) ? minCY : 0;
    this.gridMaxCX = Number.isFinite(maxCX) ? maxCX : 0;
    this.gridMaxCY = Number.isFinite(maxCY) ? maxCY : 0;
  }

  /** Collect all finite-bounded elements (for the fast path with few elements). */
  private getAllElements(): OpticalElement[] {
    // Use a Set for O(1) deduplication instead of the previous O(n²) all.includes() scan.
    const seen = new Set<OpticalElement>(this.unbounded);
    for (const list of this.grid.values()) {
      for (const el of list) {
        seen.add(el);
      }
    }
    return [...seen];
  }

  /** Collect elements in a single grid cell into the result set. */
  private collectCell(cx: number, cy: number, seen: Set<string>, result: OpticalElement[]): void {
    const key = this.cellKey(cx, cy);
    const list = this.grid.get(key);
    if (list) {
      for (const el of list) {
        if (!seen.has(el.id)) {
          seen.add(el.id);
          result.push(el);
        }
      }
    }
  }

  /** Whether the cell coordinate is outside the grid in the given step direction. */
  private isOutOfGrid(cx: number, cy: number, stepX: number, stepY: number): boolean {
    const pastX = (stepX > 0 && cx > this.gridMaxCX) || (stepX < 0 && cx < this.gridMinCX);
    const pastY = (stepY > 0 && cy > this.gridMaxCY) || (stepY < 0 && cy < this.gridMinCY);
    return pastX || pastY;
  }

  /** Whether a cell coordinate is within the grid extent. */
  private isInGrid(cx: number, cy: number): boolean {
    return cx >= this.gridMinCX && cx <= this.gridMaxCX && cy >= this.gridMinCY && cy <= this.gridMaxCY;
  }

  /** Compute DDA axis parameters: initial tMax and tDelta for one axis. */
  private static ddaAxis(
    originCoord: number,
    dirCoord: number,
    cellCoord: number,
    cellSize: number,
  ): { tMax: number; tDelta: number; step: number } {
    if (dirCoord > 0) {
      const nextBoundary = (cellCoord + 1) * cellSize;
      return { tMax: (nextBoundary - originCoord) / dirCoord, tDelta: cellSize / dirCoord, step: 1 };
    }
    if (dirCoord < 0) {
      const nextBoundary = cellCoord * cellSize;
      return { tMax: (nextBoundary - originCoord) / dirCoord, tDelta: -cellSize / dirCoord, step: -1 };
    }
    return { tMax: Infinity, tDelta: Infinity, step: 0 };
  }

  /**
   * Query elements whose bounding boxes a ray might intersect.
   * Uses 2D DDA (Digital Differential Analyzer) grid traversal.
   *
   * Returns a deduplicated array of candidate elements (including unbounded ones).
   */
  public query(origin: Point, direction: Point): OpticalElement[] {
    if (this.finiteCount <= 4) {
      return this.getAllElements();
    }

    const seen = new Set<string>();
    const result: OpticalElement[] = [...this.unbounded];
    for (const el of this.unbounded) {
      seen.add(el.id);
    }

    const inv = this.invCellSize;
    let cx = Math.floor(origin.x * inv);
    let cy = Math.floor(origin.y * inv);

    const xAxis = SpatialIndex.ddaAxis(origin.x, direction.x, cx, this.cellSize);
    const yAxis = SpatialIndex.ddaAxis(origin.y, direction.y, cy, this.cellSize);
    let tMaxX = xAxis.tMax;
    let tMaxY = yAxis.tMax;

    for (let step = 0; step < MAX_TRAVERSAL_STEPS; step++) {
      if (this.isInGrid(cx, cy)) {
        this.collectCell(cx, cy, seen, result);
      } else if (this.isOutOfGrid(cx, cy, xAxis.step, yAxis.step)) {
        break;
      }

      if (tMaxX < tMaxY) {
        cx += xAxis.step;
        tMaxX += xAxis.tDelta;
      } else {
        cy += yAxis.step;
        tMaxY += yAxis.tDelta;
      }
    }

    return result;
  }
}
