/**
 * CommandHistory.ts
 *
 * A lightweight Command pattern for undo/redo support.
 *
 * Commands are discrete, reversible operations on the scene model. Each
 * command is pushed onto a history stack; undo() pops it and reverses the
 * effect; redo() re-applies it.
 *
 * Currently wired into OpticsScene.addElement() and removeElement() so that
 * adding/removing optical elements is always undoable.  Property-level edits
 * can be wrapped with CommandHistory.execute(new EditPropertyCommand(...))
 * when finer-grained undo is needed.
 *
 * The history is capped at MAX_HISTORY_SIZE to bound memory use.
 */

export const MAX_HISTORY_SIZE = 100;

/** A discrete, reversible operation. */
export interface SceneCommand {
  /** Apply (or re-apply) this command. */
  execute(): void;
  /** Reverse the effect of execute(). */
  undo(): void;
  /** Human-readable label for debugging / future UI. */
  readonly description: string;
}

export class CommandHistory {
  private readonly undoStack: SceneCommand[] = [];
  private readonly redoStack: SceneCommand[] = [];

  /** Execute a command and push it onto the undo stack. Clears redo history. */
  public execute(command: SceneCommand): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > MAX_HISTORY_SIZE) {
      this.undoStack.shift();
    }
    // Any new action invalidates the redo branch.
    this.redoStack.length = 0;
  }

  /** Undo the most recent command. No-op when the undo stack is empty. */
  public undo(): void {
    const command = this.undoStack.pop();
    if (!command) {
      return;
    }
    command.undo();
    this.redoStack.push(command);
  }

  /** Redo the most recently undone command. No-op when the redo stack is empty. */
  public redo(): void {
    const command = this.redoStack.pop();
    if (!command) {
      return;
    }
    command.execute();
    this.undoStack.push(command);
  }

  public get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Clear all history (e.g. on scene reset). */
  public clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
