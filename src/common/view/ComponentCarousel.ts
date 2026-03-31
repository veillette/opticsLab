/**
 * ComponentCarousel.ts
 *
 * A Carousel-based toolbox from which the user can drag optical components
 * onto the scene. Each carousel item is a small icon representing a component
 * type. Pressing an icon creates a new instance of that component at the
 * pointer position in MODEL coordinates, adds it to the model scene, and
 * creates the corresponding interactive view in the elements layer.
 *
 * Element construction is delegated to ComponentFactory (model layer) so this
 * file no longer needs to import every model class directly.
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
  CAROUSEL_CORNER_RADIUS,
  CAROUSEL_ICON_SIZE_PX,
  CAROUSEL_ITEM_MARGIN,
  CAROUSEL_ITEM_SPACING,
  CAROUSEL_ITEMS_PER_PAGE,
} from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import { type ComponentKey, createDefaultElement } from "../model/ComponentFactory.js";
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
  fiberOpticIcon,
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

// Re-export ComponentKey so existing consumers don't need to change their import paths.
export type { ComponentKey } from "../model/ComponentFactory.js";

// ── Icon dimensions ──────────────────────────────────────────────────────────
const ICON_SIZE = CAROUSEL_ICON_SIZE_PX;
const ICON_HALF = ICON_SIZE / 2;

// ── Component descriptor (view-only fields) ──────────────────────────────────

interface ComponentDescriptor {
  key: ComponentKey;
  label: ReadOnlyProperty<string>;
  createIcon: () => Node;
}

// ── Component descriptors ────────────────────────────────────────────────────

function getComponentDescriptors(): ComponentDescriptor[] {
  const c = StringManager.getInstance().getComponentStrings();

  return [
    // ── Diffraction Gratings ──────────────────────────────────────────────
    { key: "transmissionGrating", label: c.transmissionGratingStringProperty, createIcon: transmissionGratingIcon },
    { key: "reflectionGrating", label: c.reflectionGratingStringProperty, createIcon: reflectionGratingIcon },

    // ── Light Sources ──────────────────────────────────────────────────────
    { key: "beam", label: c.beamStringProperty, createIcon: beamSourceIcon },
    { key: "divergentBeam", label: c.divergentBeamStringProperty, createIcon: divergentBeamIcon },
    { key: "singleRay", label: c.singleRayStringProperty, createIcon: singleRayIcon },
    { key: "continuousSpectrum", label: c.continuousSpectrumStringProperty, createIcon: contSpectrumIcon },
    { key: "arcSource", label: c.arcSourceStringProperty, createIcon: arcSourceIcon },
    { key: "pointSource", label: c.pointSourceStringProperty, createIcon: pointSourceIcon },

    // ── Lenses / Glass ─────────────────────────────────────────────────────
    { key: "sphericalLens", label: c.sphericalLensStringProperty, createIcon: sphericalLensIcon },
    { key: "biconvexLens", label: c.biconvexLensStringProperty, createIcon: biconvexLensIcon },
    { key: "biconcaveLens", label: c.biconcaveLensStringProperty, createIcon: biconcaveLensIcon },
    { key: "planoConvexLens", label: c.planoConvexLensStringProperty, createIcon: planoConvexLensIcon },
    { key: "planoConcaveLens", label: c.planoConcaveLensStringProperty, createIcon: planoConcaveLensIcon },
    { key: "idealLens", label: c.idealLensStringProperty, createIcon: idealLensIcon },
    { key: "circleGlass", label: c.circleGlassStringProperty, createIcon: circleGlassIcon },
    { key: "prism", label: c.prismStringProperty, createIcon: polygonGlassIcon },
    { key: "equilateralPrism", label: c.equilateralPrismStringProperty, createIcon: equilateralPrismIcon },
    { key: "rightAnglePrism", label: c.rightAnglePrismStringProperty, createIcon: rightAnglePrismIcon },
    { key: "porroPrism", label: c.porroPrismStringProperty, createIcon: porroPrismIcon },
    { key: "slabGlass", label: c.slabGlassStringProperty, createIcon: slabGlassIcon },
    { key: "parallelogramPrism", label: c.parallelogramPrismStringProperty, createIcon: parallelogramPrismIcon },
    { key: "dovePrism", label: c.dovePrismStringProperty, createIcon: dovePrismIcon },
    { key: "halfPlaneGlass", label: c.halfPlaneGlassStringProperty, createIcon: halfPlaneGlassIcon },

    // ── Mirrors ────────────────────────────────────────────────────────────
    { key: "flatMirror", label: c.flatMirrorStringProperty, createIcon: segmentMirrorIcon },
    { key: "arcMirror", label: c.arcMirrorStringProperty, createIcon: arcMirrorIcon },
    { key: "idealMirror", label: c.idealMirrorStringProperty, createIcon: idealCurvedMirrorIcon },
    { key: "parabolicMirror", label: c.parabolicMirrorStringProperty, createIcon: parabolicMirrorIcon },
    { key: "aperturedMirror", label: c.aperturedMirrorStringProperty, createIcon: aperturedMirrorIcon },

    // ── Blockers ───────────────────────────────────────────────────────────
    { key: "lineBlocker", label: c.lineBlockerStringProperty, createIcon: lineBlockerIcon },
    { key: "detector", label: c.detectorStringProperty, createIcon: detectorIcon },
    { key: "aperture", label: c.apertureStringProperty, createIcon: apertureIcon },
    { key: "beamSplitter", label: c.beamSplitterStringProperty, createIcon: beamSplitterIcon },

    // ── Guides ──────────────────────────────────────────────────────────────
    { key: "track", label: c.trackStringProperty, createIcon: trackIcon },

    // ── Fiber Optic ─────────────────────────────────────────────────────────
    { key: "fiberOptic", label: c.fiberOpticStringProperty, createIcon: fiberOpticIcon },
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
          const element = createDefaultElement(descriptor.key, cx, cy);
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
