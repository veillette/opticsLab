/**
 * KeyboardShortcutsNode.ts
 *
 * Displays the keyboard help overlay for OpticsLab.  This is a generic
 * two‑column layout with sections and rows.
 */

import {
  type Bounds2,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  Node,
  type Property,
  Rectangle,
} from "scenerystack";
import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  LetterKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";

// Configuration options for the keyboard shortcuts display
export type KeyboardShortcutsOptions = {
  visibleProperty: Property<boolean>;
  layoutBounds: Bounds2;
};

const TEXT_MAX_WIDTH = 1000;

export class KeyboardShortcutsNode extends Node {
  private readonly visibilityControlProperty: Property<boolean>;

  public constructor(options: KeyboardShortcutsOptions) {
    super({
      visibleProperty: options.visibleProperty,
    });

    this.visibilityControlProperty = options.visibleProperty;

    // Get strings from string manager
    const strings = StringManager.getInstance().getInstructionsStrings();

    // background panel
    const backgroundPanel = new Rectangle(0, 0, 1, 1, {
      fill: OpticsLabColors.controlPanelBackgroundColorProperty,
      stroke: OpticsLabColors.controlPanelBorderColorProperty,
      cornerRadius: 10,
    });
    this.addChild(backgroundPanel);

    const sectionOptions = {
      textMaxWidth: TEXT_MAX_WIDTH,
      headingOptions: {
        fill: OpticsLabColors.controlPanelTextColorProperty,
      },
    };

    const navigationSection = new KeyboardHelpSection(
      strings.sections.navigationStringProperty,
      [
        KeyboardHelpSectionRow.labelWithIcon(
          strings.objectSelection.selectSourceStringProperty,
          new LetterKeyNode("S"),
          {
            labelInnerContent: strings.a11y.objectSelection.selectSourceStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
        KeyboardHelpSectionRow.labelWithIcon(
          strings.objectSelection.selectObserverStringProperty,
          new LetterKeyNode("O"),
          {
            labelInnerContent: strings.a11y.objectSelection.selectObserverStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
        KeyboardHelpSectionRow.labelWithIcon(
          strings.objectSelection.moveObjectStringProperty,
          KeyboardHelpIconFactory.arrowKeysRowIcon(),
          {
            labelInnerContent: strings.a11y.objectSelection.moveObjectStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
        KeyboardHelpSectionRow.labelWithIcon(
          strings.objectSelection.moveObjectStringProperty,
          KeyboardHelpIconFactory.iconToIcon(
            new LetterKeyNode("W"),
            KeyboardHelpIconFactory.iconToIcon(
              new LetterKeyNode("A"),
              KeyboardHelpIconFactory.iconToIcon(new LetterKeyNode("S"), new LetterKeyNode("D")),
            ),
          ),
          {
            labelInnerContent: strings.a11y.objectSelection.moveObjectStringProperty,
            // Use static string to avoid duplicate dependencies (arrow keys row uses the same Property)
            readingBlockContent: strings.a11y.objectSelection.moveObjectStringProperty.value,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
      ],
      sectionOptions,
    );

    const adjustmentSection = new KeyboardHelpSection(
      strings.sections.parameterAdjustmentStringProperty,
      [
        KeyboardHelpSectionRow.labelWithIcon(
          strings.adjust.frequencyStringProperty,
          KeyboardHelpIconFactory.iconToIcon(new LetterKeyNode("+"), new LetterKeyNode("-")),
          {
            labelInnerContent: strings.a11y.adjust.frequencyStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
        KeyboardHelpSectionRow.labelWithIcon(
          strings.adjust.soundSpeedStringProperty,
          KeyboardHelpIconFactory.iconToIcon(new LetterKeyNode(","), new LetterKeyNode(".")),
          {
            labelInnerContent: strings.a11y.adjust.soundSpeedStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
      ],
      sectionOptions,
    );

    const scenariosSection = new KeyboardHelpSection(
      strings.sections.scenariosStringProperty,
      [
        KeyboardHelpSectionRow.labelWithIcon(
          strings.scenarioKeys.freePlayStringProperty,
          KeyboardHelpIconFactory.iconToIcon(new LetterKeyNode("0"), new LetterKeyNode("6")),
          {
            labelInnerContent: strings.a11y.scenarioKeys.freePlayStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
      ],
      sectionOptions,
    );

    const visibilitySection = new KeyboardHelpSection(
      strings.sections.visibilityOptionsStringProperty,
      [
        KeyboardHelpSectionRow.labelWithIcon(strings.toggleMotionTrailsStringProperty, new LetterKeyNode("T"), {
          labelInnerContent: strings.a11y.toggleMotionTrailsStringProperty,
          labelOptions: {
            fill: OpticsLabColors.controlPanelTextColorProperty,
          },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.toggleMicrophoneStringProperty, new LetterKeyNode("M"), {
          labelInnerContent: strings.a11y.toggleMicrophoneStringProperty,
          labelOptions: {
            fill: OpticsLabColors.controlPanelTextColorProperty,
          },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.controls.toggleHelpStringProperty, new LetterKeyNode("H"), {
          labelInnerContent: strings.a11y.controls.toggleHelpStringProperty,
          labelOptions: {
            fill: OpticsLabColors.controlPanelTextColorProperty,
          },
        }),
      ],
      sectionOptions,
    );

    const basicActionsSection = new BasicActionsKeyboardHelpSection({
      withCheckboxContent: true,
      textMaxWidth: TEXT_MAX_WIDTH,
      headingOptions: {
        fill: OpticsLabColors.controlPanelTextColorProperty,
      },
    });

    const helpContent = new TwoColumnKeyboardHelpContent(
      [navigationSection, adjustmentSection, scenariosSection],
      [visibilitySection, basicActionsSection],
    );

    this.addChild(helpContent);

    helpContent.boundsProperty.link((bounds) => {
      backgroundPanel.rectBounds = bounds.dilated(20);
    });

    this.center = options.layoutBounds.center;

    KeyboardHelpSection.alignHelpSectionIcons([navigationSection, adjustmentSection, scenariosSection]);
    KeyboardHelpSection.alignHelpSectionIcons([visibilitySection]);
  }

  public toggleVisibility(): void {
    this.visibilityControlProperty.value = !this.visibilityControlProperty.value;
  }
}
