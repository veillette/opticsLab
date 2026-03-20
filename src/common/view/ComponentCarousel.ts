/**
 * ComponentCarousel.ts
 *
 * A Carousel-based toolbox from which the user can drag optical components
 * onto the scene. Each carousel item is a small icon representing a component
 * type. Pressing an icon creates a new instance of that component at the
 * pointer position in MODEL coordinates, adds it to the model scene, and
 * creates the corresponding interactive view in the elements layer.
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node, Path, type PressListenerEvent, RichDragListener, Text } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import { Carousel, type CarouselItem } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  CAROUSEL_CORNER_RADIUS,
  CAROUSEL_DEFAULT_HALF_SIZE_M,
  CAROUSEL_ICON_SIZE_PX,
  CAROUSEL_ITEM_MARGIN,
  CAROUSEL_ITEM_SPACING,
  CAROUSEL_ITEMS_PER_PAGE,
  CONT_SPECTRUM_SAMPLE_WL,
} from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import { ApertureElement } from "../model/blockers/ApertureElement.js";
import { LineBlocker } from "../model/blockers/LineBlocker.js";
import { DetectorElement } from "../model/detectors/DetectorElement.js";
import { BiconcaveLens } from "../model/glass/BiconcaveLens.js";
import { BiconvexLens } from "../model/glass/BiconvexLens.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { DovePrism } from "../model/glass/DovePrism.js";
import { EquilateralPrism } from "../model/glass/EquilateralPrism.js";
import { Glass } from "../model/glass/Glass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { ParallelogramPrism } from "../model/glass/ParallelogramPrism.js";
import { PlanoConcaveLens } from "../model/glass/PlanoConcaveLens.js";
import { PlanoConvexLens } from "../model/glass/PlanoConvexLens.js";
import { PorroPrism } from "../model/glass/PorroPrism.js";
import { RightAnglePrism } from "../model/glass/RightAnglePrism.js";
import { SlabGlass } from "../model/glass/SlabGlass.js";
import { SphericalLens } from "../model/glass/SphericalLens.js";
import { ReflectionGrating } from "../model/gratings/ReflectionGrating.js";
import { TransmissionGrating } from "../model/gratings/TransmissionGrating.js";
import { TrackElement } from "../model/guides/TrackElement.js";
import { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import { BeamSource } from "../model/light-sources/BeamSource.js";
import { ContinuousSpectrumSource } from "../model/light-sources/ContinuousSpectrumSource.js";
import { PointSourceElement } from "../model/light-sources/PointSourceElement.js";
import { SingleRaySource } from "../model/light-sources/SingleRaySource.js";
import { ArcMirror } from "../model/mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "../model/mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { OpticalElementView } from "./OpticalElementViewFactory.js";

// ── Icon dimensions ──────────────────────────────────────────────────────────
const ICON_SIZE = CAROUSEL_ICON_SIZE_PX;
const ICON_HALF = ICON_SIZE / 2;

// ── Element factory type ─────────────────────────────────────────────────────

/** Unique key for each component type available in the carousel. */
export type ComponentKey =
  | "transmissionGrating"
  | "reflectionGrating"
  | "beam"
  | "singleRay"
  | "continuousSpectrum"
  | "arcSource"
  | "pointSource"
  | "sphericalLens"
  | "biconvexLens"
  | "biconcaveLens"
  | "planoConvexLens"
  | "planoConcaveLens"
  | "idealLens"
  | "circleGlass"
  | "prism"
  | "equilateralPrism"
  | "rightAnglePrism"
  | "porroPrism"
  | "slabGlass"
  | "parallelogramPrism"
  | "dovePrism"
  | "halfPlaneGlass"
  | "flatMirror"
  | "arcMirror"
  | "idealMirror"
  | "parabolicMirror"
  | "lineBlocker"
  | "detector"
  | "aperture"
  | "beamSplitter"
  | "track";

interface ComponentDescriptor {
  key: ComponentKey;
  label: ReadOnlyProperty<string>;
  createIcon: () => Node;
  /** cx, cy are in MODEL coordinates (metres, y-up). */
  createElement: (cx: number, cy: number) => OpticalElement;
}

// ── Icon builders ────────────────────────────────────────────────────────────

function pointSourceIcon(): Node {
  const node = new Node();
  const glow = new Circle(6, {
    fill: OpticsLabColors.arcSourceGlowFillProperty,
    stroke: OpticsLabColors.arcSourceGlowStrokeProperty,
    lineWidth: 1.5,
  });
  node.addChild(glow);
  const spokeShape = new Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    spokeShape.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
    spokeShape.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
  }
  node.addChild(
    new Path(spokeShape, {
      stroke: OpticsLabColors.arcSourceSpokeStrokeProperty,
      lineWidth: 1,
    }),
  );
  return node;
}

function arcSourceIcon(): Node {
  const node = new Node();
  const rimShape = new Shape().arc(0, 0, 14, -Math.PI * 0.6, Math.PI * 0.6, false);
  node.addChild(new Path(rimShape, { stroke: OpticsLabColors.arcSourceRimStrokeProperty, lineWidth: 1 }));
  const sectorShape = new Shape()
    .moveTo(0, 0)
    .arc(0, 0, 14, -Math.PI * 0.3, Math.PI * 0.3, false)
    .close();
  node.addChild(
    new Path(sectorShape, {
      fill: OpticsLabColors.arcSourceSectorFillProperty,
      stroke: OpticsLabColors.arcSourceSectorStrokeProperty,
      lineWidth: 1.2,
    }),
  );
  const spokeShape = new Shape();
  for (let i = -2; i <= 2; i++) {
    const a = (i / 2) * Math.PI * 0.55;
    spokeShape.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
    spokeShape.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
  }
  node.addChild(new Path(spokeShape, { stroke: OpticsLabColors.arcSourceSpokeStrokeProperty, lineWidth: 1 }));
  node.addChild(
    new Circle(4, {
      fill: OpticsLabColors.arcSourceGlowFillProperty,
      stroke: OpticsLabColors.arcSourceGlowStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function beamSourceIcon(): Node {
  const node = new Node();
  for (let dy = -8; dy <= 8; dy += 8) {
    const shape = new Shape().moveTo(-12, dy).lineTo(8, dy);
    node.addChild(new Path(shape, { stroke: OpticsLabColors.iconRayStrokeProperty, lineWidth: 1.5 }));
    const arrow = new Shape()
      .moveTo(5, dy - 4)
      .lineTo(12, dy)
      .lineTo(5, dy + 4);
    node.addChild(
      new Path(arrow, {
        stroke: OpticsLabColors.iconRayStrokeProperty,
        lineWidth: 1.5,
        lineCap: "round",
        lineJoin: "round",
      }),
    );
  }
  return node;
}

function singleRayIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(10, 0);
  node.addChild(new Path(shape, { stroke: OpticsLabColors.iconRayStrokeProperty, lineWidth: 2 }));
  const arrow = new Shape().moveTo(6, -5).lineTo(14, 0).lineTo(6, 5);
  node.addChild(
    new Path(arrow, {
      stroke: OpticsLabColors.iconRayStrokeProperty,
      lineWidth: 2,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function contSpectrumIcon(): Node {
  const node = new Node();
  // Rainbow disc: colored arcs.
  const arcSpan = (Math.PI * 2) / CONT_SPECTRUM_SAMPLE_WL.length;
  for (let i = 0; i < CONT_SPECTRUM_SAMPLE_WL.length; i++) {
    const wl = CONT_SPECTRUM_SAMPLE_WL[i] ?? CONT_SPECTRUM_SAMPLE_WL[0];
    const c = VisibleColor.wavelengthToColor(wl);
    const shape = new Shape().arc(0, 0, 9, i * arcSpan, (i + 1) * arcSpan);
    node.addChild(new Path(shape, { stroke: `rgba(${c.r},${c.g},${c.b},0.9)`, lineWidth: 2.5 }));
  }
  // Direction arrow in white.
  const line = new Shape().moveTo(0, 0).lineTo(14, 0);
  node.addChild(new Path(line, { stroke: OpticsLabColors.sourceDirLineStrokeProperty, lineWidth: 1.5 }));
  const arrow = new Shape().moveTo(10, -4).lineTo(14, 0).lineTo(10, 4);
  node.addChild(
    new Path(arrow, {
      stroke: OpticsLabColors.sourceDirArrowStrokeProperty,
      lineWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function segmentMirrorIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(new Path(shape, { stroke: OpticsLabColors.mirrorBackStrokeProperty, lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(shape, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: 2, lineCap: "round" }));
  return node;
}

function arcMirrorIcon(): Node {
  const node = new Node();
  const shape = new Shape().arc(0, 20, 24, -Math.PI * 0.75, -Math.PI * 0.25);
  node.addChild(new Path(shape, { stroke: OpticsLabColors.mirrorBackStrokeProperty, lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(shape, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: 2, lineCap: "round" }));
  return node;
}

function parabolicMirrorIcon(): Node {
  const node = new Node();
  const shape = new Shape();
  const N = 20;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * 2 - 1;
    const x = t * 14;
    const y = -t * t * 10 + 4;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: 4,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: 2,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function idealCurvedMirrorIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(
    new Path(lineShape, { stroke: OpticsLabColors.mirrorBackStrokeProperty, lineWidth: 4, lineCap: "round" }),
  );
  node.addChild(
    new Path(lineShape, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: 2, lineCap: "round" }),
  );
  node.addChild(new Circle(2.5, { x: 0, y: -8, fill: OpticsLabColors.pointSourceFillProperty }));
  return node;
}

function beamSplitterIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(-10, 10).lineTo(10, -10);
  node.addChild(
    new Path(lineShape, { stroke: OpticsLabColors.beamSplitterIconBodyStrokeProperty, lineWidth: 2, lineDash: [4, 3] }),
  );
  node.addChild(
    new Path(new Shape().moveTo(0, 0).lineTo(-10, -10), {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  node.addChild(
    new Path(new Shape().moveTo(0, 0).lineTo(10, 10), {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function idealLensIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(0, -14).lineTo(0, 14);
  node.addChild(
    new Path(lineShape, { stroke: OpticsLabColors.idealLensStrokeProperty, lineWidth: 2.5, lineCap: "round" }),
  );
  const topArrow = new Shape().moveTo(-5, -10).lineTo(0, -14).lineTo(5, -10);
  const botArrow = new Shape().moveTo(-5, 10).lineTo(0, 14).lineTo(5, 10);
  node.addChild(
    new Path(topArrow, {
      stroke: OpticsLabColors.idealLensStrokeProperty,
      lineWidth: 2,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  node.addChild(
    new Path(botArrow, {
      stroke: OpticsLabColors.idealLensStrokeProperty,
      lineWidth: 2,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function circleGlassIcon(): Node {
  const node = new Node();
  node.addChild(
    new Circle(12, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function sphericalLensIcon(): Node {
  const node = new Node();
  const shape = new Shape()
    .arc(-12, 0, 18, -Math.PI / 4, Math.PI / 4)
    .arc(12, 0, 18, Math.PI - Math.PI / 4, Math.PI + Math.PI / 4)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function biconvexLensIcon(): Node {
  const node = new Node();
  const shape = new Shape()
    .arc(-8, 0, 14, -Math.PI / 3.5, Math.PI / 3.5)
    .arc(8, 0, 14, Math.PI - Math.PI / 3.5, Math.PI + Math.PI / 3.5)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function biconcaveLensIcon(): Node {
  const node = new Node();
  const shape = new Shape()
    .arc(18, 0, 12, Math.PI - Math.PI / 2.5, Math.PI + Math.PI / 2.5)
    .arc(-18, 0, 12, -Math.PI / 2.5, Math.PI / 2.5)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function planoConvexLensIcon(): Node {
  const node = new Node();
  // Flat left, convex right
  const h = 12;
  const shape = new Shape()
    .moveTo(10, -h)
    .arc(16, 0, Math.hypot(20, h), -Math.atan2(h, 20), +Math.atan2(h, 20), false)
    .lineTo(10, h)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function planoConcaveLensIcon(): Node {
  const node = new Node();
  // Flat left, concave right
  const h = 12;
  const shape = new Shape()

    .moveTo(-4, h)
    .arc(16, 0, Math.hypot(10, h), Math.PI - Math.atan2(h, 10), Math.PI + Math.atan2(h, 10))
    .lineTo(-4, -h)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function polygonGlassIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(0, -12).lineTo(12, 10).lineTo(-12, 10).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function equilateralPrismIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(0, -12).lineTo(11, 9).lineTo(-11, 9).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function rightAnglePrismIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-9, 9).lineTo(9, 9).lineTo(-9, -9).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function porroPrismIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-4, -11).lineTo(-4, 11).lineTo(8, 0).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function slabGlassIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-12, -6).lineTo(12, -6).lineTo(12, 6).lineTo(-12, 6).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function parallelogramPrismIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-10, 8).lineTo(5, 8).lineTo(10, -8).lineTo(-5, -8).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function dovePrismIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-12, 8).lineTo(12, 8).lineTo(6, -8).lineTo(-6, -8).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: 1.5,
    }),
  );
  return node;
}

function halfPlaneGlassIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(new Path(lineShape, { stroke: OpticsLabColors.glassStrokeProperty, lineWidth: 2 }));
  const hatchShape = new Shape();
  for (let x = -12; x <= 12; x += 5) {
    hatchShape.moveTo(x, 2).lineTo(x - 4, 10);
  }
  node.addChild(new Path(hatchShape, { stroke: OpticsLabColors.glassHatchStrokeProperty, lineWidth: 1 }));
  return node;
}

function lineBlockerIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(new Path(shape, { stroke: OpticsLabColors.blockerBackStrokeProperty, lineWidth: 4, lineCap: "round" }));
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.blockerFrontStrokeProperty, lineWidth: 2, lineCap: "round" }),
  );
  return node;
}

function detectorIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.detectorBackStrokeProperty, lineWidth: 4, lineCap: "round" }),
  );
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.detectorFrontStrokeProperty, lineWidth: 2, lineCap: "round" }),
  );
  // Small tick marks to suggest measurement
  const ticks = new Shape();
  for (let x = -10; x <= 10; x += 5) {
    ticks.moveTo(x, -3).lineTo(x, 3);
  }
  node.addChild(new Path(ticks, { stroke: OpticsLabColors.detectorFrontStrokeProperty, lineWidth: 1 }));
  return node;
}

function apertureIcon(): Node {
  const node = new Node();
  const left = new Shape().moveTo(-14, 0).lineTo(-4, 0);
  const right = new Shape().moveTo(4, 0).lineTo(14, 0);
  node.addChild(new Path(left, { stroke: OpticsLabColors.blockerBackStrokeProperty, lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(left, { stroke: OpticsLabColors.blockerFrontStrokeProperty, lineWidth: 2, lineCap: "round" }));
  node.addChild(new Path(right, { stroke: OpticsLabColors.blockerBackStrokeProperty, lineWidth: 4, lineCap: "round" }));
  node.addChild(
    new Path(right, { stroke: OpticsLabColors.blockerFrontStrokeProperty, lineWidth: 2, lineCap: "round" }),
  );
  return node;
}

function transmissionGratingIcon(): Node {
  const node = new Node();
  // Body line
  const line = new Shape().moveTo(0, -14).lineTo(0, 14);
  node.addChild(new Path(line, { stroke: OpticsLabColors.glassStrokeProperty, lineWidth: 2.5, lineCap: "round" }));
  // Perpendicular tick marks (grooves)
  const ticks = new Shape();
  for (let y = -10; y <= 10; y += 5) {
    ticks.moveTo(-4, y).lineTo(4, y);
  }
  node.addChild(new Path(ticks, { stroke: OpticsLabColors.glassStrokeProperty, lineWidth: 1 }));
  return node;
}

function trackIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.trackStrokeProperty,
      lineWidth: 2,
      lineDash: [6, 3],
      lineCap: "round",
    }),
  );
  return node;
}

function reflectionGratingIcon(): Node {
  const node = new Node();
  // Mirror-like body line
  const line = new Shape().moveTo(0, -14).lineTo(0, 14);
  node.addChild(new Path(line, { stroke: OpticsLabColors.mirrorBackStrokeProperty, lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(line, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: 2, lineCap: "round" }));
  // Angled hatch marks (grooves)
  const hatches = new Shape();
  for (let y = -10; y <= 10; y += 4) {
    hatches.moveTo(0, y).lineTo(-5, y + 2);
  }
  node.addChild(new Path(hatches, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: 1 }));
  return node;
}

// ── Component descriptors ────────────────────────────────────────────────────
// cx, cy are MODEL coordinates (metres, y-up, origin at screen centre).
// S = default half-size in metres (0.6 m = 60 px at 100 px/m).

function getComponentDescriptors(): ComponentDescriptor[] {
  const S = CAROUSEL_DEFAULT_HALF_SIZE_M;
  const c = StringManager.getInstance().getComponentStrings();
  return [
    // ── Diffraction Gratings ──────────────────────────────────────────────
    {
      key: "transmissionGrating",
      label: c.transmissionGratingStringProperty,
      createIcon: transmissionGratingIcon,
      createElement: (cx, cy) => new TransmissionGrating({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
    },
    {
      key: "reflectionGrating",
      label: c.reflectionGratingStringProperty,
      createIcon: reflectionGratingIcon,
      createElement: (cx, cy) => new ReflectionGrating({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
    },

    // ── Light Sources ──────────────────────────────────────────────────────
    {
      key: "beam",
      label: c.beamStringProperty,
      createIcon: beamSourceIcon,
      createElement: (cx, cy) => new BeamSource({ x: cx, y: cy - S / 2 }, { x: cx, y: cy + S / 2 }, 0.5, 532, 0),
    },
    {
      key: "singleRay",
      label: c.singleRayStringProperty,
      createIcon: singleRayIcon,
      createElement: (cx, cy) => new SingleRaySource({ x: cx - S / 2, y: cy }, { x: cx + S / 2, y: cy }, 1.0),
    },
    {
      key: "continuousSpectrum",
      label: c.continuousSpectrumStringProperty,
      createIcon: contSpectrumIcon,
      createElement: (cx, cy) => new ContinuousSpectrumSource({ x: cx - S / 2, y: cy }, { x: cx + S / 2, y: cy }),
    },
    {
      key: "arcSource",
      label: c.arcSourceStringProperty,
      createIcon: arcSourceIcon,
      createElement: (cx, cy) => new ArcLightSource({ x: cx, y: cy }, 0, Math.PI / 6, 0.5),
    },
    {
      key: "pointSource",
      label: c.pointSourceStringProperty,
      createIcon: pointSourceIcon,
      createElement: (cx, cy) => new PointSourceElement({ x: cx, y: cy }, 0.6),
    },

    // ── Lenses / Glass ─────────────────────────────────────────────────────
    {
      key: "sphericalLens",
      label: c.sphericalLensStringProperty,
      createIcon: sphericalLensIcon,
      createElement: (cx, cy) => new SphericalLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2, -1.2, 1.5),
    },
    {
      key: "biconvexLens",
      label: c.biconvexLensStringProperty,
      createIcon: biconvexLensIcon,
      createElement: (cx, cy) => new BiconvexLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2, 1.5),
    },
    {
      key: "biconcaveLens",
      label: c.biconcaveLensStringProperty,
      createIcon: biconcaveLensIcon,
      createElement: (cx, cy) => new BiconcaveLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2, 1.5),
    },
    {
      key: "planoConvexLens",
      label: c.planoConvexLensStringProperty,
      createIcon: planoConvexLensIcon,
      createElement: (cx, cy) => new PlanoConvexLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2, 1.5),
    },
    {
      key: "planoConcaveLens",
      label: c.planoConcaveLensStringProperty,
      createIcon: planoConcaveLensIcon,
      createElement: (cx, cy) => new PlanoConcaveLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2, 1.5),
    },
    {
      key: "idealLens",
      label: c.idealLensStringProperty,
      createIcon: idealLensIcon,
      createElement: (cx, cy) => new IdealLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2),
    },
    {
      key: "circleGlass",
      label: c.circleGlassStringProperty,
      createIcon: circleGlassIcon,
      createElement: (cx, cy) => new CircleGlass({ x: cx, y: cy }, { x: cx + S * 0.7, y: cy }, 1.5),
    },
    {
      key: "prism",
      label: c.prismStringProperty,
      createIcon: polygonGlassIcon,
      createElement: (cx, cy) =>
        new Glass(
          [
            { x: cx, y: cy + S * 0.8 },
            { x: cx + S * 0.7, y: cy - S * 0.6 },
            { x: cx - S * 0.7, y: cy - S * 0.6 },
          ],
          1.5,
        ),
    },
    {
      key: "equilateralPrism",
      label: c.equilateralPrismStringProperty,
      createIcon: equilateralPrismIcon,
      createElement: (cx, cy) => new EquilateralPrism({ x: cx, y: cy }, S * 0.8),
    },
    {
      key: "rightAnglePrism",
      label: c.rightAnglePrismStringProperty,
      createIcon: rightAnglePrismIcon,
      createElement: (cx, cy) => new RightAnglePrism({ x: cx, y: cy }, S * 0.9),
    },
    {
      key: "porroPrism",
      label: c.porroPrismStringProperty,
      createIcon: porroPrismIcon,
      createElement: (cx, cy) => new PorroPrism({ x: cx, y: cy }, S * 1.0),
    },
    {
      key: "slabGlass",
      label: c.slabGlassStringProperty,
      createIcon: slabGlassIcon,
      createElement: (cx, cy) => new SlabGlass({ x: cx, y: cy }, S * 1.4, S * 0.5),
    },
    {
      key: "parallelogramPrism",
      label: c.parallelogramPrismStringProperty,
      createIcon: parallelogramPrismIcon,
      createElement: (cx, cy) => new ParallelogramPrism({ x: cx, y: cy }, S * 0.9, S * 0.7),
    },
    {
      key: "dovePrism",
      label: c.dovePrismStringProperty,
      createIcon: dovePrismIcon,
      createElement: (cx, cy) => new DovePrism({ x: cx, y: cy }, S * 1.3, S * 0.6),
    },
    {
      key: "halfPlaneGlass",
      label: c.halfPlaneGlassStringProperty,
      createIcon: halfPlaneGlassIcon,
      createElement: (cx, cy) => new HalfPlaneGlass({ x: cx, y: cy + S * 1.5 }, { x: cx, y: cy - S * 1.5 }, 1.5),
    },

    // ── Mirrors ────────────────────────────────────────────────────────────
    {
      key: "flatMirror",
      label: c.flatMirrorStringProperty,
      createIcon: segmentMirrorIcon,
      createElement: (cx, cy) => new SegmentMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
    },
    {
      key: "arcMirror",
      label: c.arcMirrorStringProperty,
      createIcon: arcMirrorIcon,
      createElement: (cx, cy) => new ArcMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, { x: cx + S * 0.5, y: cy }),
    },
    {
      key: "idealMirror",
      label: c.idealMirrorStringProperty,
      createIcon: idealCurvedMirrorIcon,
      createElement: (cx, cy) => new IdealCurvedMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 0.8),
    },
    {
      key: "parabolicMirror",
      label: c.parabolicMirrorStringProperty,
      createIcon: parabolicMirrorIcon,
      createElement: (cx, cy) =>
        new ParabolicMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, { x: cx + S * 0.5, y: cy }),
    },

    // ── Blockers ───────────────────────────────────────────────────────────
    {
      key: "lineBlocker",
      label: c.lineBlockerStringProperty,
      createIcon: lineBlockerIcon,
      createElement: (cx, cy) => new LineBlocker({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
    },
    {
      key: "detector",
      label: c.detectorStringProperty,
      createIcon: detectorIcon,
      createElement: (cx, cy) => new DetectorElement({ x: cx, y: cy - S }, { x: cx, y: cy + S }),
    },
    {
      key: "aperture",
      label: c.apertureStringProperty,
      createIcon: apertureIcon,
      createElement: (cx, cy) =>
        new ApertureElement(
          { x: cx, y: cy - S },
          { x: cx, y: cy + S },
          { x: cx, y: cy - S * 0.2 },
          { x: cx, y: cy + S * 0.2 },
        ),
    },
    {
      key: "beamSplitter",
      label: c.beamSplitterStringProperty,
      createIcon: beamSplitterIcon,
      createElement: (cx, cy) =>
        new BeamSplitterElement({ x: cx - S * 0.7, y: cy - S * 0.7 }, { x: cx + S * 0.7, y: cy + S * 0.7 }, 0.5),
    },

    // ── Guides ──────────────────────────────────────────────────────────────
    {
      key: "track",
      label: c.trackStringProperty,
      createIcon: trackIcon,
      createElement: (cx, cy) => new TrackElement({ x: cx - S, y: cy }, { x: cx + S, y: cy }),
    },
  ];
}

// ── Callback type ────────────────────────────────────────────────────────────

export type AddElementCallback = (element: OpticalElement) => OpticalElementView | null;

// ── Carousel builder ─────────────────────────────────────────────────────────

/**
 * Creates a Carousel containing icons for every available optical component.
 *
 * @param modelViewTransform - model-to-view transform, used to convert pointer position to
 *   model coordinates when the user drags an icon onto the canvas.
 * @param globalToLocal - converts a point from global (display/window) coordinates to
 *   ScreenView-local (layout-bounds) coordinates. Pass `(p) => screenView.globalToLocalPoint(p)`
 *   from the SimScreenView. Required so that pointer positions are correctly mapped to model
 *   coordinates regardless of how the sim is scaled/offset in the browser window.
 * @param onAddElement - called with the newly created OpticalElement; should
 *   add it to the model, create its view, and return the view (or null).
 * @param componentKeys - optional list of component keys to include (in order).
 *   When omitted, all components appear in their default order.
 */
export function createComponentCarousel(
  modelViewTransform: ModelViewTransform2,
  globalToLocal: (p: Vector2) => Vector2,
  onAddElement: AddElementCallback,
  componentKeys?: ComponentKey[],
): Carousel {
  const allDescriptors = getComponentDescriptors();

  // If a key list is provided, filter and order by it; otherwise use all.
  const descriptors = componentKeys
    ? componentKeys
        .map((key) => allDescriptors.find((d) => d.key === key))
        .filter((d): d is ComponentDescriptor => d !== undefined)
    : allDescriptors;

  const carouselItems: CarouselItem[] = descriptors.map((descriptor) => ({
    createNode: () => {
      const icon = descriptor.createIcon();
      const label = new Text(descriptor.label, {
        font: "11px sans-serif",
        fill: OpticsLabColors.carouselLabelFillProperty,
        maxWidth: ICON_SIZE + 20,
      });

      const container = new Node({
        children: [icon, label],
        cursor: "grab",
      });

      label.centerX = icon.centerX;
      label.top = ICON_HALF + 2;

      // Expand the hit region to cover the full item area (icon + label + gap
      // between them) so touch anywhere in the cell starts the drag.
      container.mouseArea = container.localBounds;
      container.touchArea = container.localBounds.dilated(4);

      // Creator with drag forwarding: press an icon → create element at the
      // pointer position (converted to model coords) → forward the drag.
      container.addInputListener(
        RichDragListener.createForwardingListener(container, (event: PressListenerEvent) => {
          // event.pointer.point is in global (window) coordinates.
          // modelViewTransform expects ScreenView-local (layout-bounds) coordinates.
          // globalToLocal() corrects for display scale and offset before converting to model space.
          const localPoint = globalToLocal(event.pointer.point);
          const cx = modelViewTransform.viewToModelX(localPoint.x);
          const cy = modelViewTransform.viewToModelY(localPoint.y);
          const element = descriptor.createElement(cx, cy);
          const view = onAddElement(element);
          if (view) {
            view.bodyDragListener.dragListener.press(event, view);
          }
        }),
      );

      return container;
    },
  }));

  const carousel = new Carousel(carouselItems, {
    orientation: "vertical",
    itemsPerPage: CAROUSEL_ITEMS_PER_PAGE,
    spacing: CAROUSEL_ITEM_SPACING,
    margin: CAROUSEL_ITEM_MARGIN,
    fill: OpticsLabColors.panelFillProperty,
    stroke: OpticsLabColors.panelStrokeProperty,
    cornerRadius: CAROUSEL_CORNER_RADIUS,
    separatorsVisible: true,
    separatorOptions: {
      stroke: OpticsLabColors.carouselSeparatorStrokeProperty,
      lineWidth: 1,
    },
    buttonOptions: {
      baseColor: OpticsLabColors.carouselButtonBaseColorProperty,
      arrowPathOptions: {
        stroke: OpticsLabColors.carouselArrowStrokeProperty,
        lineWidth: 2,
      },
    },
  });

  return carousel;
}

opticsLab.register("ComponentCarousel", { createComponentCarousel });
