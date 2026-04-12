/**
 * CarouselPanel.ts
 *
 * Groups the component-carousel toolbox, its vertical page-control dots, and
 * the grid-scale indicator into a single Node.  The panel stays at the scene
 * origin (local = parent space) so that Scenery positioning calls issued inside
 * the constructor target the same coordinate space as the rest of SimScreenView.
 *
 * Responsibilities
 * ─────────────────
 *  • Create the ComponentCarousel, PageControl, and GridScaleIndicatorNode.
 *  • Register the visibleBoundsProperty listener that pins the carousel to the
 *    left edge of the safe area and keeps the scale indicator below it.
 *  • Register the gridSizeProperty listener that rebuilds the indicator when the
 *    grid spacing changes.
 *
 * SimScreenView adds this panel to the scene graph as a single child and reads
 * `carousel` and `pageControl` for PDOM ordering.
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node } from "scenerystack/scenery";
import { type Carousel, PageControl } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  CAROUSEL_OFFSET_FROM_PAGE_CONTROL,
  CAROUSEL_PAGE_CONTROL_DOT_RADIUS,
  CAROUSEL_PAGE_CONTROL_DOT_SPACING,
  CAROUSEL_PAGE_CONTROL_MARGIN,
  GRID_SCALE_INDICATOR_MARGIN,
} from "../../OpticsLabConstants.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { RayTracingCommonModel } from "../model/SimModel.js";
import { type ComponentKey, createComponentCarousel } from "./ComponentCarousel.js";
import { GridScaleIndicatorNode } from "./GridScaleIndicatorNode.js";
import type { OpticalElementView } from "./OpticalElementViewFactory.js";

export class CarouselPanel extends Node {
  /** The Carousel widget – exposed for return-to-carousel deletion detection and PDOM order. */
  public readonly carousel: Carousel;

  /** The PageControl dots – exposed for PDOM order. */
  public readonly pageControl: Node;

  public constructor(
    modelViewTransform: ModelViewTransform2,
    globalToLocalPoint: (p: import("scenerystack/dot").Vector2) => import("scenerystack/dot").Vector2,
    createElement: (element: OpticalElement) => OpticalElementView | null,
    model: RayTracingCommonModel,
    visibleBoundsProperty: ReadOnlyProperty<Bounds2>,
    tandem: Tandem | undefined,
    carouselComponents?: ComponentKey[],
  ) {
    super();

    const carousel = createComponentCarousel(modelViewTransform, globalToLocalPoint, createElement, carouselComponents);
    this.carousel = carousel;

    const pageControl = new PageControl(carousel.pageNumberProperty, carousel.numberOfPagesProperty, {
      interactive: true,
      orientation: "vertical",
      dotRadius: CAROUSEL_PAGE_CONTROL_DOT_RADIUS,
      dotSpacing: CAROUSEL_PAGE_CONTROL_DOT_SPACING,
      currentPageFill: OpticsLabColors.pageControlCurrentFillProperty,
      currentPageStroke: null,
      pageFill: OpticsLabColors.pageControlInactiveFillProperty,
      pageStroke: null,
      tandem: tandem?.createTandem("pageControl") ?? Tandem.OPTIONAL,
    });
    this.pageControl = pageControl;

    const gridScaleIndicatorNode = new GridScaleIndicatorNode();
    gridScaleIndicatorNode.rebuild(model.scene.gridSizeProperty.value, modelViewTransform);
    model.scene.showGridProperty.linkAttribute(gridScaleIndicatorNode, "visible");

    this.addChild(pageControl);
    this.addChild(carousel);
    this.addChild(gridScaleIndicatorNode);

    // ── Grid scale indicator: x is model-aligned, top hugs the carousel bottom ─
    const positionGridScaleIndicator = (): void => {
      const spacing = model.scene.gridSizeProperty.value;
      const carouselCenterXModel = modelViewTransform.viewToModelX(carousel.centerX);
      const leftIndex = Math.floor(carouselCenterXModel / spacing);
      // node.x places local x=0 (the left tick) exactly on the grid line.
      gridScaleIndicatorNode.x = modelViewTransform.modelToViewX(leftIndex * spacing);
      gridScaleIndicatorNode.top = carousel.bottom + GRID_SCALE_INDICATOR_MARGIN;
    };

    model.scene.gridSizeProperty.lazyLink((spacing) => {
      gridScaleIndicatorNode.rebuild(spacing, modelViewTransform);
      positionGridScaleIndicator();
    });

    // ── Pin carousel + page control to the left safe-area edge ────────────────
    visibleBoundsProperty.link((visibleBounds) => {
      pageControl.left = visibleBounds.minX + CAROUSEL_PAGE_CONTROL_MARGIN;
      pageControl.centerY = visibleBounds.centerY;
      carousel.left = pageControl.right + CAROUSEL_OFFSET_FROM_PAGE_CONTROL;
      carousel.centerY = visibleBounds.centerY;
      positionGridScaleIndicator();
    });
  }
}
