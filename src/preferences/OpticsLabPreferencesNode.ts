/**
 * OpticsLabPreferencesNode - Custom preferences UI panel for the OpticsLab simulation.
 *
 * Renders the simulation-specific preferences content shown in the Preferences dialog.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import { HStrut, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { Checkbox, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import OpticsLabColors from "../OpticsLabColors.js";
import {
  GRID_SPACING_MAX_M,
  GRID_SPACING_MIN_M,
  SLIDER_THUMB_HEIGHT,
  SLIDER_THUMB_WIDTH,
  SLIDER_TRACK_HEIGHT,
  SLIDER_TRACK_WIDTH,
} from "../OpticsLabConstants.js";
import opticsLab from "../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "./OpticsLabPreferencesModel.js";

export class OpticsLabPreferencesNode extends VBox {
  public constructor(preferencesModel: OpticsLabPreferencesModel, tandem?: Tandem) {
    const stringManager = StringManager.getInstance();
    const prefStrings = stringManager.getPreferences();

    const header = new Text(prefStrings.simulationStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: OpticsLabColors.preferencesTextProperty,
    });

    const snapToGridCheckbox = new Checkbox(
      preferencesModel.snapToGridProperty,
      new VBox({
        align: "left",
        spacing: 2,
        children: [
          new Text(prefStrings.snapToGridStringProperty, {
            font: new PhetFont(14),
            fill: OpticsLabColors.preferencesTextProperty,
          }),
          new Text(prefStrings.snapToGridDescriptionStringProperty, {
            font: new PhetFont(11),
            fill: OpticsLabColors.preferencesTextSecondaryProperty,
            maxWidth: 500,
          }),
        ],
      }),
      {
        checkboxColor: OpticsLabColors.checkboxPreferencesColorProperty,
        checkboxColorBackground: OpticsLabColors.checkboxPreferencesColorBackgroundProperty,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("snapToGridCheckbox") }),
      },
    );

    const gridSpacingControl = new NumberControl(
      prefStrings.gridSpacingStringProperty,
      preferencesModel.gridSpacingProperty,
      new Range(GRID_SPACING_MIN_M, GRID_SPACING_MAX_M),
      {
        delta: 0.1,
        numberDisplayOptions: {
          decimalPlaces: 1,
          textOptions: {
            fill: OpticsLabColors.preferencesTextProperty,
          },
        },
        titleNodeOptions: {
          font: new PhetFont(14),
          fill: OpticsLabColors.preferencesTextProperty,
          maxWidth: 200,
        },
        sliderOptions: {
          trackSize: new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT),
          thumbSize: new Dimension2(SLIDER_THUMB_WIDTH, SLIDER_THUMB_HEIGHT),
          trackFillEnabled: OpticsLabColors.preferencesTextProperty,
        },
        arrowButtonOptions: { scale: 0.75 },
        layoutFunction: NumberControl.createLayoutFunction4({ sliderPadding: 5 }),
        ...(tandem && { tandem: tandem.createTandem("gridSpacingControl") }),
      },
    );

    const gridSpacingDescription = new Text(prefStrings.gridSpacingDescriptionStringProperty, {
      font: new PhetFont(11),
      fill: OpticsLabColors.preferencesTextSecondaryProperty,
      maxWidth: 500,
    });

    // ── Partial Reflection ───────────────────────────────────────────────────
    const partialReflectionCheckbox = new Checkbox(
      preferencesModel.partialReflectionEnabledProperty,
      new VBox({
        align: "left",
        spacing: 2,
        children: [
          new Text(prefStrings.partialReflectionStringProperty, {
            font: new PhetFont(14),
            fill: OpticsLabColors.preferencesTextProperty,
          }),
          new Text(prefStrings.partialReflectionDescriptionStringProperty, {
            font: new PhetFont(11),
            fill: OpticsLabColors.preferencesTextSecondaryProperty,
            maxWidth: 500,
          }),
        ],
      }),
      {
        checkboxColor: OpticsLabColors.checkboxPreferencesColorProperty,
        checkboxColorBackground: OpticsLabColors.checkboxPreferencesColorBackgroundProperty,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("partialReflectionCheckbox") }),
      },
    );

    // ── Curvature Display ────────────────────────────────────────────────────
    const curvatureDisplayCheckbox = new Checkbox(
      preferencesModel.useCurvatureDisplayProperty,
      new VBox({
        align: "left",
        spacing: 2,
        children: [
          new Text(prefStrings.curvatureDisplayStringProperty, {
            font: new PhetFont(14),
            fill: OpticsLabColors.preferencesTextProperty,
          }),
          new Text(prefStrings.curvatureDisplayDescriptionStringProperty, {
            font: new PhetFont(11),
            fill: OpticsLabColors.preferencesTextSecondaryProperty,
            maxWidth: 500,
          }),
        ],
      }),
      {
        checkboxColor: OpticsLabColors.checkboxPreferencesColorProperty,
        checkboxColorBackground: OpticsLabColors.checkboxPreferencesColorBackgroundProperty,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("curvatureDisplayCheckbox") }),
      },
    );

    // ── Sign Convention ──────────────────────────────────────────────────────
    const signConventionHeader = new Text(prefStrings.signConventionStringProperty, {
      font: new PhetFont({ size: 14, weight: "bold" }),
      fill: OpticsLabColors.preferencesTextProperty,
    });

    const signConventionDescription = new Text(prefStrings.signConventionDescriptionStringProperty, {
      font: new PhetFont(11),
      fill: OpticsLabColors.preferencesTextSecondaryProperty,
      maxWidth: 500,
    });

    const makeRadioLabel = (titleProperty: TReadOnlyProperty<string>, descProperty: TReadOnlyProperty<string>) =>
      new VBox({
        align: "left",
        spacing: 2,
        children: [
          new Text(titleProperty, {
            font: new PhetFont(14),
            fill: OpticsLabColors.preferencesTextProperty,
          }),
          new Text(descProperty, {
            font: new PhetFont(11),
            fill: OpticsLabColors.preferencesTextSecondaryProperty,
            maxWidth: 480,
          }),
        ],
      });

    const signConventionRadioGroup = new VerticalAquaRadioButtonGroup(
      preferencesModel.signConventionProperty,
      [
        {
          value: "newCartesian" as const,
          createNode: (_tandem) =>
            makeRadioLabel(prefStrings.newCartesianStringProperty, prefStrings.newCartesianDescriptionStringProperty),
          tandemName: "newCartesianRadioButton",
        },
        {
          value: "realIsPositive" as const,
          createNode: (_tandem) =>
            makeRadioLabel(
              prefStrings.realIsPositiveStringProperty,
              prefStrings.realIsPositiveDescriptionStringProperty,
            ),
          tandemName: "realIsPositiveRadioButton",
        },
      ],
      {
        spacing: 10,
        radioButtonOptions: {
          radius: 7,
          xSpacing: 8,
        },
        tandem: tandem?.createTandem("signConventionRadioGroup") ?? Tandem.OPTIONAL,
      },
    );

    super({
      align: "left",
      spacing: 12,
      children: [
        header,
        new HStrut(600),
        snapToGridCheckbox,
        gridSpacingControl,
        gridSpacingDescription,
        partialReflectionCheckbox,
        curvatureDisplayCheckbox,
        signConventionHeader,
        signConventionDescription,
        signConventionRadioGroup,
      ],
      ...(tandem && { tandem: tandem.createTandem("opticsLabPreferencesNode") }),
    });
  }
}

opticsLab.register("OpticsLabPreferencesNode", OpticsLabPreferencesNode);
