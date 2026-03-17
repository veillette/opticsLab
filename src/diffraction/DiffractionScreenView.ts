import { RayTracingCommonView } from "../common/view/SimScreenView.js";
import opticsLab from "../OpticsLabNamespace.js";

export class DiffractionScreenView extends RayTracingCommonView {}

opticsLab.register("DiffractionScreenView", DiffractionScreenView);
