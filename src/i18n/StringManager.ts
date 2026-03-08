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

  public getUIStrings(): {
    gridStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      gridStringProperty: this.stringProperties.ui.gridStringProperty,
    };
  }

  public getComponentStrings(): {
    pointSourceStringProperty: ReadOnlyProperty<string>;
    arcSourceStringProperty: ReadOnlyProperty<string>;
    beamStringProperty: ReadOnlyProperty<string>;
    beamSourceStringProperty: ReadOnlyProperty<string>;
    singleRayStringProperty: ReadOnlyProperty<string>;
    continuousSpectrumStringProperty: ReadOnlyProperty<string>;
    flatMirrorStringProperty: ReadOnlyProperty<string>;
    arcMirrorStringProperty: ReadOnlyProperty<string>;
    parabolicMirrorStringProperty: ReadOnlyProperty<string>;
    idealMirrorStringProperty: ReadOnlyProperty<string>;
    beamSplitterStringProperty: ReadOnlyProperty<string>;
    idealLensStringProperty: ReadOnlyProperty<string>;
    circleGlassStringProperty: ReadOnlyProperty<string>;
    sphericalLensStringProperty: ReadOnlyProperty<string>;
    prismStringProperty: ReadOnlyProperty<string>;
    glassPrismStringProperty: ReadOnlyProperty<string>;
    halfPlaneGlassStringProperty: ReadOnlyProperty<string>;
    lineBlockerStringProperty: ReadOnlyProperty<string>;
    apertureStringProperty: ReadOnlyProperty<string>;
  } {
    const c = this.stringProperties.components;
    return {
      pointSourceStringProperty: c.pointSourceStringProperty,
      arcSourceStringProperty: c.arcSourceStringProperty,
      beamStringProperty: c.beamStringProperty,
      beamSourceStringProperty: c.beamSourceStringProperty,
      singleRayStringProperty: c.singleRayStringProperty,
      continuousSpectrumStringProperty: c.continuousSpectrumStringProperty,
      flatMirrorStringProperty: c.flatMirrorStringProperty,
      arcMirrorStringProperty: c.arcMirrorStringProperty,
      parabolicMirrorStringProperty: c.parabolicMirrorStringProperty,
      idealMirrorStringProperty: c.idealMirrorStringProperty,
      beamSplitterStringProperty: c.beamSplitterStringProperty,
      idealLensStringProperty: c.idealLensStringProperty,
      circleGlassStringProperty: c.circleGlassStringProperty,
      sphericalLensStringProperty: c.sphericalLensStringProperty,
      prismStringProperty: c.prismStringProperty,
      glassPrismStringProperty: c.glassPrismStringProperty,
      halfPlaneGlassStringProperty: c.halfPlaneGlassStringProperty,
      lineBlockerStringProperty: c.lineBlockerStringProperty,
      apertureStringProperty: c.apertureStringProperty,
    };
  }

  public getPreferences(): {
    simulationStringProperty: ReadOnlyProperty<string>;
    snapToGridStringProperty: ReadOnlyProperty<string>;
    snapToGridDescriptionStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      simulationStringProperty: this.stringProperties.preferences.simulationStringProperty,
      snapToGridStringProperty: this.stringProperties.preferences.snapToGridStringProperty,
      snapToGridDescriptionStringProperty: this.stringProperties.preferences.snapToGridDescriptionStringProperty,
    };
  }

  public getInstructionsStrings(): {
    sections: {
      navigationStringProperty: ReadOnlyProperty<string>;
      parameterAdjustmentStringProperty: ReadOnlyProperty<string>;
      scenariosStringProperty: ReadOnlyProperty<string>;
      visibilityOptionsStringProperty: ReadOnlyProperty<string>;
    };
    objectSelection: {
      selectSourceStringProperty: ReadOnlyProperty<string>;
      selectObserverStringProperty: ReadOnlyProperty<string>;
      moveObjectStringProperty: ReadOnlyProperty<string>;
    };
    adjust: {
      frequencyStringProperty: ReadOnlyProperty<string>;
      soundSpeedStringProperty: ReadOnlyProperty<string>;
    };
    scenarioKeys: {
      freePlayStringProperty: ReadOnlyProperty<string>;
    };
    toggleMotionTrailsStringProperty: ReadOnlyProperty<string>;
    toggleMicrophoneStringProperty: ReadOnlyProperty<string>;
    controls: {
      toggleHelpStringProperty: ReadOnlyProperty<string>;
    };
    a11y: {
      objectSelection: {
        selectSourceStringProperty: ReadOnlyProperty<string>;
        selectObserverStringProperty: ReadOnlyProperty<string>;
        moveObjectStringProperty: ReadOnlyProperty<string>;
      };
      adjust: {
        frequencyStringProperty: ReadOnlyProperty<string>;
        soundSpeedStringProperty: ReadOnlyProperty<string>;
      };
      scenarioKeys: {
        freePlayStringProperty: ReadOnlyProperty<string>;
      };
      toggleMotionTrailsStringProperty: ReadOnlyProperty<string>;
      toggleMicrophoneStringProperty: ReadOnlyProperty<string>;
      controls: {
        toggleHelpStringProperty: ReadOnlyProperty<string>;
      };
    };
  } {
    const inst = this.stringProperties.instructions;
    return {
      sections: {
        navigationStringProperty: inst.sections.navigationStringProperty,
        parameterAdjustmentStringProperty: inst.sections.parameterAdjustmentStringProperty,
        scenariosStringProperty: inst.sections.scenariosStringProperty,
        visibilityOptionsStringProperty: inst.sections.visibilityOptionsStringProperty,
      },
      objectSelection: {
        selectSourceStringProperty: inst.objectSelection.selectSourceStringProperty,
        selectObserverStringProperty: inst.objectSelection.selectObserverStringProperty,
        moveObjectStringProperty: inst.objectSelection.moveObjectStringProperty,
      },
      adjust: {
        frequencyStringProperty: inst.adjust.frequencyStringProperty,
        soundSpeedStringProperty: inst.adjust.soundSpeedStringProperty,
      },
      scenarioKeys: {
        freePlayStringProperty: inst.scenarioKeys.freePlayStringProperty,
      },
      toggleMotionTrailsStringProperty: inst.toggleMotionTrailsStringProperty,
      toggleMicrophoneStringProperty: inst.toggleMicrophoneStringProperty,
      controls: {
        toggleHelpStringProperty: inst.controls.toggleHelpStringProperty,
      },
      a11y: {
        objectSelection: {
          selectSourceStringProperty: inst.a11y.objectSelection.selectSourceStringProperty,
          selectObserverStringProperty: inst.a11y.objectSelection.selectObserverStringProperty,
          moveObjectStringProperty: inst.a11y.objectSelection.moveObjectStringProperty,
        },
        adjust: {
          frequencyStringProperty: inst.a11y.adjust.frequencyStringProperty,
          soundSpeedStringProperty: inst.a11y.adjust.soundSpeedStringProperty,
        },
        scenarioKeys: {
          freePlayStringProperty: inst.a11y.scenarioKeys.freePlayStringProperty,
        },
        toggleMotionTrailsStringProperty: inst.a11y.toggleMotionTrailsStringProperty,
        toggleMicrophoneStringProperty: inst.a11y.toggleMicrophoneStringProperty,
        controls: {
          toggleHelpStringProperty: inst.a11y.controls.toggleHelpStringProperty,
        },
      },
    };
  }
}
