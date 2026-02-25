/**
 * OpticsLabNamespace.ts
 *
 * Creates and exports the global opticsLab namespace for registering tandem-tracked singletons.
 */

import { Namespace } from "scenerystack/phet-core";

const opticsLab = new Namespace("opticsLab");
opticsLab.register("opticsLab", opticsLab);
export default opticsLab;
