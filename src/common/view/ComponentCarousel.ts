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
  const coreGlowRadius = 6;
  const glowOutlineWidth = 1.5;
  const spokeCount = 8;
  const spokeInnerRadius = 7;
  const spokeOuterRadius = 14;
  const spokeLineWidth = 1;
  const fullTurnRadians = Math.PI * 2;

  const glow = new Circle(coreGlowRadius, {
    fill: OpticsLabColors.arcSourceGlowFillProperty,
    stroke: OpticsLabColors.arcSourceGlowStrokeProperty,
    lineWidth: glowOutlineWidth,
  });
  node.addChild(glow);
  const spokeShape = new Shape();
  for (let i = 0; i < spokeCount; i++) {
    const a = (i / spokeCount) * fullTurnRadians;
    spokeShape.moveTo(Math.cos(a) * spokeInnerRadius, Math.sin(a) * spokeInnerRadius);
    spokeShape.lineTo(Math.cos(a) * spokeOuterRadius, Math.sin(a) * spokeOuterRadius);
  }
  node.addChild(
    new Path(spokeShape, {
      stroke: OpticsLabColors.arcSourceSpokeStrokeProperty,
      lineWidth: spokeLineWidth,
    }),
  );
  return node;
}

function arcSourceIcon(): Node {
  const node = new Node();
  const arcRadius = 14;
  const rimHalfAngleTurns = 0.6;
  const sectorHalfAngleTurns = 0.3;
  const rimLineWidth = 1;
  const sectorLineWidth = 1.2;
  const spokeIndexMin = -2;
  const spokeIndexMax = 2;
  const spokeIndexScale = 2;
  const spokeFanHalfAngleTurns = 0.55;
  const spokeInnerRadius = 4;
  const spokeOuterRadius = 12;
  const spokeLineWidth = 1;
  const coreRadius = 4;
  const coreOutlineWidth = 1.5;

  const rimShape = new Shape().arc(0, 0, arcRadius, -Math.PI * rimHalfAngleTurns, Math.PI * rimHalfAngleTurns, false);
  node.addChild(new Path(rimShape, { stroke: OpticsLabColors.arcSourceRimStrokeProperty, lineWidth: rimLineWidth }));
  const sectorShape = new Shape()
    .moveTo(0, 0)
    .arc(0, 0, arcRadius, -Math.PI * sectorHalfAngleTurns, Math.PI * sectorHalfAngleTurns, false)
    .close();
  node.addChild(
    new Path(sectorShape, {
      fill: OpticsLabColors.arcSourceSectorFillProperty,
      stroke: OpticsLabColors.arcSourceSectorStrokeProperty,
      lineWidth: sectorLineWidth,
    }),
  );
  const spokeShape = new Shape();
  for (let i = spokeIndexMin; i <= spokeIndexMax; i++) {
    const a = (i / spokeIndexScale) * Math.PI * spokeFanHalfAngleTurns;
    spokeShape.moveTo(Math.cos(a) * spokeInnerRadius, Math.sin(a) * spokeInnerRadius);
    spokeShape.lineTo(Math.cos(a) * spokeOuterRadius, Math.sin(a) * spokeOuterRadius);
  }
  node.addChild(
    new Path(spokeShape, { stroke: OpticsLabColors.arcSourceSpokeStrokeProperty, lineWidth: spokeLineWidth }),
  );
  node.addChild(
    new Circle(coreRadius, {
      fill: OpticsLabColors.arcSourceGlowFillProperty,
      stroke: OpticsLabColors.arcSourceGlowStrokeProperty,
      lineWidth: coreOutlineWidth,
    }),
  );
  return node;
}

function beamSourceIcon(): Node {
  const node = new Node();
  const rayVerticalSpacing = 8;
  const rayVerticalMin = -rayVerticalSpacing;
  const rayVerticalMax = rayVerticalSpacing;
  const rayTailX = -12;
  const rayHeadX = 8;
  const rayLineWidth = 1.5;
  const arrowBaseX = 5;
  const arrowTipX = 12;
  const arrowHalfHeight = 4;

  for (let dy = rayVerticalMin; dy <= rayVerticalMax; dy += rayVerticalSpacing) {
    const shape = new Shape().moveTo(rayTailX, dy).lineTo(rayHeadX, dy);
    node.addChild(new Path(shape, { stroke: OpticsLabColors.iconRayStrokeProperty, lineWidth: rayLineWidth }));
    const arrow = new Shape()
      .moveTo(arrowBaseX, dy - arrowHalfHeight)
      .lineTo(arrowTipX, dy)
      .lineTo(arrowBaseX, dy + arrowHalfHeight);
    node.addChild(
      new Path(arrow, {
        stroke: OpticsLabColors.iconRayStrokeProperty,
        lineWidth: rayLineWidth,
        lineCap: "round",
        lineJoin: "round",
      }),
    );
  }
  return node;
}

function singleRayIcon(): Node {
  const node = new Node();
  const tailX = -14;
  const shaftEndX = 10;
  const rayLineWidth = 2;
  const arrowBaseX = 6;
  const arrowTipX = 14;
  const arrowHalfHeight = 5;

  const shape = new Shape().moveTo(tailX, 0).lineTo(shaftEndX, 0);
  node.addChild(new Path(shape, { stroke: OpticsLabColors.iconRayStrokeProperty, lineWidth: rayLineWidth }));
  const arrow = new Shape()
    .moveTo(arrowBaseX, -arrowHalfHeight)
    .lineTo(arrowTipX, 0)
    .lineTo(arrowBaseX, arrowHalfHeight);
  node.addChild(
    new Path(arrow, {
      stroke: OpticsLabColors.iconRayStrokeProperty,
      lineWidth: rayLineWidth,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function contSpectrumIcon(): Node {
  const node = new Node();
  const spectrumArcRadius = 9;
  const spectrumStrokeAlpha = 0.9;
  const spectrumArcLineWidth = 2.5;
  const directionShaftLength = 14;
  const directionLineWidth = 1.5;
  const directionArrowBaseX = 10;
  const directionArrowTipX = 14;
  const directionArrowHalfHeight = 4;
  const fullTurnRadians = Math.PI * 2;

  // Rainbow disc: one arc per sampled wavelength.
  const arcSpan = fullTurnRadians / CONT_SPECTRUM_SAMPLE_WL.length;
  for (let i = 0; i < CONT_SPECTRUM_SAMPLE_WL.length; i++) {
    const wl = CONT_SPECTRUM_SAMPLE_WL[i] ?? CONT_SPECTRUM_SAMPLE_WL[0];
    const c = VisibleColor.wavelengthToColor(wl);
    const shape = new Shape().arc(0, 0, spectrumArcRadius, i * arcSpan, (i + 1) * arcSpan);
    node.addChild(
      new Path(shape, {
        stroke: `rgba(${c.r},${c.g},${c.b},${spectrumStrokeAlpha})`,
        lineWidth: spectrumArcLineWidth,
      }),
    );
  }
  const line = new Shape().moveTo(0, 0).lineTo(directionShaftLength, 0);
  node.addChild(new Path(line, { stroke: OpticsLabColors.sourceDirLineStrokeProperty, lineWidth: directionLineWidth }));
  const arrow = new Shape()
    .moveTo(directionArrowBaseX, -directionArrowHalfHeight)
    .lineTo(directionArrowTipX, 0)
    .lineTo(directionArrowBaseX, directionArrowHalfHeight);
  node.addChild(
    new Path(arrow, {
      stroke: OpticsLabColors.sourceDirArrowStrokeProperty,
      lineWidth: directionLineWidth,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function segmentMirrorIcon(): Node {
  const node = new Node();
  const halfLength = 14;
  const backLineWidth = 4;
  const frontLineWidth = 2;

  const shape = new Shape().moveTo(-halfLength, 0).lineTo(halfLength, 0);
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.mirrorBackStrokeProperty, lineWidth: backLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: frontLineWidth, lineCap: "round" }),
  );
  return node;
}

function arcMirrorIcon(): Node {
  const node = new Node();
  const arcCenterYOffset = 20;
  const arcRadius = 24;
  const arcStartAngleTurns = -0.75;
  const arcEndAngleTurns = -0.25;
  const backLineWidth = 4;
  const frontLineWidth = 2;

  const shape = new Shape().arc(
    0,
    arcCenterYOffset,
    arcRadius,
    Math.PI * arcStartAngleTurns,
    Math.PI * arcEndAngleTurns,
  );
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.mirrorBackStrokeProperty, lineWidth: backLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: frontLineWidth, lineCap: "round" }),
  );
  return node;
}

function parabolicMirrorIcon(): Node {
  const node = new Node();
  const shape = new Shape();
  const segmentCount = 20;
  const horizontalHalfExtent = 14;
  const parabolaDepth = 10;
  const parabolaVerticalOffset = 4;
  const backLineWidth = 4;
  const frontLineWidth = 2;

  for (let i = 0; i <= segmentCount; i++) {
    const t = (i / segmentCount) * 2 - 1;
    const x = t * horizontalHalfExtent;
    const y = -t * t * parabolaDepth + parabolaVerticalOffset;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: backLineWidth,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: frontLineWidth,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function idealCurvedMirrorIcon(): Node {
  const node = new Node();
  const halfLength = 14;
  const backLineWidth = 4;
  const frontLineWidth = 2;
  const focalPointMarkerRadius = 2.5;
  const focalPointMarkerYOffset = -8;

  const lineShape = new Shape().moveTo(-halfLength, 0).lineTo(halfLength, 0);
  node.addChild(
    new Path(lineShape, {
      stroke: OpticsLabColors.mirrorBackStrokeProperty,
      lineWidth: backLineWidth,
      lineCap: "round",
    }),
  );
  node.addChild(
    new Path(lineShape, {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: frontLineWidth,
      lineCap: "round",
    }),
  );
  node.addChild(
    new Circle(focalPointMarkerRadius, {
      x: 0,
      y: focalPointMarkerYOffset,
      fill: OpticsLabColors.pointSourceFillProperty,
    }),
  );
  return node;
}

function beamSplitterIcon(): Node {
  const node = new Node();
  const plateHalfExtent = 10;
  const bodyLineWidth = 2;
  const dashOnLength = 4;
  const dashGapLength = 3;
  const reflectedRayLineWidth = 1.5;

  const lineShape = new Shape().moveTo(-plateHalfExtent, plateHalfExtent).lineTo(plateHalfExtent, -plateHalfExtent);
  node.addChild(
    new Path(lineShape, {
      stroke: OpticsLabColors.beamSplitterIconBodyStrokeProperty,
      lineWidth: bodyLineWidth,
      lineDash: [dashOnLength, dashGapLength],
    }),
  );
  node.addChild(
    new Path(new Shape().moveTo(0, 0).lineTo(-plateHalfExtent, -plateHalfExtent), {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: reflectedRayLineWidth,
    }),
  );
  node.addChild(
    new Path(new Shape().moveTo(0, 0).lineTo(plateHalfExtent, plateHalfExtent), {
      stroke: OpticsLabColors.mirrorFrontStrokeProperty,
      lineWidth: reflectedRayLineWidth,
    }),
  );
  return node;
}

function idealLensIcon(): Node {
  const node = new Node();
  const halfHeight = 14;
  const verticalLineWidth = 2.5;
  const arrowLineWidth = 2;
  const arrowHalfWidth = 5;
  const arrowTipInsetFromEnd = 4;

  const lineShape = new Shape().moveTo(0, -halfHeight).lineTo(0, halfHeight);
  node.addChild(
    new Path(lineShape, {
      stroke: OpticsLabColors.idealLensStrokeProperty,
      lineWidth: verticalLineWidth,
      lineCap: "round",
    }),
  );
  const topArrowTipY = -halfHeight;
  const topArrowBaseY = topArrowTipY + arrowTipInsetFromEnd;
  const botArrowTipY = halfHeight;
  const botArrowBaseY = botArrowTipY - arrowTipInsetFromEnd;
  const topArrow = new Shape()
    .moveTo(-arrowHalfWidth, topArrowBaseY)
    .lineTo(0, topArrowTipY)
    .lineTo(arrowHalfWidth, topArrowBaseY);
  const botArrow = new Shape()
    .moveTo(-arrowHalfWidth, botArrowBaseY)
    .lineTo(0, botArrowTipY)
    .lineTo(arrowHalfWidth, botArrowBaseY);
  node.addChild(
    new Path(topArrow, {
      stroke: OpticsLabColors.idealLensStrokeProperty,
      lineWidth: arrowLineWidth,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  node.addChild(
    new Path(botArrow, {
      stroke: OpticsLabColors.idealLensStrokeProperty,
      lineWidth: arrowLineWidth,
      lineCap: "round",
      lineJoin: "round",
    }),
  );
  return node;
}

function circleGlassIcon(): Node {
  const node = new Node();
  const discRadius = 12;
  const outlineWidth = 1.5;

  node.addChild(
    new Circle(discRadius, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function sphericalLensIcon(): Node {
  const node = new Node();
  const lensCenterOffsetX = 12;
  const surfaceArcRadius = 18;
  const arcHalfAngle = Math.PI / 4;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .arc(-lensCenterOffsetX, 0, surfaceArcRadius, -arcHalfAngle, arcHalfAngle)
    .arc(lensCenterOffsetX, 0, surfaceArcRadius, Math.PI - arcHalfAngle, Math.PI + arcHalfAngle)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function biconvexLensIcon(): Node {
  const node = new Node();
  const lensCenterOffsetX = 8;
  const surfaceArcRadius = 14;
  const arcHalfAngle = Math.PI / 3.5;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .arc(-lensCenterOffsetX, 0, surfaceArcRadius, -arcHalfAngle, arcHalfAngle)
    .arc(lensCenterOffsetX, 0, surfaceArcRadius, Math.PI - arcHalfAngle, Math.PI + arcHalfAngle)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function biconcaveLensIcon(): Node {
  const node = new Node();
  const lensCenterOffsetX = 18;
  const surfaceArcRadius = 12;
  const arcHalfAngle = Math.PI / 2.5;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .arc(lensCenterOffsetX, 0, surfaceArcRadius, Math.PI - arcHalfAngle, Math.PI + arcHalfAngle)
    .arc(-lensCenterOffsetX, 0, surfaceArcRadius, -arcHalfAngle, arcHalfAngle)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function planoConvexLensIcon(): Node {
  const node = new Node();
  const halfHeight = 12;
  const flatEdgeX = 10;
  const convexArcCenterX = 16;
  const convexDepth = 20;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .moveTo(flatEdgeX, -halfHeight)
    .arc(
      convexArcCenterX,
      0,
      Math.hypot(convexDepth, halfHeight),
      -Math.atan2(halfHeight, convexDepth),
      +Math.atan2(halfHeight, convexDepth),
      false,
    )
    .lineTo(flatEdgeX, halfHeight)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function planoConcaveLensIcon(): Node {
  const node = new Node();
  const halfHeight = 12;
  const flatEdgeX = -4;
  const concaveArcCenterX = 16;
  const concaveDepth = 10;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .moveTo(flatEdgeX, halfHeight)
    .arc(
      concaveArcCenterX,
      0,
      Math.hypot(concaveDepth, halfHeight),
      Math.PI - Math.atan2(halfHeight, concaveDepth),
      Math.PI + Math.atan2(halfHeight, concaveDepth),
    )
    .lineTo(flatEdgeX, -halfHeight)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function polygonGlassIcon(): Node {
  const node = new Node();
  const apexY = -12;
  const baseHalfWidth = 12;
  const baseY = 10;
  const outlineWidth = 1.5;

  const shape = new Shape().moveTo(0, apexY).lineTo(baseHalfWidth, baseY).lineTo(-baseHalfWidth, baseY).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function equilateralPrismIcon(): Node {
  const node = new Node();
  const apexY = -12;
  const baseCornerOffsetX = 11;
  const baseY = 9;
  const outlineWidth = 1.5;

  const shape = new Shape().moveTo(0, apexY).lineTo(baseCornerOffsetX, baseY).lineTo(-baseCornerOffsetX, baseY).close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function rightAnglePrismIcon(): Node {
  const node = new Node();
  const legHalfLength = 9;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .moveTo(-legHalfLength, legHalfLength)
    .lineTo(legHalfLength, legHalfLength)
    .lineTo(-legHalfLength, -legHalfLength)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function porroPrismIcon(): Node {
  const node = new Node();
  const verticalEdgeX = -4;
  const verticalHalfExtent = 11;
  const apexX = 8;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .moveTo(verticalEdgeX, -verticalHalfExtent)
    .lineTo(verticalEdgeX, verticalHalfExtent)
    .lineTo(apexX, 0)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function slabGlassIcon(): Node {
  const node = new Node();
  const halfWidth = 12;
  const halfHeight = 6;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .moveTo(-halfWidth, -halfHeight)
    .lineTo(halfWidth, -halfHeight)
    .lineTo(halfWidth, halfHeight)
    .lineTo(-halfWidth, halfHeight)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function parallelogramPrismIcon(): Node {
  const node = new Node();
  const topLeftX = -10;
  const topRightX = 5;
  const topY = 8;
  const bottomRightX = 10;
  const bottomLeftX = -5;
  const bottomY = -8;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .moveTo(topLeftX, topY)
    .lineTo(topRightX, topY)
    .lineTo(bottomRightX, bottomY)
    .lineTo(bottomLeftX, bottomY)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function dovePrismIcon(): Node {
  const node = new Node();
  const topHalfWidth = 12;
  const topY = 8;
  const bottomRightX = 6;
  const bottomLeftX = -6;
  const bottomY = -8;
  const outlineWidth = 1.5;

  const shape = new Shape()
    .moveTo(-topHalfWidth, topY)
    .lineTo(topHalfWidth, topY)
    .lineTo(bottomRightX, bottomY)
    .lineTo(bottomLeftX, bottomY)
    .close();
  node.addChild(
    new Path(shape, {
      fill: OpticsLabColors.glassFillProperty,
      stroke: OpticsLabColors.glassStrokeProperty,
      lineWidth: outlineWidth,
    }),
  );
  return node;
}

function halfPlaneGlassIcon(): Node {
  const node = new Node();
  const boundaryHalfLength = 14;
  const boundaryLineWidth = 2;
  const hatchStartX = -12;
  const hatchEndX = 12;
  const hatchSpacing = 5;
  const hatchTopY = 2;
  const hatchBottomY = 10;
  const hatchSkew = 4;
  const hatchLineWidth = 1;

  const lineShape = new Shape().moveTo(-boundaryHalfLength, 0).lineTo(boundaryHalfLength, 0);
  node.addChild(new Path(lineShape, { stroke: OpticsLabColors.glassStrokeProperty, lineWidth: boundaryLineWidth }));
  const hatchShape = new Shape();
  for (let x = hatchStartX; x <= hatchEndX; x += hatchSpacing) {
    hatchShape.moveTo(x, hatchTopY).lineTo(x - hatchSkew, hatchBottomY);
  }
  node.addChild(new Path(hatchShape, { stroke: OpticsLabColors.glassHatchStrokeProperty, lineWidth: hatchLineWidth }));
  return node;
}

function lineBlockerIcon(): Node {
  const node = new Node();
  const halfLength = 14;
  const backLineWidth = 4;
  const frontLineWidth = 2;

  const shape = new Shape().moveTo(-halfLength, 0).lineTo(halfLength, 0);
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.blockerBackStrokeProperty, lineWidth: backLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.blockerFrontStrokeProperty,
      lineWidth: frontLineWidth,
      lineCap: "round",
    }),
  );
  return node;
}

function detectorIcon(): Node {
  const node = new Node();
  const bodyHalfLength = 14;
  const backLineWidth = 4;
  const frontLineWidth = 2;
  const tickStartX = -10;
  const tickEndX = 10;
  const tickSpacing = 5;
  const tickHalfHeight = 3;
  const tickLineWidth = 1;

  const shape = new Shape().moveTo(-bodyHalfLength, 0).lineTo(bodyHalfLength, 0);
  node.addChild(
    new Path(shape, { stroke: OpticsLabColors.detectorBackStrokeProperty, lineWidth: backLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.detectorFrontStrokeProperty,
      lineWidth: frontLineWidth,
      lineCap: "round",
    }),
  );
  const ticks = new Shape();
  for (let x = tickStartX; x <= tickEndX; x += tickSpacing) {
    ticks.moveTo(x, -tickHalfHeight).lineTo(x, tickHalfHeight);
  }
  node.addChild(new Path(ticks, { stroke: OpticsLabColors.detectorFrontStrokeProperty, lineWidth: tickLineWidth }));
  return node;
}

function apertureIcon(): Node {
  const node = new Node();
  const outerHalfExtent = 14;
  const gapHalfWidth = 4;
  const backLineWidth = 4;
  const frontLineWidth = 2;

  const left = new Shape().moveTo(-outerHalfExtent, 0).lineTo(-gapHalfWidth, 0);
  const right = new Shape().moveTo(gapHalfWidth, 0).lineTo(outerHalfExtent, 0);
  node.addChild(
    new Path(left, { stroke: OpticsLabColors.blockerBackStrokeProperty, lineWidth: backLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(left, { stroke: OpticsLabColors.blockerFrontStrokeProperty, lineWidth: frontLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(right, { stroke: OpticsLabColors.blockerBackStrokeProperty, lineWidth: backLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(right, {
      stroke: OpticsLabColors.blockerFrontStrokeProperty,
      lineWidth: frontLineWidth,
      lineCap: "round",
    }),
  );
  return node;
}

function transmissionGratingIcon(): Node {
  const node = new Node();
  const halfHeight = 14;
  const bodyLineWidth = 2.5;
  const grooveStartY = -10;
  const grooveEndY = 10;
  const grooveSpacing = 5;
  const grooveHalfLength = 4;
  const grooveLineWidth = 1;

  const line = new Shape().moveTo(0, -halfHeight).lineTo(0, halfHeight);
  node.addChild(
    new Path(line, { stroke: OpticsLabColors.glassStrokeProperty, lineWidth: bodyLineWidth, lineCap: "round" }),
  );
  const ticks = new Shape();
  for (let y = grooveStartY; y <= grooveEndY; y += grooveSpacing) {
    ticks.moveTo(-grooveHalfLength, y).lineTo(grooveHalfLength, y);
  }
  node.addChild(new Path(ticks, { stroke: OpticsLabColors.glassStrokeProperty, lineWidth: grooveLineWidth }));
  return node;
}

function trackIcon(): Node {
  const node = new Node();
  const halfLength = 14;
  const lineWidth = 2;
  const dashOnLength = 6;
  const dashGapLength = 3;

  const shape = new Shape().moveTo(-halfLength, 0).lineTo(halfLength, 0);
  node.addChild(
    new Path(shape, {
      stroke: OpticsLabColors.trackStrokeProperty,
      lineWidth,
      lineDash: [dashOnLength, dashGapLength],
      lineCap: "round",
    }),
  );
  return node;
}

function reflectionGratingIcon(): Node {
  const node = new Node();
  const halfHeight = 14;
  const backLineWidth = 4;
  const frontLineWidth = 2;
  const hatchStartY = -10;
  const hatchEndY = 10;
  const hatchVerticalStep = 4;
  const hatchHorizontalExtent = -5;
  const hatchVerticalDrop = 2;
  const hatchLineWidth = 1;

  const line = new Shape().moveTo(0, -halfHeight).lineTo(0, halfHeight);
  node.addChild(
    new Path(line, { stroke: OpticsLabColors.mirrorBackStrokeProperty, lineWidth: backLineWidth, lineCap: "round" }),
  );
  node.addChild(
    new Path(line, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: frontLineWidth, lineCap: "round" }),
  );
  const hatches = new Shape();
  for (let y = hatchStartY; y <= hatchEndY; y += hatchVerticalStep) {
    hatches.moveTo(0, y).lineTo(hatchHorizontalExtent, y + hatchVerticalDrop);
  }
  node.addChild(new Path(hatches, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: hatchLineWidth }));
  return node;
}

// ── Component descriptors ────────────────────────────────────────────────────
// cx, cy are MODEL coordinates (metres, y-up, origin at screen centre).
// S = default half-size in metres (0.6 m = 60 px at 100 px/m).

function getComponentDescriptors(): ComponentDescriptor[] {
  const S = CAROUSEL_DEFAULT_HALF_SIZE_M;
  const c = StringManager.getInstance().getComponentStrings();
  const halfDefaultSizeM = S / 2;

  const glassIndexOfRefraction = 1.5;
  const convexLensSurfaceRadiusM = 1.2;
  const biconcaveInnerSurfaceRadiusM = -1.2;
  const idealThinLensFocalLengthM = 1.2;
  const beamSourceBrightness = 0.5;
  const beamSourceWavelengthNm = 532;
  const beamSourceEmissionAngleRad = 0;
  const singleRayBrightness = 1;
  const arcSourcePointingAngleRad = 0;
  const arcSourceConeHalfAngleRad = Math.PI / 6;
  const arcSourceBrightness = 0.5;
  const pointSourceBrightness = 0.6;
  const idealMirrorFocalLengthM = 0.8;
  const beamSplitterTransmitFraction = 0.5;

  const circleGlassRadiusScale = 0.7;
  const genericPrismForwardApexScale = 0.8;
  const genericPrismBaseCornerScale = 0.7;
  const genericPrismBaseDepthScale = 0.6;
  const equilateralPrismRadiusScale = 0.8;
  const rightAnglePrismSizeScale = 0.9;
  const porroPrismSizeScale = 1.0;
  const slabWidthScale = 1.4;
  const slabThicknessScale = 0.5;
  const parallelogramWidthScale = 0.9;
  const parallelogramSkewScale = 0.7;
  const dovePrismLengthScale = 1.3;
  const dovePrismThicknessScale = 0.6;
  const halfPlaneSpanScale = 1.5;
  const curvedMirrorBulgeOffsetScale = 0.5;
  const apertureNotchDepthScale = 0.2;
  const beamSplitterDiagonalHalfScale = 0.7;

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
      createElement: (cx, cy) =>
        new BeamSource(
          { x: cx, y: cy - halfDefaultSizeM },
          { x: cx, y: cy + halfDefaultSizeM },
          beamSourceBrightness,
          beamSourceWavelengthNm,
          beamSourceEmissionAngleRad,
        ),
    },
    {
      key: "singleRay",
      label: c.singleRayStringProperty,
      createIcon: singleRayIcon,
      createElement: (cx, cy) =>
        new SingleRaySource(
          { x: cx - halfDefaultSizeM, y: cy },
          { x: cx + halfDefaultSizeM, y: cy },
          singleRayBrightness,
        ),
    },
    {
      key: "continuousSpectrum",
      label: c.continuousSpectrumStringProperty,
      createIcon: contSpectrumIcon,
      createElement: (cx, cy) =>
        new ContinuousSpectrumSource({ x: cx - halfDefaultSizeM, y: cy }, { x: cx + halfDefaultSizeM, y: cy }),
    },
    {
      key: "arcSource",
      label: c.arcSourceStringProperty,
      createIcon: arcSourceIcon,
      createElement: (cx, cy) =>
        new ArcLightSource({ x: cx, y: cy }, arcSourcePointingAngleRad, arcSourceConeHalfAngleRad, arcSourceBrightness),
    },
    {
      key: "pointSource",
      label: c.pointSourceStringProperty,
      createIcon: pointSourceIcon,
      createElement: (cx, cy) => new PointSourceElement({ x: cx, y: cy }, pointSourceBrightness),
    },

    // ── Lenses / Glass ─────────────────────────────────────────────────────
    {
      key: "sphericalLens",
      label: c.sphericalLensStringProperty,
      createIcon: sphericalLensIcon,
      createElement: (cx, cy) =>
        new SphericalLens(
          { x: cx, y: cy - S },
          { x: cx, y: cy + S },
          convexLensSurfaceRadiusM,
          biconcaveInnerSurfaceRadiusM,
          glassIndexOfRefraction,
        ),
    },
    {
      key: "biconvexLens",
      label: c.biconvexLensStringProperty,
      createIcon: biconvexLensIcon,
      createElement: (cx, cy) =>
        new BiconvexLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, convexLensSurfaceRadiusM, glassIndexOfRefraction),
    },
    {
      key: "biconcaveLens",
      label: c.biconcaveLensStringProperty,
      createIcon: biconcaveLensIcon,
      createElement: (cx, cy) =>
        new BiconcaveLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, convexLensSurfaceRadiusM, glassIndexOfRefraction),
    },
    {
      key: "planoConvexLens",
      label: c.planoConvexLensStringProperty,
      createIcon: planoConvexLensIcon,
      createElement: (cx, cy) =>
        new PlanoConvexLens(
          { x: cx, y: cy - S },
          { x: cx, y: cy + S },
          convexLensSurfaceRadiusM,
          glassIndexOfRefraction,
        ),
    },
    {
      key: "planoConcaveLens",
      label: c.planoConcaveLensStringProperty,
      createIcon: planoConcaveLensIcon,
      createElement: (cx, cy) =>
        new PlanoConcaveLens(
          { x: cx, y: cy - S },
          { x: cx, y: cy + S },
          convexLensSurfaceRadiusM,
          glassIndexOfRefraction,
        ),
    },
    {
      key: "idealLens",
      label: c.idealLensStringProperty,
      createIcon: idealLensIcon,
      createElement: (cx, cy) => new IdealLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, idealThinLensFocalLengthM),
    },
    {
      key: "circleGlass",
      label: c.circleGlassStringProperty,
      createIcon: circleGlassIcon,
      createElement: (cx, cy) =>
        new CircleGlass({ x: cx, y: cy }, { x: cx + S * circleGlassRadiusScale, y: cy }, glassIndexOfRefraction),
    },
    {
      key: "prism",
      label: c.prismStringProperty,
      createIcon: polygonGlassIcon,
      createElement: (cx, cy) =>
        new Glass(
          [
            { x: cx, y: cy + S * genericPrismForwardApexScale },
            { x: cx + S * genericPrismBaseCornerScale, y: cy - S * genericPrismBaseDepthScale },
            { x: cx - S * genericPrismBaseCornerScale, y: cy - S * genericPrismBaseDepthScale },
          ],
          glassIndexOfRefraction,
        ),
    },
    {
      key: "equilateralPrism",
      label: c.equilateralPrismStringProperty,
      createIcon: equilateralPrismIcon,
      createElement: (cx, cy) => new EquilateralPrism({ x: cx, y: cy }, S * equilateralPrismRadiusScale),
    },
    {
      key: "rightAnglePrism",
      label: c.rightAnglePrismStringProperty,
      createIcon: rightAnglePrismIcon,
      createElement: (cx, cy) => new RightAnglePrism({ x: cx, y: cy }, S * rightAnglePrismSizeScale),
    },
    {
      key: "porroPrism",
      label: c.porroPrismStringProperty,
      createIcon: porroPrismIcon,
      createElement: (cx, cy) => new PorroPrism({ x: cx, y: cy }, S * porroPrismSizeScale),
    },
    {
      key: "slabGlass",
      label: c.slabGlassStringProperty,
      createIcon: slabGlassIcon,
      createElement: (cx, cy) => new SlabGlass({ x: cx, y: cy }, S * slabWidthScale, S * slabThicknessScale),
    },
    {
      key: "parallelogramPrism",
      label: c.parallelogramPrismStringProperty,
      createIcon: parallelogramPrismIcon,
      createElement: (cx, cy) =>
        new ParallelogramPrism({ x: cx, y: cy }, S * parallelogramWidthScale, S * parallelogramSkewScale),
    },
    {
      key: "dovePrism",
      label: c.dovePrismStringProperty,
      createIcon: dovePrismIcon,
      createElement: (cx, cy) => new DovePrism({ x: cx, y: cy }, S * dovePrismLengthScale, S * dovePrismThicknessScale),
    },
    {
      key: "halfPlaneGlass",
      label: c.halfPlaneGlassStringProperty,
      createIcon: halfPlaneGlassIcon,
      createElement: (cx, cy) =>
        new HalfPlaneGlass(
          { x: cx, y: cy + S * halfPlaneSpanScale },
          { x: cx, y: cy - S * halfPlaneSpanScale },
          glassIndexOfRefraction,
        ),
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
      createElement: (cx, cy) =>
        new ArcMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, { x: cx + S * curvedMirrorBulgeOffsetScale, y: cy }),
    },
    {
      key: "idealMirror",
      label: c.idealMirrorStringProperty,
      createIcon: idealCurvedMirrorIcon,
      createElement: (cx, cy) =>
        new IdealCurvedMirror({ x: cx, y: cy - S }, { x: cx, y: cy + S }, idealMirrorFocalLengthM),
    },
    {
      key: "parabolicMirror",
      label: c.parabolicMirrorStringProperty,
      createIcon: parabolicMirrorIcon,
      createElement: (cx, cy) =>
        new ParabolicMirror(
          { x: cx, y: cy - S },
          { x: cx, y: cy + S },
          { x: cx + S * curvedMirrorBulgeOffsetScale, y: cy },
        ),
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
          { x: cx, y: cy - S * apertureNotchDepthScale },
          { x: cx, y: cy + S * apertureNotchDepthScale },
        ),
    },
    {
      key: "beamSplitter",
      label: c.beamSplitterStringProperty,
      createIcon: beamSplitterIcon,
      createElement: (cx, cy) =>
        new BeamSplitterElement(
          { x: cx - S * beamSplitterDiagonalHalfScale, y: cy - S * beamSplitterDiagonalHalfScale },
          { x: cx + S * beamSplitterDiagonalHalfScale, y: cy + S * beamSplitterDiagonalHalfScale },
          beamSplitterTransmitFraction,
        ),
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
  const carouselSeparatorLineWidth = 1;
  const carouselNavArrowStrokeWidth = 2;

  const allDescriptors = getComponentDescriptors();

  // If a key list is provided, filter and order by it; otherwise use all.
  const descriptors = componentKeys
    ? componentKeys
        .map((key) => allDescriptors.find((d) => d.key === key))
        .filter((d): d is ComponentDescriptor => d !== undefined)
    : allDescriptors;

  const carouselItems: CarouselItem[] = descriptors.map((descriptor) => ({
    createNode: () => {
      const labelFontSizePx = 11;
      const labelMaxWidthBeyondIconPx = 20;
      const labelGapBelowIconPx = 2;
      const touchTargetPaddingPx = 4;

      const icon = descriptor.createIcon();
      const label = new Text(descriptor.label, {
        font: `${labelFontSizePx}px sans-serif`,
        fill: OpticsLabColors.carouselLabelFillProperty,
        maxWidth: ICON_SIZE + labelMaxWidthBeyondIconPx,
      });

      const container = new Node({
        children: [icon, label],
        cursor: "grab",
      });

      label.centerX = icon.centerX;
      label.top = ICON_HALF + labelGapBelowIconPx;

      // Expand the hit region to cover the full item area (icon + label + gap
      // between them) so touch anywhere in the cell starts the drag.
      container.mouseArea = container.localBounds;
      container.touchArea = container.localBounds.dilated(touchTargetPaddingPx);

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
      lineWidth: carouselSeparatorLineWidth,
    },
    buttonOptions: {
      baseColor: OpticsLabColors.carouselButtonBaseColorProperty,
      arrowPathOptions: {
        stroke: OpticsLabColors.carouselArrowStrokeProperty,
        lineWidth: carouselNavArrowStrokeWidth,
      },
    },
  });

  return carousel;
}

opticsLab.register("ComponentCarousel", { createComponentCarousel });
