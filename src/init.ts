import { init, madeWithSceneryStackSplashDataURI } from "scenerystack/init";
import { BRAND_ID, SIMULATION_NAME, SIMULATION_VERSION } from "./OpticsLabStrings.js";

// Initialize values that will be used at import-time by other modules.
// This needs to happen first, so we have init.ts => assert.ts => splash.ts => brand.ts => everything else (in main.ts)
init({
  // Internal name of the simulation.
  name: SIMULATION_NAME,

  // Version (will be shown in the About dialog)
  version: SIMULATION_VERSION,

  // The brand name used (should be the same as in brand.ts)
  brand: BRAND_ID,

  // Should be one of the keys from https://github.com/phetsims/babel/blob/main/localeData.json
  // Can be omitted, will default to 'en'
  locale: "en",

  // List of locales that are supported (and can be switched between in the simulation while running)
  availableLocales: ["en", "fr"],

  // Image to show while loading the simulation. Can be any image URL.
  splashDataURI: madeWithSceneryStackSplashDataURI,

  allowLocaleSwitching: true,

  // Required when supportsProjectorMode: true is used in PreferencesModel
  colorProfiles: ["default", "projector"],
});
