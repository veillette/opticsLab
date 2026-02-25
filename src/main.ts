/**
 * main.ts
 *
 * Entry point for the OpticsLab application. Initializes the simulation,
 * creates the screen, and starts the main event loop.
 */

// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import OpticsLabColors from "./OpticsLabColors.js";
import opticsLab from "./OpticsLabNamespace.js";
import { OpticsLabPreferencesModel } from "./preferences/OpticsLabPreferencesModel.js";
import { OpticsLabPreferencesNode } from "./preferences/OpticsLabPreferencesNode.js";
import { SimScreen } from "./rayTracing/SimScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const opticsLabPreferences = new OpticsLabPreferencesModel(Tandem.ROOT.createTandem("opticsLabPreferences"));

  const screens = [
    new SimScreen({
      tandem: Tandem.ROOT.createTandem("simScreen"),
      backgroundColorProperty: OpticsLabColors.backgroundColorProperty,
      opticsLabPreferences,
    }),
  ];

  const simOptions = {
    webgl: true,
    preferencesModel: new PreferencesModel({
      visualOptions: {
        supportsProjectorMode: true,
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new OpticsLabPreferencesNode(opticsLabPreferences, tandem),
          },
        ],
      },
    }),
  };

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, simOptions);
  opticsLab.register("sim", sim);
  sim.start();
});
