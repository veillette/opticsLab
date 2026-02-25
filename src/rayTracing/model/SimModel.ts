import type { Tandem } from "scenerystack/tandem";
import opticsLab from "../../OpticsLabNamespace.js";

export class SimModel {
  public constructor(public readonly tandem: Tandem) {}

  public reset(): void {
    // Called when the user presses the reset-all button
  }

  public step(_dt: number): void {
    // Called every frame, with the time since the last frame in seconds
  }
}

opticsLab.register("SimModel", SimModel);
