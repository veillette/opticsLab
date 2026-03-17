import { RayTracingCommonModel } from "../common/model/SimModel.js";
import opticsLab from "../OpticsLabNamespace.js";

export class DiffractionModel extends RayTracingCommonModel {}

opticsLab.register("DiffractionModel", DiffractionModel);
