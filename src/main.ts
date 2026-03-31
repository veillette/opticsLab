/**
 * main.ts
 *
 * Entry point for the OpticsLab application. Initializes the simulation,
 * creates the screens, and starts the main event loop.
 */

// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import type { ComponentKey } from "./common/view/ComponentCarousel.js";
import { focalMarkersVisibleProperty } from "./common/view/FocalMarkersVisibleProperty.js";
import { handlesVisibleProperty } from "./common/view/HandlesVisibleProperty.js";
import { KeyboardShortcutsNode } from "./common/view/KeyboardShortcutsNode.js";
import { rayArrowsVisibleProperty } from "./common/view/RayArrowsVisibleProperty.js";
import { rayStubLengthPxProperty, rayStubsEnabledProperty } from "./common/view/RayStubsProperty.js";
import { DiffractionScreen } from "./diffraction/DiffractionScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { IntroScreen } from "./intro/IntroScreen.js";
import { LabScreen } from "./lab/LabScreen.js";
import OpticsLabColors from "./OpticsLabColors.js";
import opticsLab from "./OpticsLabNamespace.js";
import {
  createDiffractionScreenIcon,
  createIntroScreenIcon,
  createLabScreenIcon,
  createPresetsScreenIcon,
} from "./OpticsLabScreenIcons.js";
import {
  TANDEM_DIFFRACTION_SCREEN,
  TANDEM_INTRO_SCREEN,
  TANDEM_LAB_SCREEN,
  TANDEM_OPTICS_LAB_PREFERENCES,
  TANDEM_PRESETS_SCREEN,
} from "./OpticsLabStrings.js";
import { OpticsLabPreferencesModel } from "./preferences/OpticsLabPreferencesModel.js";
import { OpticsLabPreferencesNode } from "./preferences/OpticsLabPreferencesNode.js";
import opticsLabQueryParameters from "./preferences/opticsLabQueryParameters.js";
import { PresetsScreen } from "./presets/PresetsScreen.js";

onReadyToLaunch(() => {
  handlesVisibleProperty.value = opticsLabQueryParameters.showHandles;
  focalMarkersVisibleProperty.value = opticsLabQueryParameters.showFocalMarkers;
  rayArrowsVisibleProperty.value = opticsLabQueryParameters.showRayArrows;
  rayStubsEnabledProperty.value = opticsLabQueryParameters.showRayStubs;
  rayStubLengthPxProperty.value = opticsLabQueryParameters.rayStubLength;

  const stringManager = StringManager.getInstance();
  const opticsLabPreferences = new OpticsLabPreferencesModel(Tandem.ROOT.createTandem(TANDEM_OPTICS_LAB_PREFERENCES));
  const screenNames = stringManager.getScreenNames();

  const commonScreenOptions = {
    backgroundColorProperty: OpticsLabColors.backgroundColorProperty,
    createKeyboardHelpNode: () => new KeyboardShortcutsNode(),
    opticsLabPreferences,
  };

  // Components shared by non-diffraction screens (everything except gratings).
  const standardComponents: ComponentKey[] = [
    "beam",
    "singleRay",
    "continuousSpectrum",
    "arcSource",
    "pointSource",
    "sphericalLens",
    "biconvexLens",
    "biconcaveLens",
    "planoConvexLens",
    "planoConcaveLens",
    "idealLens",
    "circleGlass",
    "prism",
    "equilateralPrism",
    "rightAnglePrism",
    "porroPrism",
    "slabGlass",
    "parallelogramPrism",
    "dovePrism",
    "halfPlaneGlass",
    "flatMirror",
    "arcMirror",
    "idealMirror",
    "parabolicMirror",
    "lineBlocker",
    "detector",
    "aperture",
    "beamSplitter",
    "track",
    ...(opticsLabQueryParameters.enabledOpticalFiber ? ["fiberOptic" as ComponentKey] : []),
  ];

  // The diffraction screen adds gratings and a curated subset of other components.
  const diffractionComponents: ComponentKey[] = [
    "transmissionGrating",
    "reflectionGrating",
    "beam",
    "singleRay",
    "continuousSpectrum",
    "pointSource",
    "aperture",
    "detector",
    "flatMirror",
    "lineBlocker",
    "track",
  ];

  const screens = [
    new IntroScreen({
      name: screenNames.introStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_INTRO_SCREEN),
      carouselComponents: standardComponents,
      homeScreenIcon: createIntroScreenIcon(),
      ...commonScreenOptions,
    }),
    new LabScreen({
      name: screenNames.labStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_LAB_SCREEN),
      carouselComponents: standardComponents,
      homeScreenIcon: createLabScreenIcon(),
      ...commonScreenOptions,
    }),
    new PresetsScreen({
      name: screenNames.presetsStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_PRESETS_SCREEN),
      carouselComponents: standardComponents,
      homeScreenIcon: createPresetsScreenIcon(),
      ...commonScreenOptions,
    }),
    new DiffractionScreen({
      name: screenNames.diffractionStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_DIFFRACTION_SCREEN),
      carouselComponents: diffractionComponents,
      homeScreenIcon: createDiffractionScreenIcon(),
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
      inputOptions: {
        supportsGestureControl: true,
      },
      localizationOptions: {
        supportsDynamicLocale: true,
      },
    }),
  };

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, simOptions);
  opticsLab.register("sim", sim);
  sim.start();
});
