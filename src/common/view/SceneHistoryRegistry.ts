/**
 * SceneHistoryRegistry.ts
 *
 * Module-level singleton that gives view helpers (ViewHelpers.ts,
 * EditControlHelpers.ts) access to the scene's CommandHistory without
 * threading the reference through every call site.
 *
 * Lifecycle:
 *   SimScreenView calls setHistory(model.scene.history) during construction.
 *   Drag and slider helpers call sceneHistoryRegistry.history to get the
 *   CommandHistory instance (null-safe: no-op when history is not set).
 *
 * Pattern mirrors ViewSnapState.ts and TrackRegistry.ts.
 */

import opticsLab from "../../OpticsLabNamespace.js";
import type { CommandHistory } from "../model/optics/CommandHistory.js";

class SceneHistoryRegistryImpl {
  private _history: CommandHistory | null = null;

  /** Called once by SimScreenView during construction. */
  public setHistory(history: CommandHistory | null): void {
    this._history = history;
  }

  /** Returns the active CommandHistory, or null when not wired up. */
  public get history(): CommandHistory | null {
    return this._history;
  }
}

export const sceneHistoryRegistry = new SceneHistoryRegistryImpl();

opticsLab.register("sceneHistoryRegistry", sceneHistoryRegistry);
