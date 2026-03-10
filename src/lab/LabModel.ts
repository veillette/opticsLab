import type { Tandem } from "scenerystack/tandem";
import { RayTracingCommonModel } from "../common/model/SimModel.js";
import opticsLab from "../OpticsLabNamespace.js";

export class LabModel extends RayTracingCommonModel {
  public constructor(tandem: Tandem) {
    super(tandem);
  }
}

opticsLab.register("LabModel", LabModel);
