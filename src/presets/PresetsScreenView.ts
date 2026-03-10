import { Node, Text } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ComboBox, type ComboBoxItem } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { createOpticalElementView } from "../common/view/OpticalElementViewFactory.js";
import { RayTracingCommonView } from "../common/view/SimScreenView.js";
import { StringManager } from "../i18n/StringManager.js";
import OpticsLabColors from "../OpticsLabColors.js";
import { PANEL_CORNER_RADIUS } from "../OpticsLabConstants.js";
import opticsLab from "../OpticsLabNamespace.js";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import { getPresetDescriptors, type PresetId } from "./PresetScenes.js";
import type { PresetsModel } from "./PresetsModel.js";

export class PresetsScreenView extends RayTracingCommonView {
  public constructor(
    model: PresetsModel,
    opticsLabPreferences: OpticsLabPreferencesModel,
    options?: ScreenViewOptions,
  ) {
    super(model, opticsLabPreferences, options);

    const presetStrings = StringManager.getInstance().getPresetsStrings();
    const descriptors = getPresetDescriptors();

    // ── ComboBox items ────────────────────────────────────────────────────────
    const items: ComboBoxItem<PresetId>[] = descriptors.map((desc) => ({
      value: desc.id,
      createNode: () =>
        new Text(desc.label, {
          font: "13px sans-serif",
          fill: OpticsLabColors.overlayLabelFillProperty,
          maxWidth: 180,
        }),
    }));

    // The list box needs a parent node that sits above everything else.
    const listParent = new Node();
    this.addChild(listParent);

    const comboBox = new ComboBox<PresetId>(model.selectedPresetProperty, items, listParent, {
      listPosition: "below",
      cornerRadius: PANEL_CORNER_RADIUS,
      buttonFill: OpticsLabColors.panelFillProperty,
      buttonStroke: OpticsLabColors.panelStrokeProperty,
      listFill: OpticsLabColors.panelFillProperty,
      listStroke: OpticsLabColors.panelStrokeProperty,
      xMargin: 10,
      yMargin: 6,
      tandem: Tandem.OPT_OUT,
    });
    this.addChild(comboBox);

    // ── Label above the ComboBox ──────────────────────────────────────────────
    const label = new Text(presetStrings.choosePresetStringProperty, {
      font: "bold 13px sans-serif",
      fill: OpticsLabColors.overlayLabelFillProperty,
    });
    this.addChild(label);

    // Position: top-centre of the visible bounds, above the play area.
    this.visibleBoundsProperty.link((visibleBounds) => {
      label.centerX = visibleBounds.centerX;
      label.top = visibleBounds.minY + 10;
      comboBox.centerX = visibleBounds.centerX;
      comboBox.top = label.bottom + 6;
    });

    // ── Sync views when preset changes ───────────────────────────────────────
    // The model listener already clears + adds elements. We need to rebuild
    // the view layer to match.
    model.selectedPresetProperty.lazyLink(() => {
      // Clear existing element views (same as reset()).
      this.reset();

      // Recreate views for all elements now present in the model.
      for (const element of model.scene.getAllElements()) {
        const view = createOpticalElementView(element, this.modelViewTransform);
        if (view) {
          this._setupView(element, view);
        }
      }
    });
  }
}

opticsLab.register("PresetsScreenView", PresetsScreenView);
