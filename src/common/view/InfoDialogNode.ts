/**
 * InfoDialogNode.ts
 *
 * Modal help for OpticsLab: workflow (carousel, edit, remove) and tools/shortcuts.
 * Toggled by the InfoButton in the lower-left corner of the screen.
 */

import type { ReadOnlyProperty } from "scenerystack";
import { Circle, FireListener, HBox, Line, Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { ArrowNode, CloseButton, PhetFont } from "scenerystack/scenery-phet";
import { Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import { CONTROL_ICON_SIZE, PANEL_CORNER_RADIUS, PANEL_X_MARGIN, PANEL_Y_MARGIN } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";

const CONTENT_WIDTH = 380;
const TITLE_FONT = new PhetFont({ size: 15, weight: "bold" });
const TAB_FONT = new PhetFont({ size: 13, weight: "bold" });
const STEP_TITLE_FONT = new PhetFont({ size: 13, weight: "bold" });
const STEP_BODY_FONT = new PhetFont(13);
const STEPS_SPACING = 12;
const STEP_INNER_SPACING = 2;
const CLOSE_BUTTON_ICON_LENGTH = 10;
const ICON_SPACING = 8;
const TITLE_MAX_WIDTH_SPACING = 8;
const TAB_SPACING = 24;
const TAB_UNDERLINE_HEIGHT = 2;
const TAB_ACTIVE_OPACITY = 1;
const TAB_INACTIVE_OPACITY = 0.4;

const ICON_ARROW_HEAD_SIZE = 5;
const ICON_ARROW_TAIL_WIDTH = 1.5;
const ICON_LINE_WIDTH_THICK = 1.5;
const ICON_CENTER_FRACTION = 0.5;
const ICON_HALF_FRACTION = 0.4;

function carouselIcon(): Node {
  const gray = OpticsLabColors.carouselLabelFillProperty;
  const s = CONTROL_ICON_SIZE;
  const dots: Node[] = [];
  for (let i = 0; i < 3; i++) {
    dots.push(
      new Circle(2, {
        fill: gray,
        x: 4,
        y: 6 + i * 5,
      }),
    );
  }
  const panel = new Rectangle(12, 4, s - 14, s - 8, {
    stroke: gray,
    lineWidth: ICON_LINE_WIDTH_THICK,
    fill: null,
    cornerRadius: 2,
  });
  return new Node({ children: [...dots, panel] });
}

function moveIcon(): Node {
  const c = OpticsLabColors.iconRayStrokeProperty;
  const cx = CONTROL_ICON_SIZE * ICON_CENTER_FRACTION;
  const cy = CONTROL_ICON_SIZE * ICON_CENTER_FRACTION;
  const r = CONTROL_ICON_SIZE * 0.22;
  return new Node({
    children: [
      new Line(cx - r, cy, cx + r, cy, { stroke: c, lineWidth: ICON_LINE_WIDTH_THICK }),
      new Line(cx, cy - r, cx, cy + r, { stroke: c, lineWidth: ICON_LINE_WIDTH_THICK }),
      new Circle(r * 0.45, { fill: c, x: cx, y: cy }),
    ],
  });
}

function editPanelIcon(): Node {
  const gray = OpticsLabColors.overlayLabelFillProperty;
  const left = 4;
  const top = 5;
  const w = CONTROL_ICON_SIZE - 8;
  const rowH = 3;
  const gap = 4;
  return new Node({
    children: [
      new Rectangle(left, top, w, CONTROL_ICON_SIZE - top - 4, {
        stroke: gray,
        lineWidth: 1,
        fill: null,
        cornerRadius: 2,
      }),
      new Line(left + 4, top + 6, left + w - 4, top + 6, { stroke: gray, lineWidth: 1 }),
      new Rectangle(left + 4, top + 6 + gap, w * 0.55, rowH, { fill: gray }),
      new Rectangle(left + 4, top + 6 + gap * 2 + rowH, w * 0.4, rowH, { fill: gray }),
    ],
  });
}

function removeIcon(): Node {
  const gray = OpticsLabColors.carouselLabelFillProperty;
  const box = new Rectangle(3, 6, 10, 10, {
    stroke: gray,
    lineWidth: ICON_LINE_WIDTH_THICK,
    fill: null,
    cornerRadius: 1,
  });
  const arrow = new ArrowNode(16, CONTROL_ICON_SIZE * 0.55, 6, CONTROL_ICON_SIZE * 0.55, {
    fill: gray,
    stroke: null,
    headWidth: ICON_ARROW_HEAD_SIZE,
    headHeight: ICON_ARROW_HEAD_SIZE,
    tailWidth: ICON_ARROW_TAIL_WIDTH,
  });
  return new Node({ children: [box, arrow] });
}

function raysFanIcon(): Node {
  const rayColor = OpticsLabColors.iconRayStrokeProperty;
  const cx = 5;
  const cy = CONTROL_ICON_SIZE * 0.55;
  const len = CONTROL_ICON_SIZE - 10;
  const spread = 0.35;
  return new Node({
    children: [
      new Line(cx, cy, cx + len, cy, { stroke: rayColor, lineWidth: 1.2 }),
      new Line(cx, cy, cx + len * Math.cos(spread), cy - len * Math.sin(spread), { stroke: rayColor, lineWidth: 1.2 }),
      new Line(cx, cy, cx + len * Math.cos(spread), cy + len * Math.sin(spread), { stroke: rayColor, lineWidth: 1.2 }),
      new Circle(2.5, { fill: OpticsLabColors.pointSourceFillProperty, x: cx, y: cy }),
    ],
  });
}

function toolsAccordionIcon(): Node {
  const gray = OpticsLabColors.overlayLabelFillProperty;
  const w = CONTROL_ICON_SIZE - 6;
  return new Node({
    children: [
      new Rectangle(3, 4, w, 5, { fill: gray, cornerRadius: 1 }),
      new Rectangle(3, 12, w, CONTROL_ICON_SIZE - 16, { stroke: gray, lineWidth: 1, fill: null, cornerRadius: 2 }),
    ],
  });
}

function measuringTapeIcon(): Node {
  const cx = CONTROL_ICON_SIZE * ICON_CENTER_FRACTION;
  const cy = CONTROL_ICON_SIZE * ICON_CENTER_FRACTION;
  const half = CONTROL_ICON_SIZE * ICON_HALF_FRACTION;
  const color = OpticsLabColors.measuringTapeTextColorProperty;
  const tickH = 4;
  return new Node({
    children: [
      new Line(cx - half, cy, cx + half, cy, { stroke: color, lineWidth: ICON_LINE_WIDTH_THICK }),
      new Line(cx - half, cy - tickH / 2, cx - half, cy + tickH / 2, { stroke: color, lineWidth: 1 }),
      new Line(cx, cy - tickH / 4, cx, cy + tickH / 4, { stroke: color, lineWidth: 1 }),
      new Line(cx + half, cy - tickH / 2, cx + half, cy + tickH / 2, { stroke: color, lineWidth: 1 }),
    ],
  });
}

function extendedRaysIcon(): Node {
  const c = OpticsLabColors.idealLensStrokeProperty;
  const y = CONTROL_ICON_SIZE * 0.5;
  const dash: number[] = [4, 3];
  return new Node({
    children: [
      new Line(2, y, CONTROL_ICON_SIZE - 2, y, { stroke: c, lineWidth: 1.5, lineDash: dash }),
      new Line(CONTROL_ICON_SIZE * 0.45, y, CONTROL_ICON_SIZE - 2, y - 6, { stroke: c, lineWidth: 1, lineDash: dash }),
      new Line(CONTROL_ICON_SIZE * 0.45, y, CONTROL_ICON_SIZE - 2, y + 6, { stroke: c, lineWidth: 1, lineDash: dash }),
    ],
  });
}

function gridIcon(): Node {
  const gray = OpticsLabColors.gridLineStrokeProperty;
  const m = 3;
  const s = CONTROL_ICON_SIZE;
  return new Node({
    children: [
      new Line(m, s * 0.35, s - m, s * 0.35, { stroke: gray, lineWidth: 0.75 }),
      new Line(m, s * 0.65, s - m, s * 0.65, { stroke: gray, lineWidth: 0.75 }),
      new Line(s * 0.35, m, s * 0.35, s - m, { stroke: gray, lineWidth: 0.75 }),
      new Line(s * 0.65, m, s * 0.65, s - m, { stroke: gray, lineWidth: 0.75 }),
    ],
  });
}

function keyboardIcon(): Node {
  const gray = OpticsLabColors.carouselLabelFillProperty;
  const m = 3;
  const w = CONTROL_ICON_SIZE - 2 * m;
  const h = CONTROL_ICON_SIZE - 2 * m;
  const keyW = (w - 8) / 3;
  const keyH = (h - 10) / 2;
  const children: Node[] = [new Rectangle(m, m, w, h, { stroke: gray, lineWidth: 1, fill: null, cornerRadius: 2 })];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      children.push(
        new Rectangle(m + 4 + col * (keyW + 2), m + 5 + row * (keyH + 3), keyW, keyH, {
          stroke: gray,
          lineWidth: 0.75,
          fill: null,
          cornerRadius: 1,
        }),
      );
    }
  }
  return new Node({ children });
}

function makeStep(icon: Node, titleProp: ReadOnlyProperty<string>, bodyProp: ReadOnlyProperty<string>): Node {
  const textMax = CONTENT_WIDTH - CONTROL_ICON_SIZE - ICON_SPACING;
  const titleText = new Text(titleProp, {
    font: STEP_TITLE_FONT,
    fill: OpticsLabColors.overlayValueFillProperty,
    maxWidth: textMax,
  });
  const bodyText = new RichText(bodyProp, {
    font: STEP_BODY_FONT,
    fill: OpticsLabColors.preferencesTextSecondaryProperty,
    lineWrap: textMax,
  });
  const textBox = new VBox({
    children: [titleText, bodyText],
    spacing: STEP_INNER_SPACING,
    align: "left",
  });
  return new HBox({
    children: [icon, textBox],
    spacing: ICON_SPACING,
    align: "top",
  });
}

function makeSeparator(): Node {
  return new Line(0, 0, CONTENT_WIDTH, 0, {
    stroke: OpticsLabColors.panelStrokeProperty,
    lineWidth: 0.5,
    opacity: 0.6,
  });
}

/**
 * Floating panel with workflow and tools help. Hidden by default; show with `visible = true`.
 */
export class InfoDialogNode extends Node {
  public constructor() {
    super({ visible: false });

    const strings = StringManager.getInstance().getInfoDialog();

    const titleText = new Text(strings.titleStringProperty, {
      font: TITLE_FONT,
      fill: OpticsLabColors.overlayValueFillProperty,
    });
    const closeButton = new CloseButton({
      listener: () => {
        this.visible = false;
      },
      baseColor: OpticsLabColors.carouselButtonBaseColorProperty,
      iconLength: CLOSE_BUTTON_ICON_LENGTH,
      tandem: Tandem.OPT_OUT,
    });
    const headerNode = new Node({ children: [titleText, closeButton] });
    closeButton.right = CONTENT_WIDTH;
    closeButton.centerY = titleText.centerY;
    titleText.maxWidth = CONTENT_WIDTH - closeButton.width - TITLE_MAX_WIDTH_SPACING;

    const tab1Label = new Text(strings.tab1LabelStringProperty, {
      font: TAB_FONT,
      fill: OpticsLabColors.overlayValueFillProperty,
    });
    const tab1Underline = new Rectangle(0, 0, Math.max(tab1Label.width, 40), TAB_UNDERLINE_HEIGHT, {
      fill: OpticsLabColors.overlayValueFillProperty,
    });
    const tab1Button = new VBox({
      children: [tab1Label, tab1Underline],
      spacing: 3,
      align: "left",
      cursor: "pointer",
      tagName: "button",
      accessibleName: strings.a11y.tab1StringProperty,
    });

    const tab2Label = new Text(strings.tab2LabelStringProperty, {
      font: TAB_FONT,
      fill: OpticsLabColors.overlayValueFillProperty,
      opacity: TAB_INACTIVE_OPACITY,
    });
    const tab2Underline = new Rectangle(0, 0, Math.max(tab2Label.width, 40), TAB_UNDERLINE_HEIGHT, {
      fill: OpticsLabColors.overlayValueFillProperty,
      visible: false,
    });
    const tab2Button = new VBox({
      children: [tab2Label, tab2Underline],
      spacing: 3,
      align: "left",
      cursor: "pointer",
      tagName: "button",
      accessibleName: strings.a11y.tab2StringProperty,
    });

    const tabBar = new HBox({
      children: [tab1Button, tab2Button],
      spacing: TAB_SPACING,
      align: "bottom",
    });

    const tab1Content = new VBox({
      children: [
        makeStep(carouselIcon(), strings.addElementsTitleStringProperty, strings.addElementsBodyStringProperty),
        makeStep(moveIcon(), strings.moveElementsTitleStringProperty, strings.moveElementsBodyStringProperty),
        makeStep(editPanelIcon(), strings.editElementsTitleStringProperty, strings.editElementsBodyStringProperty),
        makeStep(removeIcon(), strings.removeElementsTitleStringProperty, strings.removeElementsBodyStringProperty),
        makeStep(raysFanIcon(), strings.raysTitleStringProperty, strings.raysBodyStringProperty),
      ],
      spacing: STEPS_SPACING,
      align: "left",
    });

    const tab2Content = new VBox({
      children: [
        makeStep(toolsAccordionIcon(), strings.toolsPanelTitleStringProperty, strings.toolsPanelBodyStringProperty),
        makeStep(measuringTapeIcon(), strings.measureTitleStringProperty, strings.measureBodyStringProperty),
        makeStep(extendedRaysIcon(), strings.extendedRaysTitleStringProperty, strings.extendedRaysBodyStringProperty),
        makeStep(gridIcon(), strings.gridTitleStringProperty, strings.gridBodyStringProperty),
        makeStep(keyboardIcon(), strings.shortcutsTitleStringProperty, strings.shortcutsBodyStringProperty),
      ],
      spacing: STEPS_SPACING,
      align: "left",
    });

    const contentContainer = new Node({ children: [tab1Content] });

    const switchToTab = (index: number): void => {
      contentContainer.removeAllChildren();
      contentContainer.addChild(index === 0 ? tab1Content : tab2Content);
      tab1Label.opacity = index === 0 ? TAB_ACTIVE_OPACITY : TAB_INACTIVE_OPACITY;
      tab2Label.opacity = index === 0 ? TAB_INACTIVE_OPACITY : TAB_ACTIVE_OPACITY;
      tab1Underline.visible = index === 0;
      tab2Underline.visible = index === 1;
    };

    tab1Button.addInputListener(new FireListener({ fire: () => switchToTab(0), tandem: Tandem.OPT_OUT }));
    tab2Button.addInputListener(new FireListener({ fire: () => switchToTab(1), tandem: Tandem.OPT_OUT }));

    const content = new VBox({
      children: [headerNode, makeSeparator(), tabBar, makeSeparator(), contentContainer],
      spacing: STEPS_SPACING,
      align: "left",
    });

    const panel = new Panel(content, {
      fill: OpticsLabColors.panelFillProperty,
      stroke: OpticsLabColors.panelStrokeProperty,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
    });

    this.addChild(panel);
  }
}

opticsLab.register("InfoDialogNode", InfoDialogNode);
