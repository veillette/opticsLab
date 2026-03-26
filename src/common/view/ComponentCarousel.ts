/**
 * ComponentCarousel.ts
 *
 * A Carousel-based toolbox from which the user can drag optical components
 * onto the scene. Each carousel item is a small icon representing a component
 * type. Pressing an icon creates a new instance of that component at the
 * pointer position in MODEL coordinates, adds it to the model scene, and
 * creates the corresponding interactive view in the elements layer.
 *
 * Icon SVG builders live in ./carousel/CarouselIcons.ts to keep this file
 * focused on carousel orchestration.
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, type PressListenerEvent, RichDragListener, Text } from "scenerystack/scenery";
import { Carousel, type CarouselItem } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  APERTURED_MIRROR_APERTURE_DEFAULT_M,
  CAROUSEL_CORNER_RADIUS,
  CAROUSEL_DEFAULT_HALF_SIZE_M,
  CAROUSEL_ICON_SIZE_PX,
  CAROUSEL_ITEM_MARGIN,
  CAROUSEL_ITEM_SPACING,
  CAROUSEL_ITEMS_PER_PAGE,
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
import { DivergentBeam } from "../model/light-sources/DivergentBeam.js";
import { PointSourceElement } from "../model/light-sources/PointSourceElement.js";
import { SingleRaySource } from "../model/light-sources/SingleRaySource.js";
import { AperturedParabolicMirror } from "../model/mirrors/AperturedParabolicMirror.js";
import { ArcMirror } from "../model/mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../model/mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../model/mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "../model/mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../model/mirrors/SegmentMirror.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import {
  aperturedMirrorIcon,
  apertureIcon,
  arcMirrorIcon,
  arcSourceIcon,
  beamSourceIcon,
  beamSplitterIcon,
  biconcaveLensIcon,
  biconvexLensIcon,
  circleGlassIcon,
  contSpectrumIcon,
  detectorIcon,
  divergentBeamIcon,
  dovePrismIcon,
  equilateralPrismIcon,
  halfPlaneGlassIcon,
  idealCurvedMirrorIcon,
  idealLensIcon,
  lineBlockerIcon,
  parabolicMirrorIcon,
  parallelogramPrismIcon,
  planoConcaveLensIcon,
  planoConvexLensIcon,
  pointSourceIcon,
  polygonGlassIcon,
  porroPrismIcon,
  reflectionGratingIcon,
  rightAnglePrismIcon,
  segmentMirrorIcon,
  singleRayIcon,
  slabGlassIcon,
  sphericalLensIcon,
  trackIcon,
  transmissionGratingIcon,
} from "./carousel/CarouselIcons.js";
import type { OpticalElementView } from "./ElementRegistry.js";

// ── Icon dimensions ──────────────────────────────────────────────────────────
const ICON_SIZE = CAROUSEL_ICON_SIZE_PX;
const ICON_HALF = ICON_SIZE / 2;

// ── Element factory type ─────────────────────────────────────────────────────

/** Unique key for each component type available in the carousel. */
export type ComponentKey =
  | "transmissionGrating"
  | "reflectionGrating"
  | "beam"
  | "divergentBeam"
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
  | "aperturedMirror"
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
        ),
    },
    {
      key: "divergentBeam",
      label: c.divergentBeamStringProperty,
      createIcon: divergentBeamIcon,
      createElement: (cx, cy) =>
        new DivergentBeam(
          { x: cx, y: cy - halfDefaultSizeM },
          { x: cx, y: cy + halfDefaultSizeM },
          beamSourceBrightness,
          beamSourceWavelengthNm,
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
    {
      key: "aperturedMirror",
      label: c.aperturedMirrorStringProperty,
      createIcon: aperturedMirrorIcon,
      createElement: (cx, cy) =>
        new AperturedParabolicMirror(
          { x: cx, y: cy - S },
          { x: cx, y: cy + S },
          { x: cx + S * curvedMirrorBulgeOffsetScale, y: cy },
          APERTURED_MIRROR_APERTURE_DEFAULT_M,
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
      createElement: (cx, cy) =>
        new DetectorElement(
          { x: cx, y: cy - S },
          { x: cx, y: cy + S },
          { x: cx + S * curvedMirrorBulgeOffsetScale, y: cy },
        ),
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
