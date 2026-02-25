/**
 * StringManager.ts
 *
 * Centralizes string management for OpticsLab.
 * Provides access to localized strings for all components.
 */

import { LocalizedString, type ReadOnlyProperty } from "scenerystack";
import opticsLab from "../OpticsLabNamespace.js";
import stringsEn from "./strings_en.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
type EnMatchesFr = typeof stringsEn extends typeof stringsFr ? true : never;
type FrMatchesEn = typeof stringsFr extends typeof stringsEn ? true : never;
declare const _parity: EnMatchesFr & FrMatchesEn;

export class StringManager {
  private static instance: StringManager;
  private readonly stringProperties;

  private constructor() {
    this.stringProperties = LocalizedString.getNestedStringProperties({
      en: stringsEn,
      fr: stringsFr,
    });
  }

  public static getInstance(): StringManager {
    if (!StringManager.instance) {
      StringManager.instance = new StringManager();
      opticsLab.register("StringManager", StringManager.instance);
    }
    return StringManager.instance;
  }

  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return this.stringProperties.titleStringProperty;
  }

  public getScreenNames(): {
    simStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      simStringProperty: this.stringProperties.screens.simStringProperty,
    };
  }

  public getPreferences(): {
    simulationStringProperty: ReadOnlyProperty<string>;
    enableDemoAnimationStringProperty: ReadOnlyProperty<string>;
    enableDemoAnimationDescriptionStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      simulationStringProperty: this.stringProperties.preferences.simulationStringProperty,
      enableDemoAnimationStringProperty: this.stringProperties.preferences.enableDemoAnimationStringProperty,
      enableDemoAnimationDescriptionStringProperty:
        this.stringProperties.preferences.enableDemoAnimationDescriptionStringProperty,
    };
  }
}
