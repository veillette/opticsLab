/**
 * Deserialization of optical elements from plain objects (saved scenes, PhET-iO state).
 */

import { ApertureElement } from "../blockers/ApertureElement.js";
import { LineBlocker } from "../blockers/LineBlocker.js";
import { DetectorElement } from "../detectors/DetectorElement.js";
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
  type: "PointSource",
  x: 0,
  y: 0,
  brightness: 0.5,
  wavelength: 550,
  id: "archetype",
};

/** Internal key: live model reference when adding an element without round-trip clone. */
export const LIVE_ELEMENT_STATE_KEY = "__opticsLabLiveElement__";

function asPoint(v: unknown): Point {
  const p = v as { x: number; y: number };
  return point(p.x, p.y);
}

function assignElementId(element: OpticalElement, rawId: unknown): void {
  if (typeof rawId === "string" && element instanceof BaseElement) {
    element.reassignIdForDeserialization(rawId);
  }
}

export function deserializeElement(obj: Record<string, unknown>): OpticalElement | null {
  switch (obj["type"]) {
    case "PointSource": {
      const el = new PointSourceElement(
        point(obj["x"] as number, obj["y"] as number),
        obj["brightness"] as number,
        obj["wavelength"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "Beam": {
      const el = new BeamSource(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["brightness"] as number,
        obj["wavelength"] as number,
        obj["emisAngle"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "SingleRay": {
      const el = new SingleRaySource(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["brightness"] as number,
        obj["wavelength"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "ArcSource": {
      const el = new ArcLightSource(
        point(obj["x"] as number, obj["y"] as number),
        obj["direction"] as number,
        obj["emissionAngle"] as number,
        obj["brightness"] as number,
        obj["wavelength"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "continuousSpectrumSource": {
      const el = new ContinuousSpectrumSource(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["wavelengthMin"] as number,
        obj["wavelengthStep"] as number,
        obj["wavelengthMax"] as number,
        obj["brightness"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "Mirror": {
      const el = new SegmentMirror(asPoint(obj["p1"]), asPoint(obj["p2"]));
      assignElementId(el, obj["id"]);
      return el;
    }
    case "ArcMirror": {
      const el = new ArcMirror(asPoint(obj["p1"]), asPoint(obj["p2"]), asPoint(obj["p3"]));
      assignElementId(el, obj["id"]);
      return el;
    }
    case "ParabolicMirror": {
      const el = new ParabolicMirror(asPoint(obj["p1"]), asPoint(obj["p2"]), asPoint(obj["p3"]));
      assignElementId(el, obj["id"]);
      return el;
    }
    case "IdealMirror": {
      const el = new IdealCurvedMirror(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["focalLength"] as number);
      assignElementId(el, obj["id"]);
      return el;
    }
    case "BeamSplitter": {
      const el = new BeamSplitterElement(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["transRatio"] as number);
      assignElementId(el, obj["id"]);
      return el;
    }
    case "Glass": {
      const el = new Glass(obj["path"] as GlassPathPoint[], obj["refIndex"] as number);
      assignElementId(el, obj["id"]);
      return el;
    }
    case "EquilateralPrism": {
      const el = new EquilateralPrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["size"] as number,
        obj["refIndex"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "RightAnglePrism": {
      const el = new RightAnglePrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["legLength"] as number,
        obj["refIndex"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "PorroPrism": {
      const el = new PorroPrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["legLength"] as number,
        obj["refIndex"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "SlabGlass": {
      const el = new SlabGlass(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["width"] as number,
        obj["height"] as number,
        obj["refIndex"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "ParallelogramPrism": {
      const el = new ParallelogramPrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["width"] as number,
        obj["height"] as number,
        obj["refIndex"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "DovePrism": {
      const el = new DovePrism(
        point(obj["cx"] as number, obj["cy"] as number),
        obj["width"] as number,
        obj["height"] as number,
        obj["refIndex"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "SphericalLens": {
      const lens = new SphericalLens(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["r1"] as number,
        obj["r2"] as number,
        obj["refIndex"] as number,
      );
      lens.createLensWithDR1R2(obj["d"] as number, obj["r1"] as number, obj["r2"] as number);
      assignElementId(lens, obj["id"]);
      return lens;
    }
    case "CircleGlass": {
      const el = new CircleGlass(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["refIndex"] as number);
      assignElementId(el, obj["id"]);
      return el;
    }
    case "PlaneGlass": {
      const el = new HalfPlaneGlass(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["refIndex"] as number);
      assignElementId(el, obj["id"]);
      return el;
    }
    case "IdealLens": {
      const el = new IdealLens(asPoint(obj["p1"]), asPoint(obj["p2"]), obj["focalLength"] as number);
      assignElementId(el, obj["id"]);
      return el;
    }
    case "Aperture": {
      const el = new ApertureElement(asPoint(obj["p1"]), asPoint(obj["p2"]), asPoint(obj["p3"]), asPoint(obj["p4"]));
      assignElementId(el, obj["id"]);
      return el;
    }
    case "Blocker": {
      const el = new LineBlocker(asPoint(obj["p1"]), asPoint(obj["p2"]));
      assignElementId(el, obj["id"]);
      return el;
    }
    case "Detector": {
      const el = new DetectorElement(asPoint(obj["p1"]), asPoint(obj["p2"]));
      assignElementId(el, obj["id"]);
      return el;
    }
    case "ReflectionGrating": {
      const el = new ReflectionGrating(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["linesDensity"] as number,
        obj["dutyCycle"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "TransmissionGrating": {
      const el = new TransmissionGrating(
        asPoint(obj["p1"]),
        asPoint(obj["p2"]),
        obj["linesDensity"] as number,
        obj["dutyCycle"] as number,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    case "Track": {
      const el = new TrackElement(asPoint(obj["p1"]), asPoint(obj["p2"]));
      assignElementId(el, obj["id"]);
      return el;
    }
    default:
      return null;
  }
}
