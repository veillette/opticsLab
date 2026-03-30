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
    downloadSceneStringProperty: ReadOnlyProperty<string>;
    rayDensityStringProperty: ReadOnlyProperty<string>;
    measuringTapeStringProperty: ReadOnlyProperty<string>;
    protractorStringProperty: ReadOnlyProperty<string>;
    extendedRaysStringProperty: ReadOnlyProperty<string>;
    showHandlesStringProperty: ReadOnlyProperty<string>;
    focalMarkersStringProperty: ReadOnlyProperty<string>;
    showRayArrowsStringProperty: ReadOnlyProperty<string>;
    rayStubsStringProperty: ReadOnlyProperty<string>;
    rayStubLengthStringProperty: ReadOnlyProperty<string>;
    metersUnitStringProperty: ReadOnlyProperty<string>;
    showImagesStringProperty: ReadOnlyProperty<string>;
    observerModeStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      gridStringProperty: this.stringProperties.ui.gridStringProperty,
      toolsStringProperty: this.stringProperties.ui.toolsStringProperty,
      downloadSceneStringProperty: this.stringProperties.ui.downloadSceneStringProperty,
      rayDensityStringProperty: this.stringProperties.ui.rayDensityStringProperty,
      measuringTapeStringProperty: this.stringProperties.ui.measuringTapeStringProperty,
      protractorStringProperty: this.stringProperties.ui.protractorStringProperty,
      extendedRaysStringProperty: this.stringProperties.ui.extendedRaysStringProperty,
      showHandlesStringProperty: this.stringProperties.ui.showHandlesStringProperty,
      focalMarkersStringProperty: this.stringProperties.ui.focalMarkersStringProperty,
      showRayArrowsStringProperty: this.stringProperties.ui.showRayArrowsStringProperty,
      rayStubsStringProperty: this.stringProperties.ui.rayStubsStringProperty,
      rayStubLengthStringProperty: this.stringProperties.ui.rayStubLengthStringProperty,
      metersUnitStringProperty: this.stringProperties.ui.metersUnitStringProperty,
      showImagesStringProperty: this.stringProperties.ui.showImagesStringProperty,
      observerModeStringProperty: this.stringProperties.ui.observerModeStringProperty,
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
    angleStringProperty: ReadOnlyProperty<string>;
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
      angleStringProperty: controlStrings.angleStringProperty,
    };
  }

  public getComponentStrings(): {
    pointSourceStringProperty: ReadOnlyProperty<string>;
    arcSourceStringProperty: ReadOnlyProperty<string>;
    beamStringProperty: ReadOnlyProperty<string>;
    beamSourceStringProperty: ReadOnlyProperty<string>;
    divergentBeamStringProperty: ReadOnlyProperty<string>;
    divergentBeamSourceStringProperty: ReadOnlyProperty<string>;
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
      divergentBeamStringProperty: c.divergentBeamStringProperty,
      divergentBeamSourceStringProperty: c.divergentBeamSourceStringProperty,
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

  public getInfoDialog(): {
    titleStringProperty: ReadOnlyProperty<string>;
    tab1LabelStringProperty: ReadOnlyProperty<string>;
    tab2LabelStringProperty: ReadOnlyProperty<string>;
    addElementsTitleStringProperty: ReadOnlyProperty<string>;
    addElementsBodyStringProperty: ReadOnlyProperty<string>;
    moveElementsTitleStringProperty: ReadOnlyProperty<string>;
    moveElementsBodyStringProperty: ReadOnlyProperty<string>;
    editElementsTitleStringProperty: ReadOnlyProperty<string>;
    editElementsBodyStringProperty: ReadOnlyProperty<string>;
    removeElementsTitleStringProperty: ReadOnlyProperty<string>;
    removeElementsBodyStringProperty: ReadOnlyProperty<string>;
    raysTitleStringProperty: ReadOnlyProperty<string>;
    raysBodyStringProperty: ReadOnlyProperty<string>;
    toolsPanelTitleStringProperty: ReadOnlyProperty<string>;
    toolsPanelBodyStringProperty: ReadOnlyProperty<string>;
    measureTitleStringProperty: ReadOnlyProperty<string>;
    measureBodyStringProperty: ReadOnlyProperty<string>;
    extendedRaysTitleStringProperty: ReadOnlyProperty<string>;
    extendedRaysBodyStringProperty: ReadOnlyProperty<string>;
    gridTitleStringProperty: ReadOnlyProperty<string>;
    gridBodyStringProperty: ReadOnlyProperty<string>;
    shortcutsTitleStringProperty: ReadOnlyProperty<string>;
    shortcutsBodyStringProperty: ReadOnlyProperty<string>;
    a11y: {
      tab1StringProperty: ReadOnlyProperty<string>;
      tab2StringProperty: ReadOnlyProperty<string>;
    };
  } {
    const d = this.stringProperties.infoDialog;
    return {
      titleStringProperty: d.titleStringProperty,
      tab1LabelStringProperty: d.tab1LabelStringProperty,
      tab2LabelStringProperty: d.tab2LabelStringProperty,
      addElementsTitleStringProperty: d.addElementsTitleStringProperty,
      addElementsBodyStringProperty: d.addElementsBodyStringProperty,
      moveElementsTitleStringProperty: d.moveElementsTitleStringProperty,
      moveElementsBodyStringProperty: d.moveElementsBodyStringProperty,
      editElementsTitleStringProperty: d.editElementsTitleStringProperty,
      editElementsBodyStringProperty: d.editElementsBodyStringProperty,
      removeElementsTitleStringProperty: d.removeElementsTitleStringProperty,
      removeElementsBodyStringProperty: d.removeElementsBodyStringProperty,
      raysTitleStringProperty: d.raysTitleStringProperty,
      raysBodyStringProperty: d.raysBodyStringProperty,
      toolsPanelTitleStringProperty: d.toolsPanelTitleStringProperty,
      toolsPanelBodyStringProperty: d.toolsPanelBodyStringProperty,
      measureTitleStringProperty: d.measureTitleStringProperty,
      measureBodyStringProperty: d.measureBodyStringProperty,
      extendedRaysTitleStringProperty: d.extendedRaysTitleStringProperty,
      extendedRaysBodyStringProperty: d.extendedRaysBodyStringProperty,
      gridTitleStringProperty: d.gridTitleStringProperty,
      gridBodyStringProperty: d.gridBodyStringProperty,
      shortcutsTitleStringProperty: d.shortcutsTitleStringProperty,
      shortcutsBodyStringProperty: d.shortcutsBodyStringProperty,
      a11y: {
        tab1StringProperty: d.a11y.tab1StringProperty,
        tab2StringProperty: d.a11y.tab2StringProperty,
      },
    };
  }

  public getInstructionsStrings(): {
    sections: {
      parameterAdjustmentStringProperty: ReadOnlyProperty<string>;
      simHelpStringProperty: ReadOnlyProperty<string>;
      toolsStringProperty: ReadOnlyProperty<string>;
    };
    adjust: {
      removeSelectedElementStringProperty: ReadOnlyProperty<string>;
      stepFocusedControlStringProperty: ReadOnlyProperty<string>;
    };
    controls: {
      toggleHelpStringProperty: ReadOnlyProperty<string>;
    };
    tools: {
      toggleMeasuringTapeStringProperty: ReadOnlyProperty<string>;
      toggleProtractorStringProperty: ReadOnlyProperty<string>;
      toggleExtendedRaysStringProperty: ReadOnlyProperty<string>;
      toggleShowHandlesStringProperty: ReadOnlyProperty<string>;
      toggleFocalMarkersStringProperty: ReadOnlyProperty<string>;
      toggleGridStringProperty: ReadOnlyProperty<string>;
      toggleSnapToGridStringProperty: ReadOnlyProperty<string>;
      toggleRayArrowsStringProperty: ReadOnlyProperty<string>;
      toggleRayStubsStringProperty: ReadOnlyProperty<string>;
    };
    a11y: {
      adjust: {
        removeSelectedElementStringProperty: ReadOnlyProperty<string>;
        stepFocusedControlStringProperty: ReadOnlyProperty<string>;
      };
      controls: {
        toggleHelpStringProperty: ReadOnlyProperty<string>;
      };
      tools: {
        toggleMeasuringTapeStringProperty: ReadOnlyProperty<string>;
        toggleProtractorStringProperty: ReadOnlyProperty<string>;
        toggleExtendedRaysStringProperty: ReadOnlyProperty<string>;
        toggleShowHandlesStringProperty: ReadOnlyProperty<string>;
        toggleFocalMarkersStringProperty: ReadOnlyProperty<string>;
        toggleGridStringProperty: ReadOnlyProperty<string>;
        toggleSnapToGridStringProperty: ReadOnlyProperty<string>;
        toggleRayArrowsStringProperty: ReadOnlyProperty<string>;
        toggleRayStubsStringProperty: ReadOnlyProperty<string>;
      };
    };
  } {
    const instructionStrings = this.stringProperties.instructions;
    return {
      sections: {
        parameterAdjustmentStringProperty: instructionStrings.sections.parameterAdjustmentStringProperty,
        simHelpStringProperty: instructionStrings.sections.simHelpStringProperty,
        toolsStringProperty: instructionStrings.sections.toolsStringProperty,
      },
      adjust: {
        removeSelectedElementStringProperty: instructionStrings.adjust.removeSelectedElementStringProperty,
        stepFocusedControlStringProperty: instructionStrings.adjust.stepFocusedControlStringProperty,
      },
      controls: {
        toggleHelpStringProperty: instructionStrings.controls.toggleHelpStringProperty,
      },
      tools: {
        toggleMeasuringTapeStringProperty: instructionStrings.tools.toggleMeasuringTapeStringProperty,
        toggleProtractorStringProperty: instructionStrings.tools.toggleProtractorStringProperty,
        toggleExtendedRaysStringProperty: instructionStrings.tools.toggleExtendedRaysStringProperty,
        toggleShowHandlesStringProperty: instructionStrings.tools.toggleShowHandlesStringProperty,
        toggleFocalMarkersStringProperty: instructionStrings.tools.toggleFocalMarkersStringProperty,
        toggleGridStringProperty: instructionStrings.tools.toggleGridStringProperty,
        toggleSnapToGridStringProperty: instructionStrings.tools.toggleSnapToGridStringProperty,
        toggleRayArrowsStringProperty: instructionStrings.tools.toggleRayArrowsStringProperty,
        toggleRayStubsStringProperty: instructionStrings.tools.toggleRayStubsStringProperty,
      },
      a11y: {
        adjust: {
          removeSelectedElementStringProperty: instructionStrings.a11y.adjust.removeSelectedElementStringProperty,
          stepFocusedControlStringProperty: instructionStrings.a11y.adjust.stepFocusedControlStringProperty,
        },
        controls: {
          toggleHelpStringProperty: instructionStrings.a11y.controls.toggleHelpStringProperty,
        },
        tools: {
          toggleMeasuringTapeStringProperty: instructionStrings.a11y.tools.toggleMeasuringTapeStringProperty,
          toggleProtractorStringProperty: instructionStrings.a11y.tools.toggleProtractorStringProperty,
          toggleExtendedRaysStringProperty: instructionStrings.a11y.tools.toggleExtendedRaysStringProperty,
          toggleShowHandlesStringProperty: instructionStrings.a11y.tools.toggleShowHandlesStringProperty,
          toggleFocalMarkersStringProperty: instructionStrings.a11y.tools.toggleFocalMarkersStringProperty,
          toggleGridStringProperty: instructionStrings.a11y.tools.toggleGridStringProperty,
          toggleSnapToGridStringProperty: instructionStrings.a11y.tools.toggleSnapToGridStringProperty,
          toggleRayArrowsStringProperty: instructionStrings.a11y.tools.toggleRayArrowsStringProperty,
          toggleRayStubsStringProperty: instructionStrings.a11y.tools.toggleRayStubsStringProperty,
        },
      },
    };
  }
}
