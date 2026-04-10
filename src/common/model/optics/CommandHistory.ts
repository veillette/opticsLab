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

  /**
   * Execute a command and push it onto the undo stack. Clears redo history.
   *
   * Redo is cleared *before* command.execute() so that a failed execute()
   * leaves the stacks in a consistent state (no orphaned redo entries for
   * the abandoned branch).  If execute() throws, the command is never pushed
   * to undoStack, so any partial side effects cannot be undone via history —
   * callers should catch the re-thrown error and surface it to the user.
   */
  public execute(command: SceneCommand): void {
    this.redoStack.length = 0;
    command.execute(); // throws? command stays off undoStack — caller handles error
    this.undoStack.push(command);
    if (this.undoStack.length > MAX_HISTORY_SIZE) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the most recent command. No-op when the undo stack is empty.
   *
   * Uses peek-then-act: the command is not removed from undoStack until
   * command.undo() succeeds.  If undo() throws, the command remains on
   * undoStack (not pushed to redoStack), so the scene stays consistent.
   */
  public undo(): void {
    const command = this.undoStack[this.undoStack.length - 1];
    if (!command) {
      return;
    }
    command.undo(); // throws? command stays on undoStack — caller handles error
    this.undoStack.pop();
    this.redoStack.push(command);
  }

  /**
   * Redo the most recently undone command. No-op when the redo stack is empty.
   *
   * Uses peek-then-act: the command is not removed from redoStack until
   * command.execute() succeeds.  If execute() throws, the command remains on
   * redoStack (not pushed to undoStack), so the scene stays consistent.
   */
  public redo(): void {
    const command = this.redoStack[this.redoStack.length - 1];
    if (!command) {
      return;
    }
    command.execute(); // throws? command stays on redoStack — caller handles error
    this.redoStack.pop();
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
