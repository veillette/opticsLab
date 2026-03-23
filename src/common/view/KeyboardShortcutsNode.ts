/**
 * KeyboardShortcutsNode.ts
 *
 * Keyboard help overlay: moving components (PhET-standard draggable help),
 * parameter adjustment, help toggle, and basic sim actions.
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
  MoveDraggableItemsKeyboardHelpSection,
  TextKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  KEYBOARD_HELP_CORNER_RADIUS,
  KEYBOARD_HELP_PANEL_DILATION,
  KEYBOARD_HELP_TEXT_MAX_WIDTH,
} from "../../OpticsLabConstants.js";

// Configuration options for the keyboard shortcuts display
export type KeyboardShortcutsOptions = {
  visibleProperty: Property<boolean>;
  layoutBounds: Bounds2;
};

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
      cornerRadius: KEYBOARD_HELP_CORNER_RADIUS,
    });
    this.addChild(backgroundPanel);

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

    const simHelpSection = new KeyboardHelpSection(
      strings.sections.simHelpStringProperty,
      [
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
      textMaxWidth: KEYBOARD_HELP_TEXT_MAX_WIDTH,
      headingOptions: {
        fill: OpticsLabColors.controlPanelTextColorProperty,
      },
    });

    const helpContent = new TwoColumnKeyboardHelpContent(
      [moveDraggableSection, adjustmentSection],
      [simHelpSection, basicActionsSection],
    );

    this.addChild(helpContent);

    helpContent.boundsProperty.link((bounds) => {
      backgroundPanel.rectBounds = bounds.dilated(KEYBOARD_HELP_PANEL_DILATION);
    });

    this.center = options.layoutBounds.center;

    KeyboardHelpSection.alignHelpSectionIcons([moveDraggableSection, adjustmentSection]);
    KeyboardHelpSection.alignHelpSectionIcons([simHelpSection]);
  }

  public toggleVisibility(): void {
    this.visibilityControlProperty.value = !this.visibilityControlProperty.value;
  }
}
