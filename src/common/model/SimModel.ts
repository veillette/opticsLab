import type { Tandem } from "scenerystack/tandem";
import opticsLab from "../../OpticsLabNamespace.js";
import opticsLabQueryParameters from "../../preferences/opticsLabQueryParameters.js";
import { DetectorElement } from "./detectors/DetectorElement.js";
import { OpticsScene } from "./optics/OpticsScene.js";

export class RayTracingCommonModel {
  /** The central optics scene containing all optical elements. */
  public readonly scene: OpticsScene;

  public constructor(public readonly tandem: Tandem) {
    this.scene = new OpticsScene(tandem.createTandem("scene"), {
      mode: opticsLabQueryParameters.extendedRays ? "extended" : "rays",
      rayDensity: opticsLabQueryParameters.rayDensity,
      showGrid: opticsLabQueryParameters.showGrid,
    });
  }

  public reset(): void {
    this.scene.resetAll();
  }

  public step(dt: number): void {
    for (const element of this.scene.getAllElements()) {
      if (element instanceof DetectorElement) {
        element.stepAcquisition(dt);
      }
    }
  }
}

opticsLab.register("RayTracingCommonModel", RayTracingCommonModel);
