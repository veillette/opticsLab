import { RayTracingCommonModel } from "../common/model/SimModel.js";
import opticsLab from "../OpticsLabNamespace.js";

export class LabModel extends RayTracingCommonModel {}

opticsLab.register("LabModel", LabModel);
