import { Property } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Display, Node, Path, Rectangle } from "scenerystack/scenery";
import { GridNode, MeasuringTapeNode, ProtractorNode, VisibleColor } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  CONT_SPECTRUM_RAY_ALPHA_MULTIPLIER,
  EXT_ALPHA_SCALE,
  EXT_B,
  EXT_G,
  EXT_LINE_DASH,
  EXT_LINE_WIDTH,
  EXT_R,
  PIXELS_PER_METER,
  PROTRACTOR_SCALE,
  RAY_ALPHA_BUCKETS,
  RAY_ALPHA_SCALE,
  RAY_ALPHA_SKIP,
  RAY_CLIP_MARGIN_PX,
  RAY_LINE_WIDTH,
} from "../../OpticsLabConstants.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { TracedSegment } from "../model/optics/RayTracer.js";
import { handlesVisibleProperty } from "./HandlesVisibleProperty.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";

/**
 * Scenery may introduce Canvas layers (full-size, cleared opaque) above SVG layers when the subtree mixes
 * renderers. Export must be SVG-only so ray paths are not covered by a black canvas block.
 */
function forceSVGRendererSubtree(root: Node): void {
  root.setRenderer("svg");
  for (const child of root.children) {
    forceSVGRendererSubtree(child);
  }
}

type SceneSVGExportOptions = {
  visibleBounds: Bounds2;
  modelViewTransform: ModelViewTransform2;
  elements: readonly OpticalElement[];
  segments: TracedSegment[];
  viewState: {
    showGrid: boolean;
    gridSpacing: number;
    showHandles: boolean;
    measuringTape: {
      visible: boolean;
      basePosition: Vector2;
      tipPosition: Vector2;
    };
    protractor: {
      visible: boolean;
      center: Vector2;
      angle: number;
    };
  };
};

type ClipRect = { xmin: number; ymin: number; xmax: number; ymax: number };
type RGBColor = { r: number; g: number; b: number };
type ForwardRayBucket = { shape: Shape; stroke: string };

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

function getAlphaForSegment(seg: TracedSegment): number {
  const alphaBase = seg.brightnessS + seg.brightnessP;
  return seg.isExtension
    ? Math.min(1, alphaBase * EXT_ALPHA_SCALE)
    : Math.min(1, alphaBase * RAY_ALPHA_SCALE) *
        (seg.isObserved ? 1.4 : 1) *
        (seg.spectrumAdditiveBlend ? CONT_SPECTRUM_RAY_ALPHA_MULTIPLIER : 1);
}

function getAlphaBucket(alpha: number): number {
  return Math.min(RAY_ALPHA_BUCKETS, Math.round(alpha * RAY_ALPHA_BUCKETS));
}

function getOrCreateExtensionShape(extensionShapes: Map<number, Shape>, alphaBucket: number): Shape {
  let shape = extensionShapes.get(alphaBucket);
  if (!shape) {
    shape = new Shape();
    extensionShapes.set(alphaBucket, shape);
  }
  return shape;
}

function getCachedWavelengthColor(wavelengthColorCache: Map<number, RGBColor>, wavelength: number): RGBColor {
  let wavelengthColor = wavelengthColorCache.get(wavelength);
  if (!wavelengthColor) {
    wavelengthColor = VisibleColor.wavelengthToColor(wavelength);
    wavelengthColorCache.set(wavelength, wavelengthColor);
  }
  return wavelengthColor;
}

function getOrCreateForwardBucket(
  forwardBuckets: Map<string, ForwardRayBucket>,
  wavelengthColor: RGBColor,
  alphaBucket: number,
): ForwardRayBucket {
  const bucketOpacity = alphaBucket / RAY_ALPHA_BUCKETS;
  const key = `${wavelengthColor.r},${wavelengthColor.g},${wavelengthColor.b},${alphaBucket}`;
  let bucket = forwardBuckets.get(key);
  if (!bucket) {
    bucket = {
      shape: new Shape(),
      stroke: `rgba(${wavelengthColor.r},${wavelengthColor.g},${wavelengthColor.b},${bucketOpacity})`,
    };
    forwardBuckets.set(key, bucket);
  }
  return bucket;
}

/** Renders traced rays above the background/grid but below optical elements (matches on-screen layering). */
function addRayPathNodes(
  parent: Node,
  segments: TracedSegment[],
  visibleBounds: Bounds2,
  modelViewTransform: ModelViewTransform2,
): void {
  const extensionShapes = new Map<number, Shape>();
  const forwardBuckets = new Map<string, ForwardRayBucket>();
  const wavelengthColorCache = new Map<number, RGBColor>();
  const clipRect: ClipRect = {
    xmin: visibleBounds.minX - RAY_CLIP_MARGIN_PX,
    ymin: visibleBounds.minY - RAY_CLIP_MARGIN_PX,
    xmax: visibleBounds.maxX + RAY_CLIP_MARGIN_PX,
    ymax: visibleBounds.maxY + RAY_CLIP_MARGIN_PX,
  };

  for (const seg of segments) {
    const alpha = getAlphaForSegment(seg);
    if (alpha < RAY_ALPHA_SKIP) {
      continue;
    }

    const clipped = clipSegment(
      modelViewTransform.modelToViewX(seg.p1.x),
      modelViewTransform.modelToViewY(seg.p1.y),
      modelViewTransform.modelToViewX(seg.p2.x),
      modelViewTransform.modelToViewY(seg.p2.y),
      clipRect,
    );
    if (!clipped) {
      continue;
    }

    const [x1, y1, x2, y2] = clipped;
    const alphaBucket = getAlphaBucket(alpha);

    if (seg.isExtension) {
      const shape = getOrCreateExtensionShape(extensionShapes, alphaBucket);
      shape.moveTo(x1, y1).lineTo(x2, y2);
    } else {
      const wavelength = seg.wavelength ?? 550;
      const wavelengthColor = getCachedWavelengthColor(wavelengthColorCache, wavelength);
      const bucket = getOrCreateForwardBucket(forwardBuckets, wavelengthColor, alphaBucket);
      bucket.shape.moveTo(x1, y1).lineTo(x2, y2);
    }
  }

  for (const [alphaBucket, shape] of extensionShapes) {
    parent.addChild(
      new Path(shape, {
        stroke: `rgb(${EXT_R},${EXT_G},${EXT_B})`,
        lineWidth: EXT_LINE_WIDTH,
        lineCap: "round",
        lineDash: EXT_LINE_DASH,
        opacity: alphaBucket / RAY_ALPHA_BUCKETS,
        pickable: false,
      }),
    );
  }

  for (const { shape, stroke } of forwardBuckets.values()) {
    parent.addChild(
      new Path(shape, {
        stroke,
        lineWidth: RAY_LINE_WIDTH,
        lineCap: "round",
        pickable: false,
      }),
    );
  }
}

const CS_INSIDE = 0;
const CS_LEFT = 1;
const CS_RIGHT = 2;
const CS_BOTTOM = 4;
const CS_TOP = 8;

function colorToCSS(color: string | { toCSS: () => string }): string {
  return typeof color === "string" ? color : color.toCSS();
}

function csOutcode(x: number, y: number, r: ClipRect): number {
  let code = CS_INSIDE;
  if (x < r.xmin) {
    code |= CS_LEFT;
  } else if (x > r.xmax) {
    code |= CS_RIGHT;
  }
  if (y < r.ymin) {
    code |= CS_TOP;
  } else if (y > r.ymax) {
    code |= CS_BOTTOM;
  }
  return code;
}

function clipSegment(
  inputX1: number,
  inputY1: number,
  inputX2: number,
  inputY2: number,
  r: ClipRect,
): [number, number, number, number] | null {
  let ax = inputX1;
  let ay = inputY1;
  let bx = inputX2;
  let by = inputY2;
  let code1 = csOutcode(ax, ay, r);
  let code2 = csOutcode(bx, by, r);

  for (;;) {
    if ((code1 | code2) === 0) {
      return [ax, ay, bx, by];
    }
    if ((code1 & code2) !== 0) {
      return null;
    }

    const codeOut = code1 !== 0 ? code1 : code2;
    let x = 0;
    let y = 0;

    if (codeOut & CS_BOTTOM) {
      x = ax + ((bx - ax) * (r.ymax - ay)) / (by - ay);
      y = r.ymax;
    } else if (codeOut & CS_TOP) {
      x = ax + ((bx - ax) * (r.ymin - ay)) / (by - ay);
      y = r.ymin;
    } else if (codeOut & CS_RIGHT) {
      y = ay + ((by - ay) * (r.xmax - ax)) / (bx - ax);
      x = r.xmax;
    } else {
      y = ay + ((by - ay) * (r.xmin - ax)) / (bx - ax);
      x = r.xmin;
    }

    if (codeOut === code1) {
      ax = x;
      ay = y;
      code1 = csOutcode(ax, ay, r);
    } else {
      bx = x;
      by = y;
      code2 = csOutcode(bx, by, r);
    }
  }
}

function buildFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `opticslab-scene-${timestamp}.svg`;
}

function triggerDownload(svgText: string): void {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const objectURL = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectURL;
  anchor.download = buildFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectURL), 0);
}

export function downloadSceneSVG({
  visibleBounds,
  modelViewTransform,
  elements,
  segments,
  viewState,
}: SceneSVGExportOptions): void {
  const savedHandlesVisible = handlesVisibleProperty.value;
  handlesVisibleProperty.value = viewState.showHandles;

  const exportWidth = Math.ceil(visibleBounds.width);
  const exportHeight = Math.ceil(visibleBounds.height);
  const exportRoot = new Node({ renderer: "svg" });
  const exportViews: OpticalElementView[] = [];
  const exportOverlayNodes: Node[] = [];

  try {
    exportRoot.x = -visibleBounds.minX;
    exportRoot.y = -visibleBounds.minY;

    exportRoot.addChild(
      new Rectangle(visibleBounds.minX, visibleBounds.minY, visibleBounds.width, visibleBounds.height, {
        fill: colorToCSS(OpticsLabColors.backgroundColorProperty.value),
      }),
    );

    if (viewState.showGrid) {
      const halfScreenM = Math.max(visibleBounds.width, visibleBounds.height) / 2 / PIXELS_PER_METER;
      const linesPerSide = Math.ceil(halfScreenM / viewState.gridSpacing) + 2;
      exportRoot.addChild(
        new GridNode(new Property(modelViewTransform), viewState.gridSpacing, Vector2.ZERO, linesPerSide, {
          stroke: colorToCSS(OpticsLabColors.gridLineStrokeProperty.value),
          lineWidth: 1,
        }),
      );
    }

    const raysNode = new Node({ pickable: false });
    addRayPathNodes(raysNode, segments, visibleBounds, modelViewTransform);
    exportRoot.addChild(raysNode);

    const elementsLayer = new Node();
    for (const element of elements) {
      const view = createOpticalElementView(element, modelViewTransform, Tandem.OPT_OUT);
      if (!view) {
        continue;
      }
      view.pickable = false;
      exportViews.push(view);
      elementsLayer.addChild(view);
    }
    exportRoot.addChild(elementsLayer);

    if (viewState.measuringTape.visible) {
      const uiStrings = StringManager.getInstance().getUIStrings();
      const measuringTapeNode = new MeasuringTapeNode(
        new Property({
          name: uiStrings.metersUnitStringProperty.value,
          multiplier: 1,
        }),
        {
          interactive: false,
          modelViewTransform,
          significantFigures: 2,
          textColor: OpticsLabColors.measuringTapeTextColorProperty,
          textBackgroundColor: OpticsLabColors.measuringTapeBackgroundColorProperty,
          basePositionProperty: new Property(viewState.measuringTape.basePosition.copy()),
          tipPositionProperty: new Property(viewState.measuringTape.tipPosition.copy()),
          pickable: false,
        },
      );
      exportOverlayNodes.push(measuringTapeNode);
      exportRoot.addChild(measuringTapeNode);
    }

    if (viewState.protractor.visible) {
      const protractorNode = new ProtractorNode({
        angle: viewState.protractor.angle,
        scale: PROTRACTOR_SCALE,
        pickable: false,
      });
      protractorNode.center = viewState.protractor.center.copy();
      exportOverlayNodes.push(protractorNode);
      exportRoot.addChild(protractorNode);
    }

    forceSVGRendererSubtree(exportRoot);

    const display = new Display(exportRoot, {
      width: exportWidth,
      height: exportHeight,
      accessibility: false,
      allowWebGL: false,
      interactive: false,
    });

    try {
      display.updateDisplay();

      const svgElement = display.domElement.querySelector("svg");
      if (!(svgElement instanceof SVGSVGElement)) {
        throw new Error("Scene SVG root was not created.");
      }

      const exportSVG = svgElement.cloneNode(true) as SVGSVGElement;
      exportSVG.setAttribute("xmlns", SVG_NS);
      exportSVG.setAttribute("xmlns:xlink", XLINK_NS);
      exportSVG.setAttribute("width", `${exportWidth}`);
      exportSVG.setAttribute("height", `${exportHeight}`);
      exportSVG.setAttribute("viewBox", `0 0 ${exportWidth} ${exportHeight}`);

      const svgText = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(exportSVG)}`;
      triggerDownload(svgText);
    } finally {
      display.dispose();
    }
  } finally {
    handlesVisibleProperty.value = savedHandlesVisible;
    for (const overlayNode of exportOverlayNodes) {
      overlayNode.dispose();
    }
    for (const view of exportViews) {
      view.dispose();
    }
  }
}
