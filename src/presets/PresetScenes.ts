/**
 * PresetScenes.ts
 *
 * Defines the available preset scene configurations for the Presets screen.
 * Each preset is a named factory that produces a set of OpticalElements
 * positioned in model coordinates (metres, y-up, origin at centre).
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import { Glass } from "../common/model/glass/Glass.js";
import { SphericalLens } from "../common/model/glass/SphericalLens.js";
import { BeamSource } from "../common/model/light-sources/BeamSource.js";
import { SingleRaySource } from "../common/model/light-sources/SingleRaySource.js";
import { SegmentMirror } from "../common/model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../common/model/optics/OpticsTypes.js";
import { StringManager } from "../i18n/StringManager.js";
import opticsLab from "../OpticsLabNamespace.js";

// ── Preset identifiers ──────────────────────────────────────────────────────

export type PresetId = "empty" | "convexLensFocus" | "mirrorReflection" | "prismRefraction";

export interface PresetDescriptor {
  id: PresetId;
  label: ReadOnlyProperty<string>;
  createElements: () => OpticalElement[];
}

export function getPresetDescriptors(): PresetDescriptor[] {
  const s = StringManager.getInstance().getPresetsStrings();

  return [
    {
      id: "empty",
      label: s.emptyLabStringProperty,
      createElements: () => [],
    },
    {
      id: "convexLensFocus",
      label: s.convexLensFocusStringProperty,
      createElements: () => [
        // Beam on the left, pointing right
        new BeamSource({ x: -3, y: -0.5 }, { x: -3, y: 0.5 }, 0.5, 532, 0),
        // Convex (biconvex) spherical lens at the centre
        new SphericalLens({ x: 0, y: -0.8 }, { x: 0, y: 0.8 }, 1.2, -1.2, 1.5),
      ],
    },
    {
      id: "mirrorReflection",
      label: s.mirrorReflectionStringProperty,
      createElements: () => [
        // Single ray approaching from the left
        new SingleRaySource({ x: -3, y: 0 }, { x: -1, y: 0.8 }, 1.0),
        // Flat mirror on the right, vertical
        new SegmentMirror({ x: 1, y: -1 }, { x: 1, y: 1 }),
      ],
    },
    {
      id: "prismRefraction",
      label: s.prismRefractionStringProperty,
      createElements: () => [
        // Beam on the left
        new BeamSource({ x: -3, y: -0.3 }, { x: -3, y: 0.3 }, 0.5, 532, 0),
        // Triangular prism at the centre
        new Glass(
          [
            { x: 0, y: 0.9 },
            { x: 0.8, y: -0.6 },
            { x: -0.8, y: -0.6 },
          ],
          1.5,
        ),
      ],
    },
  ];
}

opticsLab.register("PresetScenes", { getPresetDescriptors });
