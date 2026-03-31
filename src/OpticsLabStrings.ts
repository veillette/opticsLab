/**
 * OpticsLabStrings.ts
 *
 * Central repository for every named string constant used across the
 * OpticsLab simulation.  Localised UI strings belong in strings_en.json
 * (and sibling locale files); the constants here are machine-readable
 * identifiers that must remain stable across versions because they appear
 * in serialised scene files, PhET-iO state, and tandem trees.
 *
 * Sections
 * ────────
 *  1. Optical element serialization type strings
 *  2. Optical element category strings
 *  3. View mode strings
 *  4. Application configuration strings
 *  5. Tandem ID strings
 */

import opticsLab from "./OpticsLabNamespace.js";

// ── 1. Optical element serialization type strings ─────────────────────────────
//
// These values must exactly match the `type` field produced by each element's
// serialize() method and consumed by deserializeElement() in
// elementSerialization.ts.  Do NOT change them without a migration path.

/** Serialization type key for {@link PointSourceElement}. */
export const ELEMENT_TYPE_POINT_SOURCE = "PointSource";
/** Serialization type key for {@link BeamSource}. */
export const ELEMENT_TYPE_BEAM = "Beam";
/** Serialization type key for {@link DivergentBeam}. */
export const ELEMENT_TYPE_DIVERGENT_BEAM = "DivergentBeam";
/** Serialization type key for {@link SingleRaySource}. */
export const ELEMENT_TYPE_SINGLE_RAY = "SingleRay";
/** Serialization type key for {@link ArcLightSource}. */
export const ELEMENT_TYPE_ARC_SOURCE = "ArcSource";
/**
 * Serialization type key for {@link ContinuousSpectrumSource}.
 * Note: intentionally camelCase (historical; changing would break saved scenes).
 */
export const ELEMENT_TYPE_CONTINUOUS_SPECTRUM_SOURCE = "continuousSpectrumSource";

/** Serialization type key for {@link SegmentMirror} (flat mirror). */
export const ELEMENT_TYPE_SEGMENT_MIRROR = "Mirror";
/** Serialization type key for {@link ArcMirror}. */
export const ELEMENT_TYPE_ARC_MIRROR = "ArcMirror";
/** Serialization type key for {@link ParabolicMirror}. */
export const ELEMENT_TYPE_PARABOLIC_MIRROR = "ParabolicMirror";
/** Serialization type key for {@link AperturedParabolicMirror}. */
export const ELEMENT_TYPE_APERTURED_PARABOLIC_MIRROR = "AperturedParabolicMirror";
/** Serialization type key for {@link IdealCurvedMirror}. */
export const ELEMENT_TYPE_IDEAL_MIRROR = "IdealMirror";
/** Serialization type key for {@link BeamSplitterElement}. */
export const ELEMENT_TYPE_BEAM_SPLITTER = "BeamSplitter";

/** Serialization type key for {@link Glass} (free-form polygon glass). */
export const ELEMENT_TYPE_GLASS = "Glass";
/** Serialization type key for {@link EquilateralPrism}. */
export const ELEMENT_TYPE_EQUILATERAL_PRISM = "EquilateralPrism";
/** Serialization type key for {@link RightAnglePrism}. */
export const ELEMENT_TYPE_RIGHT_ANGLE_PRISM = "RightAnglePrism";
/** Serialization type key for {@link PorroPrism}. */
export const ELEMENT_TYPE_PORRO_PRISM = "PorroPrism";
/** Serialization type key for {@link SlabGlass}. */
export const ELEMENT_TYPE_SLAB_GLASS = "SlabGlass";
/** Serialization type key for {@link ParallelogramPrism}. */
export const ELEMENT_TYPE_PARALLELOGRAM_PRISM = "ParallelogramPrism";
/** Serialization type key for {@link DovePrism}. */
export const ELEMENT_TYPE_DOVE_PRISM = "DovePrism";
/** Serialization type key for {@link SphericalLens}. */
export const ELEMENT_TYPE_SPHERICAL_LENS = "SphericalLens";
/** Serialization type key for {@link CircleGlass}. */
export const ELEMENT_TYPE_CIRCLE_GLASS = "CircleGlass";
/**
 * Serialization type key for {@link HalfPlaneGlass}.
 * Note: stored as "PlaneGlass" (historical; changing would break saved scenes).
 */
export const ELEMENT_TYPE_PLANE_GLASS = "PlaneGlass";
/** Serialization type key for {@link IdealLens}. */
export const ELEMENT_TYPE_IDEAL_LENS = "IdealLens";
/** Serialization type key for {@link BiconvexLens}. */
export const ELEMENT_TYPE_BICONVEX_LENS = "BiconvexLens";
/** Serialization type key for {@link BiconcaveLens}. */
export const ELEMENT_TYPE_BICONCAVE_LENS = "BiconcaveLens";
/** Serialization type key for {@link PlanoConvexLens}. */
export const ELEMENT_TYPE_PLANO_CONVEX_LENS = "PlanoConvexLens";
/** Serialization type key for {@link PlanoConcaveLens}. */
export const ELEMENT_TYPE_PLANO_CONCAVE_LENS = "PlanoConcaveLens";

/** Serialization type key for {@link ApertureElement}. */
export const ELEMENT_TYPE_APERTURE = "Aperture";
/** Serialization type key for {@link LineBlocker}. */
export const ELEMENT_TYPE_LINE_BLOCKER = "Blocker";
/** Serialization type key for {@link DetectorElement}. */
export const ELEMENT_TYPE_DETECTOR = "Detector";

/** Serialization type key for {@link ReflectionGrating}. */
export const ELEMENT_TYPE_REFLECTION_GRATING = "ReflectionGrating";
/** Serialization type key for {@link TransmissionGrating}. */
export const ELEMENT_TYPE_TRANSMISSION_GRATING = "TransmissionGrating";

/** Serialization type key for {@link TrackElement}. */
export const ELEMENT_TYPE_TRACK = "Track";

/** Serialization type key for {@link FiberOpticElement}. */
export const ELEMENT_TYPE_FIBER_OPTIC = "FiberOptic";
/**
 * Internal type key for the inner-core glass of a {@link FiberOpticElement}.
 * Used for runtime identification only; the fiber optic is deserialized as a
 * single unit via ELEMENT_TYPE_FIBER_OPTIC.
 */
export const ELEMENT_TYPE_FIBER_CORE_GLASS = "FiberCoreGlass";

// ── 2. Optical element category strings ──────────────────────────────────────
//
// These values must match the `ElementCategory` union in OpticsTypes.ts.

/** Category for all light-emitting elements (point source, beam, etc.). */
export const ELEMENT_CATEGORY_LIGHT_SOURCE = "lightSource";
/** Category for all mirror elements (flat, arc, parabolic, ideal, beam splitter). */
export const ELEMENT_CATEGORY_MIRROR = "mirror";
/** Category for all glass/lens elements (prisms, lenses, etc.). */
export const ELEMENT_CATEGORY_GLASS = "glass";
/** Category for blocker and aperture elements. */
export const ELEMENT_CATEGORY_BLOCKER = "blocker";
/** Category for guide/rail elements (track). */
export const ELEMENT_CATEGORY_GUIDE = "guide";

// ── 3. View mode strings ─────────────────────────────────────────────────────
//
// These values must match the `ViewMode` union in OpticsTypes.ts and the
// VIEW_MODE_VALUES array in OpticsScene.ts.

/** Default view mode: show ray paths as discrete line segments. */
export const VIEW_MODE_RAYS = "rays";
/** View mode that also draws backward extensions to locate virtual images. */
export const VIEW_MODE_EXTENDED = "extended";
/** View mode that detects and displays real/virtual image positions. */
export const VIEW_MODE_IMAGES = "images";
/** View mode that shows only rays visible from a specific observer position. */
export const VIEW_MODE_OBSERVER = "observer";

// ── 4. Application configuration strings ─────────────────────────────────────

/** Internal camelCase name of the simulation (used by SceneryStack init). */
export const SIMULATION_NAME = "opticsLab";
/** Semver version string shown in the About dialog. */
export const SIMULATION_VERSION = "1.0.0";
/** Brand identifier shared between init.ts and brand.ts. */
export const BRAND_ID = "made-with-scenerystack";

// ── 5. Tandem ID strings ──────────────────────────────────────────────────────
//
// These string literals define the PhET-iO tandem tree nodes registered at the
// root level.  They appear in saved state files and must not be renamed without
// a migration step.

/** Root tandem name for the OpticsLab preferences model. */
export const TANDEM_OPTICS_LAB_PREFERENCES = "opticsLabPreferences";
/** Root tandem name for the Intro screen. */
export const TANDEM_INTRO_SCREEN = "introScreen";
/** Root tandem name for the Lab screen. */
export const TANDEM_LAB_SCREEN = "labScreen";
/** Root tandem name for the Presets screen. */
export const TANDEM_PRESETS_SCREEN = "presetsScreen";
/** Root tandem name for the Diffraction screen. */
export const TANDEM_DIFFRACTION_SCREEN = "diffractionScreen";

// ─────────────────────────────────────────────────────────────────────────────

opticsLab.register("OpticsLabStrings", {
  ELEMENT_TYPE_POINT_SOURCE,
  ELEMENT_TYPE_BEAM,
  ELEMENT_TYPE_DIVERGENT_BEAM,
  ELEMENT_TYPE_SINGLE_RAY,
  ELEMENT_TYPE_ARC_SOURCE,
  ELEMENT_TYPE_CONTINUOUS_SPECTRUM_SOURCE,
  ELEMENT_TYPE_SEGMENT_MIRROR,
  ELEMENT_TYPE_ARC_MIRROR,
  ELEMENT_TYPE_PARABOLIC_MIRROR,
  ELEMENT_TYPE_APERTURED_PARABOLIC_MIRROR,
  ELEMENT_TYPE_IDEAL_MIRROR,
  ELEMENT_TYPE_BEAM_SPLITTER,
  ELEMENT_TYPE_GLASS,
  ELEMENT_TYPE_EQUILATERAL_PRISM,
  ELEMENT_TYPE_RIGHT_ANGLE_PRISM,
  ELEMENT_TYPE_PORRO_PRISM,
  ELEMENT_TYPE_SLAB_GLASS,
  ELEMENT_TYPE_PARALLELOGRAM_PRISM,
  ELEMENT_TYPE_DOVE_PRISM,
  ELEMENT_TYPE_SPHERICAL_LENS,
  ELEMENT_TYPE_CIRCLE_GLASS,
  ELEMENT_TYPE_PLANE_GLASS,
  ELEMENT_TYPE_IDEAL_LENS,
  ELEMENT_TYPE_BICONVEX_LENS,
  ELEMENT_TYPE_BICONCAVE_LENS,
  ELEMENT_TYPE_PLANO_CONVEX_LENS,
  ELEMENT_TYPE_PLANO_CONCAVE_LENS,
  ELEMENT_TYPE_APERTURE,
  ELEMENT_TYPE_LINE_BLOCKER,
  ELEMENT_TYPE_DETECTOR,
  ELEMENT_TYPE_REFLECTION_GRATING,
  ELEMENT_TYPE_TRANSMISSION_GRATING,
  ELEMENT_TYPE_TRACK,
  ELEMENT_TYPE_FIBER_OPTIC,
  ELEMENT_TYPE_FIBER_CORE_GLASS,
  ELEMENT_CATEGORY_LIGHT_SOURCE,
  ELEMENT_CATEGORY_MIRROR,
  ELEMENT_CATEGORY_GLASS,
  ELEMENT_CATEGORY_BLOCKER,
  ELEMENT_CATEGORY_GUIDE,
  VIEW_MODE_RAYS,
  VIEW_MODE_EXTENDED,
  VIEW_MODE_IMAGES,
  VIEW_MODE_OBSERVER,
  SIMULATION_NAME,
  SIMULATION_VERSION,
  BRAND_ID,
  TANDEM_OPTICS_LAB_PREFERENCES,
  TANDEM_INTRO_SCREEN,
  TANDEM_LAB_SCREEN,
  TANDEM_PRESETS_SCREEN,
  TANDEM_DIFFRACTION_SCREEN,
});
