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
    introStringProperty: ReadOnlyProperty<string>;
    labStringProperty: ReadOnlyProperty<string>;
    presetsStringProperty: ReadOnlyProperty<string>;
    diffractionStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      simStringProperty: this.stringProperties.screens.simStringProperty,
      introStringProperty: this.stringProperties.screens.introStringProperty,
      labStringProperty: this.stringProperties.screens.labStringProperty,
      presetsStringProperty: this.stringProperties.screens.presetsStringProperty,
      diffractionStringProperty: this.stringProperties.screens.diffractionStringProperty,
    };
  }

  public getUIStrings(): {
    gridStringProperty: ReadOnlyProperty<string>;
    toolsStringProperty: ReadOnlyProperty<string>;
    rayDensityStringProperty: ReadOnlyProperty<string>;
    measuringTapeStringProperty: ReadOnlyProperty<string>;
    protractorStringProperty: ReadOnlyProperty<string>;
    extendedRaysStringProperty: ReadOnlyProperty<string>;
    metersUnitStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      gridStringProperty: this.stringProperties.ui.gridStringProperty,
      toolsStringProperty: this.stringProperties.ui.toolsStringProperty,
      rayDensityStringProperty: this.stringProperties.ui.rayDensityStringProperty,
      measuringTapeStringProperty: this.stringProperties.ui.measuringTapeStringProperty,
      protractorStringProperty: this.stringProperties.ui.protractorStringProperty,
      extendedRaysStringProperty: this.stringProperties.ui.extendedRaysStringProperty,
      metersUnitStringProperty: this.stringProperties.ui.metersUnitStringProperty,
    };
  }

  public getControlStrings(): {
    wavelengthStringProperty: ReadOnlyProperty<string>;
    brightnessStringProperty: ReadOnlyProperty<string>;
    emissionAngleStringProperty: ReadOnlyProperty<string>;
    divergenceStringProperty: ReadOnlyProperty<string>;
    heightStringProperty: ReadOnlyProperty<string>;
    widthStringProperty: ReadOnlyProperty<string>;
    legLengthStringProperty: ReadOnlyProperty<string>;
    sizeStringProperty: ReadOnlyProperty<string>;
    lengthStringProperty: ReadOnlyProperty<string>;
    refractiveIndexStringProperty: ReadOnlyProperty<string>;
    focalLengthStringProperty: ReadOnlyProperty<string>;
    radiusOfCurvatureStringProperty: ReadOnlyProperty<string>;
    r1LeftSurfaceStringProperty: ReadOnlyProperty<string>;
    r2RightSurfaceStringProperty: ReadOnlyProperty<string>;
    r2RightRIPStringProperty: ReadOnlyProperty<string>;
    transmissionRatioStringProperty: ReadOnlyProperty<string>;
    linesDensityStringProperty: ReadOnlyProperty<string>;
    dutyCycleStringProperty: ReadOnlyProperty<string>;
    binsStringProperty: ReadOnlyProperty<string>;
  } {
    const ctrl = this.stringProperties.controls;
    return {
      wavelengthStringProperty: ctrl.wavelengthStringProperty,
      brightnessStringProperty: ctrl.brightnessStringProperty,
      emissionAngleStringProperty: ctrl.emissionAngleStringProperty,
      divergenceStringProperty: ctrl.divergenceStringProperty,
      heightStringProperty: ctrl.heightStringProperty,
      widthStringProperty: ctrl.widthStringProperty,
      legLengthStringProperty: ctrl.legLengthStringProperty,
      sizeStringProperty: ctrl.sizeStringProperty,
      lengthStringProperty: ctrl.lengthStringProperty,
      refractiveIndexStringProperty: ctrl.refractiveIndexStringProperty,
      focalLengthStringProperty: ctrl.focalLengthStringProperty,
      radiusOfCurvatureStringProperty: ctrl.radiusOfCurvatureStringProperty,
      r1LeftSurfaceStringProperty: ctrl.r1LeftSurfaceStringProperty,
      r2RightSurfaceStringProperty: ctrl.r2RightSurfaceStringProperty,
      r2RightRIPStringProperty: ctrl.r2RightRIPStringProperty,
      transmissionRatioStringProperty: ctrl.transmissionRatioStringProperty,
      linesDensityStringProperty: ctrl.linesDensityStringProperty,
      dutyCycleStringProperty: ctrl.dutyCycleStringProperty,
      binsStringProperty: ctrl.binsStringProperty,
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
    biconvexLensStringProperty: ReadOnlyProperty<string>;
    biconcaveLensStringProperty: ReadOnlyProperty<string>;
    planoConvexLensStringProperty: ReadOnlyProperty<string>;
    planoConcaveLensStringProperty: ReadOnlyProperty<string>;
    prismStringProperty: ReadOnlyProperty<string>;
    equilateralPrismStringProperty: ReadOnlyProperty<string>;
    rightAnglePrismStringProperty: ReadOnlyProperty<string>;
    porroPrismStringProperty: ReadOnlyProperty<string>;
    slabGlassStringProperty: ReadOnlyProperty<string>;
    parallelogramPrismStringProperty: ReadOnlyProperty<string>;
    dovePrismStringProperty: ReadOnlyProperty<string>;
    glassPrismStringProperty: ReadOnlyProperty<string>;
    halfPlaneGlassStringProperty: ReadOnlyProperty<string>;
    lineBlockerStringProperty: ReadOnlyProperty<string>;
    detectorStringProperty: ReadOnlyProperty<string>;
    apertureStringProperty: ReadOnlyProperty<string>;
    transmissionGratingStringProperty: ReadOnlyProperty<string>;
    reflectionGratingStringProperty: ReadOnlyProperty<string>;
    trackStringProperty: ReadOnlyProperty<string>;
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
      biconvexLensStringProperty: c.biconvexLensStringProperty,
      biconcaveLensStringProperty: c.biconcaveLensStringProperty,
      planoConvexLensStringProperty: c.planoConvexLensStringProperty,
      planoConcaveLensStringProperty: c.planoConcaveLensStringProperty,
      prismStringProperty: c.prismStringProperty,
      equilateralPrismStringProperty: c.equilateralPrismStringProperty,
      rightAnglePrismStringProperty: c.rightAnglePrismStringProperty,
      porroPrismStringProperty: c.porroPrismStringProperty,
      slabGlassStringProperty: c.slabGlassStringProperty,
      parallelogramPrismStringProperty: c.parallelogramPrismStringProperty,
      dovePrismStringProperty: c.dovePrismStringProperty,
      glassPrismStringProperty: c.glassPrismStringProperty,
      halfPlaneGlassStringProperty: c.halfPlaneGlassStringProperty,
      lineBlockerStringProperty: c.lineBlockerStringProperty,
      detectorStringProperty: c.detectorStringProperty,
      apertureStringProperty: c.apertureStringProperty,
      transmissionGratingStringProperty: c.transmissionGratingStringProperty,
      reflectionGratingStringProperty: c.reflectionGratingStringProperty,
      trackStringProperty: c.trackStringProperty,
    };
  }

  public getPreferences(): {
    simulationStringProperty: ReadOnlyProperty<string>;
    snapToGridStringProperty: ReadOnlyProperty<string>;
    snapToGridDescriptionStringProperty: ReadOnlyProperty<string>;
    gridSpacingStringProperty: ReadOnlyProperty<string>;
    gridSpacingDescriptionStringProperty: ReadOnlyProperty<string>;
    signConventionStringProperty: ReadOnlyProperty<string>;
    signConventionDescriptionStringProperty: ReadOnlyProperty<string>;
    newCartesianStringProperty: ReadOnlyProperty<string>;
    newCartesianDescriptionStringProperty: ReadOnlyProperty<string>;
    realIsPositiveStringProperty: ReadOnlyProperty<string>;
    realIsPositiveDescriptionStringProperty: ReadOnlyProperty<string>;
  } {
    const p = this.stringProperties.preferences;
    return {
      simulationStringProperty: p.simulationStringProperty,
      snapToGridStringProperty: p.snapToGridStringProperty,
      snapToGridDescriptionStringProperty: p.snapToGridDescriptionStringProperty,
      gridSpacingStringProperty: p.gridSpacingStringProperty,
      gridSpacingDescriptionStringProperty: p.gridSpacingDescriptionStringProperty,
      signConventionStringProperty: p.signConventionStringProperty,
      signConventionDescriptionStringProperty: p.signConventionDescriptionStringProperty,
      newCartesianStringProperty: p.newCartesianStringProperty,
      newCartesianDescriptionStringProperty: p.newCartesianDescriptionStringProperty,
      realIsPositiveStringProperty: p.realIsPositiveStringProperty,
      realIsPositiveDescriptionStringProperty: p.realIsPositiveDescriptionStringProperty,
    };
  }

  public getPresetsStrings(): {
    choosePresetStringProperty: ReadOnlyProperty<string>;
    emptyLabStringProperty: ReadOnlyProperty<string>;
    convexLensFocusStringProperty: ReadOnlyProperty<string>;
    mirrorReflectionStringProperty: ReadOnlyProperty<string>;
    prismRefractionStringProperty: ReadOnlyProperty<string>;
  } {
    const p = this.stringProperties.presets;
    return {
      choosePresetStringProperty: p.choosePresetStringProperty,
      emptyLabStringProperty: p.emptyLabStringProperty,
      convexLensFocusStringProperty: p.convexLensFocusStringProperty,
      mirrorReflectionStringProperty: p.mirrorReflectionStringProperty,
      prismRefractionStringProperty: p.prismRefractionStringProperty,
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
