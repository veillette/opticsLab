/**
 * Query parameters for OpticsLab startup configuration.
 */

import { QueryStringMachine } from "scenerystack/query-string-machine";
import opticsLab from "../OpticsLabNamespace.js";

const opticsLabQueryParameters = QueryStringMachine.getAll({
  enableDemoAnimation: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },
});

opticsLab.register("opticsLabQueryParameters", opticsLabQueryParameters);

export default opticsLabQueryParameters;
