/**
 * main.ts
 *
 * Entry point for the OpticsLab application. Initializes the simulation,
 * creates the screens, and starts the main event loop.
 */

// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { Bounds2, Property } from "scenerystack";
import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { KeyboardShortcutsNode } from "./common/view/KeyboardShortcutsNode.js";
import { DiffractionScreen } from "./diffraction/DiffractionScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { IntroScreen } from "./intro/IntroScreen.js";
import { LabScreen } from "./lab/LabScreen.js";
import OpticsLabColors from "./OpticsLabColors.js";
import opticsLab from "./OpticsLabNamespace.js";
import { OpticsLabPreferencesModel } from "./preferences/OpticsLabPreferencesModel.js";
import { OpticsLabPreferencesNode } from "./preferences/OpticsLabPreferencesNode.js";
import { PresetsScreen } from "./presets/PresetsScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const opticsLabPreferences = new OpticsLabPreferencesModel(Tandem.ROOT.createTandem("opticsLabPreferences"));
  const screenNames = stringManager.getScreenNames();

  const keyboardHelpNode = new KeyboardShortcutsNode({
    visibleProperty: new Property(true),
    layoutBounds: new Bounds2(0, 0, 1, 1),
  });

  const commonScreenOptions = {
    backgroundColorProperty: OpticsLabColors.backgroundColorProperty,
    createKeyboardHelpNode: () => keyboardHelpNode,
    opticsLabPreferences,
  };

  const screens = [
    new IntroScreen({
      name: screenNames.introStringProperty,
      tandem: Tandem.ROOT.createTandem("introScreen"),
      ...commonScreenOptions,
    }),
    new LabScreen({
      name: screenNames.labStringProperty,
      tandem: Tandem.ROOT.createTandem("labScreen"),
      ...commonScreenOptions,
    }),
    new PresetsScreen({
      name: screenNames.presetsStringProperty,
      tandem: Tandem.ROOT.createTandem("presetsScreen"),
      ...commonScreenOptions,
    }),
    new DiffractionScreen({
      name: screenNames.diffractionStringProperty,
      tandem: Tandem.ROOT.createTandem("diffractionScreen"),
      ...commonScreenOptions,
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
