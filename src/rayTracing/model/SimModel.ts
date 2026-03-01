import type { Tandem } from "scenerystack/tandem";
import opticsLab from "../../OpticsLabNamespace.js";
import { OpticsScene } from "./optics/OpticsScene.js";

export class SimModel {
  /** The central optics scene containing all optical elements. */
  public readonly scene: OpticsScene;

  public constructor(public readonly tandem: Tandem) {
    this.scene = new OpticsScene();
  }

  public reset(): void {
    this.scene.clearElements();
  }

  public step(_dt: number): void {
    // Called every frame, with the time since the last frame in seconds
  }
}

opticsLab.register("SimModel", SimModel);
