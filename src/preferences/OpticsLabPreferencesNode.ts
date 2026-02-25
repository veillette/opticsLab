/**
 * OpticsLabPreferencesNode - Custom preferences UI panel for the OpticsLab simulation.
 *
 * Renders the simulation-specific preferences content shown in the Preferences dialog.
 */

import { HStrut, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import OpticsLabColors from "../OpticsLabColors.js";
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

    const enableDemoAnimationCheckbox = new Checkbox(
      preferencesModel.enableDemoAnimationProperty,
      new VBox({
        align: "left",
        spacing: 2,
        children: [
          new Text(prefStrings.enableDemoAnimationStringProperty, {
            font: new PhetFont(14),
            fill: OpticsLabColors.preferencesTextProperty,
          }),
          new Text(prefStrings.enableDemoAnimationDescriptionStringProperty, {
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
        ...(tandem && { tandem: tandem.createTandem("enableDemoAnimationCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: 12,
      children: [header, new HStrut(600), enableDemoAnimationCheckbox],
      ...(tandem && { tandem: tandem.createTandem("opticsLabPreferencesNode") }),
    });
  }
}

opticsLab.register("OpticsLabPreferencesNode", OpticsLabPreferencesNode);
