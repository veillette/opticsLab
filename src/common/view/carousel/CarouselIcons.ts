/**
 * CarouselIcons.ts
 *
 * SVG icon builder functions for every optical component available in the
 * carousel toolbox.  Each function returns a Scenery Node ready to be used
 * as a carousel thumbnail.
 *
 * Functions are grouped by element family and exported individually so that
 * ComponentCarousel can import exactly what it needs.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Node, Path } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import OpticsLabColors from "../../../OpticsLabColors.js";
import { CONT_SPECTRUM_SAMPLE_WL } from "../../../OpticsLabConstants.js";

// ── Light Sources ─────────────────────────────────────────────────────────────

export function pointSourceIcon(): Node {
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

export function arcSourceIcon(): Node {
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

export function beamSourceIcon(): Node {
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

export function singleRayIcon(): Node {
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

export function contSpectrumIcon(): Node {
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

// ── Mirrors ───────────────────────────────────────────────────────────────────

export function segmentMirrorIcon(): Node {
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

export function arcMirrorIcon(): Node {
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

export function parabolicMirrorIcon(): Node {
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

export function aperturedMirrorIcon(): Node {
  const node = new Node();
  const segmentCount = 20;
  const horizontalHalfExtent = 14;
  const parabolaDepth = 10;
  const parabolaVerticalOffset = 4;
  const backLineWidth = 4;
  const frontLineWidth = 2;
  const gapFraction = 0.25;

  for (const [fromFrac, toFrac] of [
    [-1, -gapFraction],
    [gapFraction, 1],
  ] as [number, number][]) {
    const fromIdx = Math.round(((fromFrac + 1) / 2) * segmentCount);
    const toIdx = Math.round(((toFrac + 1) / 2) * segmentCount);
    const armShape = new Shape();
    for (let i = fromIdx; i <= toIdx; i++) {
      const t = (i / segmentCount) * 2 - 1;
      const x = t * horizontalHalfExtent;
      const y = -t * t * parabolaDepth + parabolaVerticalOffset;
      if (i === fromIdx) {
        armShape.moveTo(x, y);
      } else {
        armShape.lineTo(x, y);
      }
    }
    node.addChild(
      new Path(armShape, {
        stroke: OpticsLabColors.mirrorBackStrokeProperty,
        lineWidth: backLineWidth,
        lineCap: "round",
        lineJoin: "round",
      }),
    );
    node.addChild(
      new Path(armShape, {
        stroke: OpticsLabColors.mirrorFrontStrokeProperty,
        lineWidth: frontLineWidth,
        lineCap: "round",
        lineJoin: "round",
      }),
    );
  }
  return node;
}

export function idealCurvedMirrorIcon(): Node {
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

export function beamSplitterIcon(): Node {
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

// ── Lenses / Glass ────────────────────────────────────────────────────────────

export function idealLensIcon(): Node {
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

export function circleGlassIcon(): Node {
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

export function sphericalLensIcon(): Node {
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

export function biconvexLensIcon(): Node {
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

export function biconcaveLensIcon(): Node {
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

export function planoConvexLensIcon(): Node {
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

export function planoConcaveLensIcon(): Node {
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

export function polygonGlassIcon(): Node {
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

export function equilateralPrismIcon(): Node {
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

export function rightAnglePrismIcon(): Node {
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

export function porroPrismIcon(): Node {
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

export function slabGlassIcon(): Node {
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

export function parallelogramPrismIcon(): Node {
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

export function dovePrismIcon(): Node {
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

export function halfPlaneGlassIcon(): Node {
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

// ── Blockers / Detectors ──────────────────────────────────────────────────────

export function lineBlockerIcon(): Node {
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

export function detectorIcon(): Node {
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

export function apertureIcon(): Node {
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

// ── Gratings ──────────────────────────────────────────────────────────────────

export function transmissionGratingIcon(): Node {
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

export function reflectionGratingIcon(): Node {
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

// ── Guides ────────────────────────────────────────────────────────────────────

export function trackIcon(): Node {
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
