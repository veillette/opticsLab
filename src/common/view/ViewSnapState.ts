/**
 * ViewSnapState.ts
 *
 * Singleton that holds snap-to-grid state shared by all translation drag
 * listeners. Centralises what was previously module-level mutable globals
 * in ViewHelpers.ts, making the dependency explicit and the singleton mockable.
 *
 * Lifecycle: SimScreenView calls setSnapToGrid() and setGridSpacingM() once
 * during construction; ViewHelpers reads from the singleton during drag events.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { GRID_SPACING_M } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";

class ViewSnapState {
  private _snapToGridProperty: TReadOnlyProperty<boolean> | null = null;
  private _gridSpacingM: number = GRID_SPACING_M;

  public get snapEnabled(): boolean {
    return this._snapToGridProperty?.value ?? false;
  }

  public get gridSpacingM(): number {
    return this._gridSpacingM;
  }

  public setSnapToGrid(prop: TReadOnlyProperty<boolean>): void {
    this._snapToGridProperty = prop;
  }

  public setGridSpacingM(spacing: number): void {
    this._gridSpacingM = spacing;
  }
}

export const viewSnapState = new ViewSnapState();

opticsLab.register("viewSnapState", viewSnapState);
