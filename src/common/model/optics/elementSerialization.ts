/**
 * Deserialization of optical elements from plain objects (saved scenes, PhET-iO state).
 */

import { ARCHETYPE_DEFAULT_WAVELENGTH_NM, DEFAULT_BEAM_BRIGHTNESS } from "../../../OpticsLabConstants.js";
import {
  ELEMENT_TYPE_APERTURE,
  ELEMENT_TYPE_ARC_MIRROR,
  ELEMENT_TYPE_ARC_SOURCE,
  ELEMENT_TYPE_BEAM,
  ELEMENT_TYPE_BEAM_SPLITTER,
  ELEMENT_TYPE_CIRCLE_GLASS,
  ELEMENT_TYPE_CONTINUOUS_SPECTRUM_SOURCE,
  ELEMENT_TYPE_DETECTOR,
  ELEMENT_TYPE_DIVERGENT_BEAM,
  ELEMENT_TYPE_DOVE_PRISM,
  ELEMENT_TYPE_EQUILATERAL_PRISM,
  ELEMENT_TYPE_FIBER_OPTIC,
  ELEMENT_TYPE_GLASS,
  ELEMENT_TYPE_IDEAL_LENS,
  ELEMENT_TYPE_IDEAL_MIRROR,
  ELEMENT_TYPE_LINE_BLOCKER,
  ELEMENT_TYPE_PARABOLIC_MIRROR,
  ELEMENT_TYPE_PARALLELOGRAM_PRISM,
  ELEMENT_TYPE_PLANE_GLASS,
  ELEMENT_TYPE_POINT_SOURCE,
  ELEMENT_TYPE_PORRO_PRISM,
  ELEMENT_TYPE_REFLECTION_GRATING,
  ELEMENT_TYPE_RIGHT_ANGLE_PRISM,
  ELEMENT_TYPE_SEGMENT_MIRROR,
  ELEMENT_TYPE_SINGLE_RAY,
  ELEMENT_TYPE_SLAB_GLASS,
  ELEMENT_TYPE_SPHERICAL_LENS,
  ELEMENT_TYPE_TRACK,
  ELEMENT_TYPE_TRANSMISSION_GRATING,
} from "../../../OpticsLabStrings.js";
import { ApertureElement } from "../blockers/ApertureElement.js";
import { LineBlocker } from "../blockers/LineBlocker.js";
import { DetectorElement } from "../detectors/DetectorElement.js";
import { FiberOpticElement } from "../fiber/FiberOpticElement.js";
import { CircleGlass } from "../glass/CircleGlass.js";
import { DovePrism } from "../glass/DovePrism.js";
import { EquilateralPrism } from "../glass/EquilateralPrism.js";
import type { GlassPathPoint } from "../glass/Glass.js";
import { Glass } from "../glass/Glass.js";
import { HalfPlaneGlass } from "../glass/HalfPlaneGlass.js";
import { IdealLens } from "../glass/IdealLens.js";
import { ParallelogramPrism } from "../glass/ParallelogramPrism.js";
import { PorroPrism } from "../glass/PorroPrism.js";
import { RightAnglePrism } from "../glass/RightAnglePrism.js";
import { SlabGlass } from "../glass/SlabGlass.js";
import { SphericalLens } from "../glass/SphericalLens.js";
import { ReflectionGrating } from "../gratings/ReflectionGrating.js";
import { TransmissionGrating } from "../gratings/TransmissionGrating.js";
import { TrackElement } from "../guides/TrackElement.js";
import { ArcLightSource } from "../light-sources/ArcLightSource.js";
import { BeamSource } from "../light-sources/BeamSource.js";
import { ContinuousSpectrumSource } from "../light-sources/ContinuousSpectrumSource.js";
import { DivergentBeam } from "../light-sources/DivergentBeam.js";
import { PointSourceElement } from "../light-sources/PointSourceElement.js";
import { SingleRaySource } from "../light-sources/SingleRaySource.js";
import { ArcMirror } from "../mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "../mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../mirrors/SegmentMirror.js";
import { BaseElement } from "./BaseElement.js";
import type { Point } from "./Geometry.js";
import { point } from "./Geometry.js";
import type { OpticalElement } from "./OpticsTypes.js";

/** Default serialized shape for the PhET-iO group archetype (PointSource). */
export const ARCHETYPE_ELEMENT_STATE: Record<string, unknown> = {
  type: ELEMENT_TYPE_POINT_SOURCE,
  x: 0,
  y: 0,
  brightness: DEFAULT_BEAM_BRIGHTNESS,
  wavelength: ARCHETYPE_DEFAULT_WAVELENGTH_NM,
  id: "archetype",
};

/** Internal key: live model reference when adding an element without round-trip clone. */
export const LIVE_ELEMENT_STATE_KEY = "__opticsLabLiveElement__";

function asPoint(v: unknown, field: string): Point {
  if (
    typeof v !== "object" ||
    v === null ||
    typeof (v as Record<string, unknown>)["x"] !== "number" ||
    typeof (v as Record<string, unknown>)["y"] !== "number"
  ) {
    throw new Error(`Invalid point at field "${field}": ${JSON.stringify(v)}`);
  }
  const p = v as { x: number; y: number };
  if (!(Number.isFinite(p.x) && Number.isFinite(p.y))) {
    throw new Error(`Non-finite point at field "${field}": ${JSON.stringify(v)}`);
  }
  return point(p.x, p.y);
}

function asNumber(v: unknown, field: string, min?: number, max?: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`Invalid number at field "${field}": ${JSON.stringify(v)}`);
  }
  if (min !== undefined && v < min) {
    throw new Error(`Value at field "${field}" (${v}) is below minimum ${min}`);
  }
  if (max !== undefined && v > max) {
    throw new Error(`Value at field "${field}" (${v}) exceeds maximum ${max}`);
  }
  return v;
}

function assignElementId(element: OpticalElement, rawId: unknown): void {
  if (typeof rawId === "string" && element instanceof BaseElement) {
    element.reassignIdForDeserialization(rawId);
  }
}

/** Minimum allowed refractive index (must be strictly positive and non-zero). */
const REF_INDEX_MIN = 1e-9;

export function deserializeElement(obj: Record<string, unknown>): OpticalElement | null {
  switch (obj["type"]) {
    case ELEMENT_TYPE_POINT_SOURCE: {
      const el = new PointSourceElement(
        point(asNumber(obj["x"], "x"), asNumber(obj["y"], "y")),
        asNumber(obj["brightness"], "brightness", 0),
        asNumber(obj["wavelength"], "wavelength", 0),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_BEAM: {
      const el = new BeamSource(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["brightness"], "brightness", 0),
        asNumber(obj["wavelength"], "wavelength", 0),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_DIVERGENT_BEAM: {
      const el = new DivergentBeam(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["brightness"], "brightness", 0),
        asNumber(obj["wavelength"], "wavelength", 0),
        asNumber(obj["emisAngle"], "emisAngle", 0),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_SINGLE_RAY: {
      const el = new SingleRaySource(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["brightness"], "brightness", 0),
        asNumber(obj["wavelength"], "wavelength", 0),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_ARC_SOURCE: {
      const el = new ArcLightSource(
        point(asNumber(obj["x"], "x"), asNumber(obj["y"], "y")),
        asNumber(obj["direction"], "direction"),
        asNumber(obj["emissionAngle"], "emissionAngle", 0),
        asNumber(obj["brightness"], "brightness", 0),
        asNumber(obj["wavelength"], "wavelength", 0),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_CONTINUOUS_SPECTRUM_SOURCE: {
      const el = new ContinuousSpectrumSource(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["wavelengthMin"], "wavelengthMin", 0),
        asNumber(obj["wavelengthStep"], "wavelengthStep", 0),
        asNumber(obj["wavelengthMax"], "wavelengthMax", 0),
        asNumber(obj["brightness"], "brightness", 0),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_SEGMENT_MIRROR: {
      const el = new SegmentMirror(asPoint(obj["p1"], "p1"), asPoint(obj["p2"], "p2"));
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_ARC_MIRROR: {
      const el = new ArcMirror(asPoint(obj["p1"], "p1"), asPoint(obj["p2"], "p2"), asPoint(obj["p3"], "p3"));
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_PARABOLIC_MIRROR: {
      const el = new ParabolicMirror(asPoint(obj["p1"], "p1"), asPoint(obj["p2"], "p2"), asPoint(obj["p3"], "p3"));
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_IDEAL_MIRROR: {
      const el = new IdealCurvedMirror(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["focalLength"], "focalLength"),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_BEAM_SPLITTER: {
      const el = new BeamSplitterElement(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["transRatio"], "transRatio", 0, 1),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_GLASS: {
      if (!Array.isArray(obj["path"]) || (obj["path"] as unknown[]).length < 3) {
        throw new Error(`Glass path must have at least 3 vertices`);
      }
      const el = new Glass(obj["path"] as GlassPathPoint[], asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN));
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_EQUILATERAL_PRISM: {
      const el = new EquilateralPrism(
        point(asNumber(obj["cx"], "cx"), asNumber(obj["cy"], "cy")),
        asNumber(obj["size"], "size", 0),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_RIGHT_ANGLE_PRISM: {
      const el = new RightAnglePrism(
        point(asNumber(obj["cx"], "cx"), asNumber(obj["cy"], "cy")),
        asNumber(obj["legLength"], "legLength", 0),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_PORRO_PRISM: {
      const el = new PorroPrism(
        point(asNumber(obj["cx"], "cx"), asNumber(obj["cy"], "cy")),
        asNumber(obj["legLength"], "legLength", 0),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_SLAB_GLASS: {
      const el = new SlabGlass(
        point(asNumber(obj["cx"], "cx"), asNumber(obj["cy"], "cy")),
        asNumber(obj["width"], "width", 0),
        asNumber(obj["height"], "height", 0),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      if (typeof obj["rotation"] === "number" && obj["rotation"] !== 0) {
        el.setRotation(obj["rotation"]);
      }
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_PARALLELOGRAM_PRISM: {
      const el = new ParallelogramPrism(
        point(asNumber(obj["cx"], "cx"), asNumber(obj["cy"], "cy")),
        asNumber(obj["width"], "width", 0),
        asNumber(obj["height"], "height", 0),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      if (typeof obj["rotation"] === "number" && obj["rotation"] !== 0) {
        el.setRotation(obj["rotation"]);
      }
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_DOVE_PRISM: {
      const el = new DovePrism(
        point(asNumber(obj["cx"], "cx"), asNumber(obj["cy"], "cy")),
        asNumber(obj["width"], "width", 0),
        asNumber(obj["height"], "height", 0),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      if (typeof obj["rotation"] === "number" && obj["rotation"] !== 0) {
        el.setRotation(obj["rotation"]);
      }
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_SPHERICAL_LENS: {
      const r1 = asNumber(obj["r1"], "r1");
      const r2 = asNumber(obj["r2"], "r2");
      const d = asNumber(obj["d"], "d", 0);
      const lens = new SphericalLens(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        r1,
        r2,
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      lens.createLensWithDR1R2(d, r1, r2);
      assignElementId(lens, obj["id"]);
      return lens;
    }
    case ELEMENT_TYPE_CIRCLE_GLASS: {
      const el = new CircleGlass(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_PLANE_GLASS: {
      const el = new HalfPlaneGlass(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_IDEAL_LENS: {
      const el = new IdealLens(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["focalLength"], "focalLength"),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_APERTURE: {
      const el = new ApertureElement(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asPoint(obj["p3"], "p3"),
        asPoint(obj["p4"], "p4"),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_LINE_BLOCKER: {
      const el = new LineBlocker(asPoint(obj["p1"], "p1"), asPoint(obj["p2"], "p2"));
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_DETECTOR: {
      const p3 = obj["p3"] !== undefined ? asPoint(obj["p3"], "p3") : undefined;
      const el = new DetectorElement(asPoint(obj["p1"], "p1"), asPoint(obj["p2"], "p2"), p3);
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_REFLECTION_GRATING: {
      const el = new ReflectionGrating(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["linesDensity"], "linesDensity", 0),
        asNumber(obj["dutyCycle"], "dutyCycle", 1e-9, 1 - 1e-9),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_TRANSMISSION_GRATING: {
      const el = new TransmissionGrating(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["linesDensity"], "linesDensity", 0),
        asNumber(obj["dutyCycle"], "dutyCycle", 1e-9, 1 - 1e-9),
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_TRACK: {
      const el = new TrackElement(asPoint(obj["p1"], "p1"), asPoint(obj["p2"], "p2"));
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_FIBER_OPTIC: {
      const claddingRefIndex = asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN);
      const coreRefIndex =
        obj["coreRefIndex"] !== undefined ? asNumber(obj["coreRefIndex"], "coreRefIndex", REF_INDEX_MIN) : undefined;
      if (coreRefIndex !== undefined && coreRefIndex <= claddingRefIndex) {
        throw new Error(
          `Fiber core refractive index (${coreRefIndex}) must exceed cladding index (${claddingRefIndex}) for total internal reflection guiding`,
        );
      }
      const el = new FiberOpticElement(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["cp1"], "cp1"),
        asPoint(obj["cp2"], "cp2"),
        asPoint(obj["cp3"], "cp3"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["outerRadius"], "outerRadius", 0),
        claddingRefIndex,
        obj["coreRadiusFraction"] !== undefined
          ? asNumber(obj["coreRadiusFraction"], "coreRadiusFraction", 0, 1)
          : undefined,
        coreRefIndex,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    default:
      return null;
  }
}
