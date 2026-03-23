import { RayTracingCommonModel } from "../common/model/SimModel.js";
import opticsLab from "../OpticsLabNamespace.js";

/**
 * Diffraction screen uses the same ray-tracing scene as other lab screens.
 * For PhET-iO, screen-specific model properties can follow the CCK pattern:
 * `tandem.createTandem( 'someProperty' )` or `Tandem.OPT_OUT` when a control exists only on other screens.
 */
export class DiffractionModel extends RayTracingCommonModel {}

opticsLab.register("DiffractionModel", DiffractionModel);
