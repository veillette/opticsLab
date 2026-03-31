/**
 * KeyboardShortcutsNode.ts
 *
 * Keyboard help overlay: moving components (PhET-standard draggable help),
 * parameter adjustment, help toggle, and basic sim actions.
 */

import { KeyboardHelpSection, KeyboardHelpSectionRow, Node } from "scenerystack";
import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  LetterKeyNode,
  MoveDraggableItemsKeyboardHelpSection,
  TextKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import { KEYBOARD_HELP_TEXT_MAX_WIDTH } from "../../OpticsLabConstants.js";

export class KeyboardShortcutsNode extends Node {
  public constructor() {
    super();

    const strings = StringManager.getInstance().getInstructionsStrings();

    const sectionOptions = {
      textMaxWidth: KEYBOARD_HELP_TEXT_MAX_WIDTH,
      headingOptions: {
        fill: OpticsLabColors.controlPanelTextColorProperty,
      },
    };

    const moveDraggableSection = new MoveDraggableItemsKeyboardHelpSection();

    const adjustmentSection = new KeyboardHelpSection(
      strings.sections.parameterAdjustmentStringProperty,
      [
        KeyboardHelpSectionRow.labelWithIcon(
          strings.adjust.removeSelectedElementStringProperty,
          KeyboardHelpIconFactory.iconOrIcon(TextKeyNode.backspace(), TextKeyNode.delete()),
          {
            labelInnerContent: strings.a11y.adjust.removeSelectedElementStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
        KeyboardHelpSectionRow.labelWithIcon(
          strings.adjust.stepFocusedControlStringProperty,
          KeyboardHelpIconFactory.iconToIcon(new LetterKeyNode("+"), new LetterKeyNode("-")),
          {
            labelInnerContent: strings.a11y.adjust.stepFocusedControlStringProperty,
            labelOptions: {
              fill: OpticsLabColors.controlPanelTextColorProperty,
            },
          },
        ),
      ],
      sectionOptions,
    );

    const toolsSection = new KeyboardHelpSection(
      strings.sections.toolsStringProperty,
      [
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleMeasuringTapeStringProperty, new LetterKeyNode("M"), {
          labelInnerContent: strings.a11y.tools.toggleMeasuringTapeStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleProtractorStringProperty, new LetterKeyNode("P"), {
          labelInnerContent: strings.a11y.tools.toggleProtractorStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleExtendedRaysStringProperty, new LetterKeyNode("E"), {
          labelInnerContent: strings.a11y.tools.toggleExtendedRaysStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleShowHandlesStringProperty, new LetterKeyNode("K"), {
          labelInnerContent: strings.a11y.tools.toggleShowHandlesStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleFocalMarkersStringProperty, new LetterKeyNode("F"), {
          labelInnerContent: strings.a11y.tools.toggleFocalMarkersStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleGridStringProperty, new LetterKeyNode("G"), {
          labelInnerContent: strings.a11y.tools.toggleGridStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleSnapToGridStringProperty, new LetterKeyNode("S"), {
          labelInnerContent: strings.a11y.tools.toggleSnapToGridStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleRayArrowsStringProperty, new LetterKeyNode("A"), {
          labelInnerContent: strings.a11y.tools.toggleRayArrowsStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
        KeyboardHelpSectionRow.labelWithIcon(strings.tools.toggleRayStubsStringProperty, new LetterKeyNode("R"), {
          labelInnerContent: strings.a11y.tools.toggleRayStubsStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
      ],
      sectionOptions,
    );

    const simHelpSection = new KeyboardHelpSection(
      strings.sections.simHelpStringProperty,
      [
        KeyboardHelpSectionRow.labelWithIcon(strings.controls.toggleHelpStringProperty, new LetterKeyNode("H"), {
          labelInnerContent: strings.a11y.controls.toggleHelpStringProperty,
          labelOptions: { fill: OpticsLabColors.controlPanelTextColorProperty },
        }),
      ],
      sectionOptions,
    );

    const basicActionsSection = new BasicActionsKeyboardHelpSection({
      withCheckboxContent: true,
      textMaxWidth: KEYBOARD_HELP_TEXT_MAX_WIDTH,
      headingOptions: {
        fill: OpticsLabColors.controlPanelTextColorProperty,
      },
    });

    const helpContent = new TwoColumnKeyboardHelpContent(
      [moveDraggableSection, adjustmentSection, toolsSection],
      [simHelpSection, basicActionsSection],
    );

    this.addChild(helpContent);

    KeyboardHelpSection.alignHelpSectionIcons([moveDraggableSection, adjustmentSection, toolsSection]);
    KeyboardHelpSection.alignHelpSectionIcons([simHelpSection]);
  }
}
