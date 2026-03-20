/**
 * TrackRegistry.ts
 *
 * Singleton registry of active Track elements. Used by the drag-snap logic
 * in ViewHelpers to find nearby tracks and project element positions onto them.
 */

import type { Point } from "../model/optics/Geometry.js";

export interface TrackDescriptor {
  getP1: () => Point;
  getP2: () => Point;
}

class TrackRegistryImpl {
  private readonly tracks = new Map<string, TrackDescriptor>();

  public register(id: string, getP1: () => Point, getP2: () => Point): void {
    this.tracks.set(id, { getP1, getP2 });
  }

  public unregister(id: string): void {
    this.tracks.delete(id);
  }

  public getAllTracks(): ReadonlyArray<{ id: string; p1: Point; p2: Point }> {
    const result: Array<{ id: string; p1: Point; p2: Point }> = [];
    for (const [id, desc] of this.tracks) {
      result.push({ id, p1: desc.getP1(), p2: desc.getP2() });
    }
    return result;
  }
}

export const trackRegistry = new TrackRegistryImpl();
