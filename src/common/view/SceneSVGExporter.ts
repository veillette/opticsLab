import { Property } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Display, Node, Path, Rectangle } from "scenerystack/scenery";
import { GridNode, VisibleColor } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
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
  RAY_ALPHA_SCALE,
  RAY_ALPHA_SKIP,
  RAY_CLIP_MARGIN_PX,
  RAY_LINE_WIDTH,
} from "../../OpticsLabConstants.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";
import type { TracedSegment } from "../model/optics/RayTracer.js";
import { handlesVisibleProperty } from "./HandlesVisibleProperty.js";
import { createOpticalElementView, type OpticalElementView } from "./OpticalElementViewFactory.js";

type SceneSVGExportOptions = {
  visibleBounds: Bounds2;
  modelViewTransform: ModelViewTransform2;
  elements: readonly OpticalElement[];
  segments: TracedSegment[];
  showGrid: boolean;
  gridSpacing: number;
};

type ClipRect = { xmin: number; ymin: number; xmax: number; ymax: number };

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

/** Renders traced rays above the background/grid but below optical elements (matches on-screen layering). */
function addRayPathNodes(
  parent: Node,
  segments: TracedSegment[],
  visibleBounds: Bounds2,
  modelViewTransform: ModelViewTransform2,
): void {
  const minX = visibleBounds.minX;
  const minY = visibleBounds.minY;
  const toLocalX = (vx: number) => vx + minX;
  const toLocalY = (vy: number) => vy + minY;

  const clipRect: ClipRect = {
    xmin: visibleBounds.minX - RAY_CLIP_MARGIN_PX,
    ymin: visibleBounds.minY - RAY_CLIP_MARGIN_PX,
    xmax: visibleBounds.maxX + RAY_CLIP_MARGIN_PX,
    ymax: visibleBounds.maxY + RAY_CLIP_MARGIN_PX,
  };

  for (const seg of segments) {
    const alphaBase = seg.brightnessS + seg.brightnessP;
    const alpha = seg.isExtension
      ? Math.min(1, alphaBase * EXT_ALPHA_SCALE)
      : Math.min(1, alphaBase * RAY_ALPHA_SCALE) *
        (seg.isObserved ? 1.4 : 1) *
        (seg.spectrumAdditiveBlend ? CONT_SPECTRUM_RAY_ALPHA_MULTIPLIER : 1);

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
    const lx1 = toLocalX(x1);
    const ly1 = toLocalY(y1);
    const lx2 = toLocalX(x2);
    const ly2 = toLocalY(y2);

    const shape = new Shape().moveTo(lx1, ly1).lineTo(lx2, ly2);
    const opacity = Math.min(1, alpha);

    if (seg.isExtension) {
      parent.addChild(
        new Path(shape, {
          stroke: `rgb(${EXT_R},${EXT_G},${EXT_B})`,
          lineWidth: EXT_LINE_WIDTH,
          lineCap: "round",
          lineDash: [...EXT_LINE_DASH],
          opacity,
          pickable: false,
        }),
      );
    } else {
      const wavelengthColor = VisibleColor.wavelengthToColor(seg.wavelength ?? 550);
      parent.addChild(
        new Path(shape, {
          stroke: `rgba(${wavelengthColor.r},${wavelengthColor.g},${wavelengthColor.b},${opacity})`,
          lineWidth: RAY_LINE_WIDTH,
          lineCap: "round",
          pickable: false,
        }),
      );
    }
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
  showGrid,
  gridSpacing,
}: SceneSVGExportOptions): void {
  const savedHandlesVisible = handlesVisibleProperty.value;
  handlesVisibleProperty.value = true;

  const exportWidth = Math.ceil(visibleBounds.width);
  const exportHeight = Math.ceil(visibleBounds.height);
  const exportRoot = new Node({ renderer: "svg" });
  const exportViews: OpticalElementView[] = [];

  try {
    exportRoot.x = -visibleBounds.minX;
    exportRoot.y = -visibleBounds.minY;

    exportRoot.addChild(
      new Rectangle(visibleBounds.minX, visibleBounds.minY, visibleBounds.width, visibleBounds.height, {
        fill: colorToCSS(OpticsLabColors.backgroundColorProperty.value),
      }),
    );

    if (showGrid) {
      const halfScreenM = Math.max(visibleBounds.width, visibleBounds.height) / 2 / PIXELS_PER_METER;
      const linesPerSide = Math.ceil(halfScreenM / gridSpacing) + 2;
      exportRoot.addChild(
        new GridNode(new Property(modelViewTransform), gridSpacing, Vector2.ZERO, linesPerSide, {
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

    const display = new Display(exportRoot, {
      width: exportWidth,
      height: exportHeight,
      accessibility: false,
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
    for (const view of exportViews) {
      view.dispose();
    }
  }
}
