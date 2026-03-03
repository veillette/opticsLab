/**
 * Query parameters for OpticsLab startup configuration.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import opticsLab from "../OpticsLabNamespace.js";

const opticsLabQueryParameters = QueryStringMachine.getAll({
  /*
   add optical Fiber to the carrousel
   */
  enabledOpticalFiber: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },

  /**
   * The number of steps a light ray is allowed to reflect/refract before it is considered to be lost.
   */
  maximumLightRayDepth: {
    type: "number" as const,
    defaultValue: 50,
    public: true,
  },

  // Whether components snap to grid.
  snapToGrid: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },
});

opticsLab.register("opticsLabQueryParameters", opticsLabQueryParameters);

// Log query parameters
logGlobal("phet.chipper.queryParameters");
logGlobal("phet.opticsLab.opticsLabQueryParameters");

export default opticsLabQueryParameters;
