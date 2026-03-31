/**
 * PresetScenes.ts
 *
 * Defines the available preset scene configurations for the Presets screen.
 * Each preset is a named factory that produces a set of OpticalElements
 * positioned in model coordinates (metres, y-up, origin at centre).
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import { BiconcaveLens } from "../common/model/glass/BiconcaveLens.js";
import { Glass } from "../common/model/glass/Glass.js";
import { PlanoConvexLens } from "../common/model/glass/PlanoConvexLens.js";
import { SlabGlass } from "../common/model/glass/SlabGlass.js";
import { SphericalLens } from "../common/model/glass/SphericalLens.js";
import { BeamSource } from "../common/model/light-sources/BeamSource.js";
import { SingleRaySource } from "../common/model/light-sources/SingleRaySource.js";
import { BeamSplitterElement } from "../common/model/mirrors/BeamSplitterElement.js";
import { ParabolicMirror } from "../common/model/mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../common/model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../common/model/optics/OpticsTypes.js";
import { StringManager } from "../i18n/StringManager.js";
import {
  DEFAULT_BEAM_BRIGHTNESS,
  DEFAULT_BEAM_SPLITTER_TRANSMIT,
  DEFAULT_BEAM_WAVELENGTH_NM,
  DEFAULT_COMPONENT_GLASS_INDEX,
  DEFAULT_SINGLE_RAY_BRIGHTNESS,
} from "../OpticsLabConstants.js";
import opticsLab from "../OpticsLabNamespace.js";

// ── Preset identifiers ──────────────────────────────────────────────────────

export type PresetId =
  | "empty"
  | "convexLensFocus"
  | "mirrorReflection"
  | "prismRefraction"
  | "biconcaveDiverging"
  | "planoConvexFocus"
  | "parabolicMirrorFocus"
  | "beamSplitter"
  | "glassSlabOblique"
  | "microscope"
  | "telescope";

/** Values for PhET-iO `StringUnionIO` (must match {@link PresetId}). */
export const PRESET_ID_VALUES = [
  "empty",
  "convexLensFocus",
  "mirrorReflection",
  "prismRefraction",
  "biconcaveDiverging",
  "planoConvexFocus",
  "parabolicMirrorFocus",
  "beamSplitter",
  "glassSlabOblique",
  "microscope",
  "telescope",
] as const satisfies readonly PresetId[];

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
        new BeamSource({ x: -3, y: -0.5 }, { x: -3, y: 0.5 }, DEFAULT_BEAM_BRIGHTNESS, DEFAULT_BEAM_WAVELENGTH_NM),
        // Convex (biconvex) spherical lens at the centre
        new SphericalLens({ x: 0, y: -0.8 }, { x: 0, y: 0.8 }, 1.2, -1.2, DEFAULT_COMPONENT_GLASS_INDEX),
      ],
    },
    {
      id: "mirrorReflection",
      label: s.mirrorReflectionStringProperty,
      createElements: () => [
        // Single ray approaching from the left
        new SingleRaySource({ x: -3, y: 0 }, { x: -1, y: 0.4 }, DEFAULT_SINGLE_RAY_BRIGHTNESS),
        // Flat mirror on the right, vertical
        new SegmentMirror({ x: 1, y: -1 }, { x: 1, y: 1 }),
      ],
    },
    {
      id: "prismRefraction",
      label: s.prismRefractionStringProperty,
      createElements: () => [
        // Beam on the left
        new BeamSource({ x: -3, y: -0.3 }, { x: -3, y: 0.3 }, DEFAULT_BEAM_BRIGHTNESS, DEFAULT_BEAM_WAVELENGTH_NM),
        // Triangular prism at the centre
        new Glass(
          [
            { x: 0, y: 0.9 },
            { x: 0.8, y: -0.6 },
            { x: -0.8, y: -0.6 },
          ],
          DEFAULT_COMPONENT_GLASS_INDEX,
        ),
      ],
    },
    {
      id: "biconcaveDiverging",
      label: s.biconcaveDivergingStringProperty,
      createElements: () => [
        new BeamSource({ x: -3, y: -0.5 }, { x: -3, y: 0.5 }, DEFAULT_BEAM_BRIGHTNESS, DEFAULT_BEAM_WAVELENGTH_NM),
        new BiconcaveLens({ x: 0, y: -0.8 }, { x: 0, y: 0.8 }, 1.2, DEFAULT_COMPONENT_GLASS_INDEX),
      ],
    },
    {
      id: "planoConvexFocus",
      label: s.planoConvexFocusStringProperty,
      createElements: () => [
        new BeamSource({ x: -3, y: -0.45 }, { x: -3, y: 0.45 }, DEFAULT_BEAM_BRIGHTNESS, DEFAULT_BEAM_WAVELENGTH_NM),
        new PlanoConvexLens({ x: 0, y: -0.85 }, { x: 0, y: 0.85 }, 1.4, DEFAULT_COMPONENT_GLASS_INDEX),
      ],
    },
    {
      id: "parabolicMirrorFocus",
      label: s.parabolicMirrorFocusStringProperty,
      createElements: () => [
        new BeamSource({ x: -2, y: -0.45 }, { x: -2, y: 0.45 }, DEFAULT_BEAM_BRIGHTNESS, DEFAULT_BEAM_WAVELENGTH_NM),
        new ParabolicMirror({ x: 0, y: -0.85 }, { x: 0, y: 0.85 }, { x: 0.55, y: 0 }),
      ],
    },
    {
      id: "beamSplitter",
      label: s.beamSplitterStringProperty,
      createElements: () => [
        new SingleRaySource({ x: -2.2, y: -1.1 }, { x: 0.2, y: 0.2 }, DEFAULT_SINGLE_RAY_BRIGHTNESS),
        new BeamSplitterElement({ x: -0.35, y: -0.35 }, { x: 0.35, y: 0.35 }, DEFAULT_BEAM_SPLITTER_TRANSMIT),
      ],
    },
    {
      id: "glassSlabOblique",
      label: s.glassSlabObliqueStringProperty,
      createElements: () => [
        new SingleRaySource({ x: -2.8, y: 0.55 }, { x: 1.2, y: -0.35 }, DEFAULT_SINGLE_RAY_BRIGHTNESS),
        new SlabGlass({ x: 0, y: 0 }, 0.55, 1.35, DEFAULT_COMPONENT_GLASS_INDEX),
      ],
    },
    {
      // Compound microscope: narrow beam → short-focal-length objective → long-focal-length eyepiece.
      // Objective f ≈ 0.5 m (r=0.5), eyepiece f ≈ 1.0 m (r=1.0).
      id: "microscope",
      label: s.microscopeStringProperty,
      createElements: () => [
        new BeamSource({ x: -3, y: -0.2 }, { x: -3, y: 0.2 }, DEFAULT_BEAM_BRIGHTNESS, DEFAULT_BEAM_WAVELENGTH_NM),
        new SphericalLens({ x: -1.0, y: -0.3 }, { x: -1.0, y: 0.3 }, 0.5, -0.5, DEFAULT_COMPONENT_GLASS_INDEX),
        new SphericalLens({ x: 1.5, y: -0.45 }, { x: 1.5, y: 0.45 }, 1.0, -1.0, DEFAULT_COMPONENT_GLASS_INDEX),
      ],
    },
    {
      // Keplerian (refracting) telescope: wide parallel beam → large objective (f≈1.2 m) →
      // small eyepiece (f≈0.4 m).  Lenses are separated by f_obj + f_eye = 1.6 m (afocal).
      id: "telescope",
      label: s.telescopeStringProperty,
      createElements: () => [
        new BeamSource({ x: -3, y: -0.65 }, { x: -3, y: 0.65 }, DEFAULT_BEAM_BRIGHTNESS, DEFAULT_BEAM_WAVELENGTH_NM),
        new SphericalLens({ x: -1.0, y: -0.7 }, { x: -1.0, y: 0.7 }, 1.2, -1.2, DEFAULT_COMPONENT_GLASS_INDEX),
        new SphericalLens({ x: 0.6, y: -0.3 }, { x: 0.6, y: 0.3 }, 0.4, -0.4, DEFAULT_COMPONENT_GLASS_INDEX),
      ],
    },
  ];
}

opticsLab.register("PresetScenes", { getPresetDescriptors });
