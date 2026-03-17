import { RayTracingCommonView } from "../common/view/SimScreenView.js";
import opticsLab from "../OpticsLabNamespace.js";

export class LabScreenView extends RayTracingCommonView {}

opticsLab.register("LabScreenView", LabScreenView);
