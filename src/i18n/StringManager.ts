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
    showHandlesStringProperty: ReadOnlyProperty<string>;
    focalMarkersStringProperty: ReadOnlyProperty<string>;
    metersUnitStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      gridStringProperty: this.stringProperties.ui.gridStringProperty,
      toolsStringProperty: this.stringProperties.ui.toolsStringProperty,
      rayDensityStringProperty: this.stringProperties.ui.rayDensityStringProperty,
      measuringTapeStringProperty: this.stringProperties.ui.measuringTapeStringProperty,
      protractorStringProperty: this.stringProperties.ui.protractorStringProperty,
      extendedRaysStringProperty: this.stringProperties.ui.extendedRaysStringProperty,
      showHandlesStringProperty: this.stringProperties.ui.showHandlesStringProperty,
      focalMarkersStringProperty: this.stringProperties.ui.focalMarkersStringProperty,
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
    curvatureStringProperty: ReadOnlyProperty<string>;
    r1LeftSurfaceStringProperty: ReadOnlyProperty<string>;
    r2RightSurfaceStringProperty: ReadOnlyProperty<string>;
    r2RightRIPStringProperty: ReadOnlyProperty<string>;
    kappa1LeftSurfaceStringProperty: ReadOnlyProperty<string>;
    kappa2RightSurfaceStringProperty: ReadOnlyProperty<string>;
    kappa2RightRIPStringProperty: ReadOnlyProperty<string>;
    transmissionRatioStringProperty: ReadOnlyProperty<string>;
    linesDensityStringProperty: ReadOnlyProperty<string>;
    dutyCycleStringProperty: ReadOnlyProperty<string>;
    binsStringProperty: ReadOnlyProperty<string>;
    apertureSizeStringProperty: ReadOnlyProperty<string>;
  } {
    const controlStrings = this.stringProperties.controls;
    return {
      wavelengthStringProperty: controlStrings.wavelengthStringProperty,
      brightnessStringProperty: controlStrings.brightnessStringProperty,
      emissionAngleStringProperty: controlStrings.emissionAngleStringProperty,
      divergenceStringProperty: controlStrings.divergenceStringProperty,
      heightStringProperty: controlStrings.heightStringProperty,
      widthStringProperty: controlStrings.widthStringProperty,
      legLengthStringProperty: controlStrings.legLengthStringProperty,
      sizeStringProperty: controlStrings.sizeStringProperty,
      lengthStringProperty: controlStrings.lengthStringProperty,
      refractiveIndexStringProperty: controlStrings.refractiveIndexStringProperty,
      focalLengthStringProperty: controlStrings.focalLengthStringProperty,
      radiusOfCurvatureStringProperty: controlStrings.radiusOfCurvatureStringProperty,
      curvatureStringProperty: controlStrings.curvatureStringProperty,
      r1LeftSurfaceStringProperty: controlStrings.r1LeftSurfaceStringProperty,
      r2RightSurfaceStringProperty: controlStrings.r2RightSurfaceStringProperty,
      r2RightRIPStringProperty: controlStrings.r2RightRIPStringProperty,
      kappa1LeftSurfaceStringProperty: controlStrings.kappa1LeftSurfaceStringProperty,
      kappa2RightSurfaceStringProperty: controlStrings.kappa2RightSurfaceStringProperty,
      kappa2RightRIPStringProperty: controlStrings.kappa2RightRIPStringProperty,
      transmissionRatioStringProperty: controlStrings.transmissionRatioStringProperty,
      linesDensityStringProperty: controlStrings.linesDensityStringProperty,
      dutyCycleStringProperty: controlStrings.dutyCycleStringProperty,
      binsStringProperty: controlStrings.binsStringProperty,
      apertureSizeStringProperty: controlStrings.apertureSizeStringProperty,
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
    aperturedMirrorStringProperty: ReadOnlyProperty<string>;
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
      aperturedMirrorStringProperty: c.aperturedMirrorStringProperty,
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
    partialReflectionStringProperty: ReadOnlyProperty<string>;
    partialReflectionDescriptionStringProperty: ReadOnlyProperty<string>;
    curvatureDisplayStringProperty: ReadOnlyProperty<string>;
    curvatureDisplayDescriptionStringProperty: ReadOnlyProperty<string>;
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
      partialReflectionStringProperty: p.partialReflectionStringProperty,
      partialReflectionDescriptionStringProperty: p.partialReflectionDescriptionStringProperty,
      curvatureDisplayStringProperty: p.curvatureDisplayStringProperty,
      curvatureDisplayDescriptionStringProperty: p.curvatureDisplayDescriptionStringProperty,
    };
  }

  public getPresetsStrings(): {
    choosePresetStringProperty: ReadOnlyProperty<string>;
    emptyLabStringProperty: ReadOnlyProperty<string>;
    convexLensFocusStringProperty: ReadOnlyProperty<string>;
    mirrorReflectionStringProperty: ReadOnlyProperty<string>;
    prismRefractionStringProperty: ReadOnlyProperty<string>;
    biconcaveDivergingStringProperty: ReadOnlyProperty<string>;
    planoConvexFocusStringProperty: ReadOnlyProperty<string>;
    parabolicMirrorFocusStringProperty: ReadOnlyProperty<string>;
    beamSplitterStringProperty: ReadOnlyProperty<string>;
    glassSlabObliqueStringProperty: ReadOnlyProperty<string>;
    microscopeStringProperty: ReadOnlyProperty<string>;
    telescopeStringProperty: ReadOnlyProperty<string>;
  } {
    const p = this.stringProperties.presets;
    return {
      choosePresetStringProperty: p.choosePresetStringProperty,
      emptyLabStringProperty: p.emptyLabStringProperty,
      convexLensFocusStringProperty: p.convexLensFocusStringProperty,
      mirrorReflectionStringProperty: p.mirrorReflectionStringProperty,
      prismRefractionStringProperty: p.prismRefractionStringProperty,
      biconcaveDivergingStringProperty: p.biconcaveDivergingStringProperty,
      planoConvexFocusStringProperty: p.planoConvexFocusStringProperty,
      parabolicMirrorFocusStringProperty: p.parabolicMirrorFocusStringProperty,
      beamSplitterStringProperty: p.beamSplitterStringProperty,
      glassSlabObliqueStringProperty: p.glassSlabObliqueStringProperty,
      microscopeStringProperty: p.microscopeStringProperty,
      telescopeStringProperty: p.telescopeStringProperty,
    };
  }

  public getInstructionsStrings(): {
    sections: {
      parameterAdjustmentStringProperty: ReadOnlyProperty<string>;
      simHelpStringProperty: ReadOnlyProperty<string>;
    };
    adjust: {
      removeSelectedElementStringProperty: ReadOnlyProperty<string>;
      stepFocusedControlStringProperty: ReadOnlyProperty<string>;
    };
    controls: {
      toggleHelpStringProperty: ReadOnlyProperty<string>;
    };
    a11y: {
      adjust: {
        removeSelectedElementStringProperty: ReadOnlyProperty<string>;
        stepFocusedControlStringProperty: ReadOnlyProperty<string>;
      };
      controls: {
        toggleHelpStringProperty: ReadOnlyProperty<string>;
      };
    };
  } {
    const instructionStrings = this.stringProperties.instructions;
    return {
      sections: {
        parameterAdjustmentStringProperty: instructionStrings.sections.parameterAdjustmentStringProperty,
        simHelpStringProperty: instructionStrings.sections.simHelpStringProperty,
      },
      adjust: {
        removeSelectedElementStringProperty: instructionStrings.adjust.removeSelectedElementStringProperty,
        stepFocusedControlStringProperty: instructionStrings.adjust.stepFocusedControlStringProperty,
      },
      controls: {
        toggleHelpStringProperty: instructionStrings.controls.toggleHelpStringProperty,
      },
      a11y: {
        adjust: {
          removeSelectedElementStringProperty: instructionStrings.a11y.adjust.removeSelectedElementStringProperty,
          stepFocusedControlStringProperty: instructionStrings.a11y.adjust.stepFocusedControlStringProperty,
        },
        controls: {
          toggleHelpStringProperty: instructionStrings.a11y.controls.toggleHelpStringProperty,
        },
      },
    };
  }
}
