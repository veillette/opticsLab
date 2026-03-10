import { Property } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import { RayTracingCommonModel } from "../common/model/SimModel.js";
import opticsLab from "../OpticsLabNamespace.js";
import { getPresetDescriptors, type PresetId } from "./PresetScenes.js";

export class PresetsModel extends RayTracingCommonModel {
  public readonly selectedPresetProperty: Property<PresetId>;

  public constructor(tandem: Tandem) {
    super(tandem);

    this.selectedPresetProperty = new Property<PresetId>("empty");

    // Load elements whenever the selected preset changes.
    this.selectedPresetProperty.link((presetId) => {
      this.scene.clearElements();
      const descriptors = getPresetDescriptors();
      const preset = descriptors.find((d) => d.id === presetId);
      if (preset) {
        for (const element of preset.createElements()) {
          this.scene.addElement(element);
        }
      }
    });
  }

  public override reset(): void {
    super.reset();
    this.selectedPresetProperty.reset();
  }
}

opticsLab.register("PresetsModel", PresetsModel);
