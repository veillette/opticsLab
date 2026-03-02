/**
 * ComponentCarousel.ts
 *
 * A Carousel-based toolbox from which the user can drag optical components
 * onto the scene. Each carousel item is a small icon representing a component
 * type. Pressing an icon creates a new instance of that component at the
 * pointer position in MODEL coordinates, adds it to the model scene, and
 * creates the corresponding interactive view in the elements layer.
 */

import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node, Path, type PressListenerEvent, RichDragListener, Text } from "scenerystack/scenery";
import { Carousel, type CarouselItem } from "scenerystack/sun";
import opticsLab from "../../OpticsLabNamespace.js";
import { ApertureElement } from "../model/blockers/ApertureElement.js";
import { CircleBlocker } from "../model/blockers/CircleBlocker.js";
import { LineBlocker } from "../model/blockers/LineBlocker.js";
import { CircleGlass } from "../model/glass/CircleGlass.js";
import { HalfPlaneGlass } from "../model/glass/HalfPlaneGlass.js";
import { IdealLens } from "../model/glass/IdealLens.js";
import { Glass } from "../model/glass/Glass.js";
import { SphericalLens } from "../model/glass/SphericalLens.js";
import { ArcLightSource } from "../model/light-sources/ArcLightSource.js";
import { BeamSource } from "../model/light-sources/BeamSource.js";
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
const ICON_SIZE = 40;
const ICON_HALF = ICON_SIZE / 2;

// ── Element factory type ─────────────────────────────────────────────────────

interface ComponentDescriptor {
  label: string;
  createIcon: () => Node;
  /** cx, cy are in MODEL coordinates (metres, y-up). */
  createElement: (cx: number, cy: number) => OpticalElement;
}

// ── Icon builders ────────────────────────────────────────────────────────────

function pointSourceIcon(): Node {
  const node = new Node();
  const glow = new Circle(6, {
    fill: "rgba(255, 220, 80, 0.35)",
    stroke: "rgba(255, 220, 80, 0.9)",
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
      stroke: "rgba(255, 210, 60, 0.7)",
      lineWidth: 1,
    }),
  );
  return node;
}

function arcSourceIcon(): Node {
  const node = new Node();
  const rimShape = new Shape().arc(0, 0, 14, -Math.PI * 0.6, Math.PI * 0.6, false);
  node.addChild(new Path(rimShape, { stroke: "rgba(255, 215, 60, 0.40)", lineWidth: 1 }));
  const sectorShape = new Shape()
    .moveTo(0, 0)
    .arc(0, 0, 14, -Math.PI * 0.3, Math.PI * 0.3, false)
    .close();
  node.addChild(new Path(sectorShape, { fill: "rgba(255, 215, 60, 0.18)", stroke: "rgba(255, 215, 60, 0.65)", lineWidth: 1.2 }));
  const spokeShape = new Shape();
  for (let i = -2; i <= 2; i++) {
    const a = (i / 2) * Math.PI * 0.55;
    spokeShape.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
    spokeShape.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
  }
  node.addChild(new Path(spokeShape, { stroke: "rgba(255, 210, 60, 0.60)", lineWidth: 1 }));
  node.addChild(new Circle(4, { fill: "rgba(255, 220, 80, 0.35)", stroke: "rgba(255, 220, 80, 0.90)", lineWidth: 1.5 }));
  return node;
}

function beamSourceIcon(): Node {
  const node = new Node();
  for (let dy = -8; dy <= 8; dy += 8) {
    const shape = new Shape().moveTo(-12, dy).lineTo(8, dy);
    node.addChild(new Path(shape, { stroke: "#44ee66", lineWidth: 1.5 }));
    const arrow = new Shape().moveTo(5, dy - 4).lineTo(12, dy).lineTo(5, dy + 4);
    node.addChild(new Path(arrow, { stroke: "#44ee66", lineWidth: 1.5, lineCap: "round", lineJoin: "round" }));
  }
  return node;
}

function singleRayIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(10, 0);
  node.addChild(new Path(shape, { stroke: "#44ee66", lineWidth: 2 }));
  const arrow = new Shape().moveTo(6, -5).lineTo(14, 0).lineTo(6, 5);
  node.addChild(new Path(arrow, { stroke: "#44ee66", lineWidth: 2, lineCap: "round", lineJoin: "round" }));
  return node;
}

function segmentMirrorIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(new Path(shape, { stroke: "#666", lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(shape, { stroke: "#d8d8d8", lineWidth: 2, lineCap: "round" }));
  return node;
}

function arcMirrorIcon(): Node {
  const node = new Node();
  const shape = new Shape().arc(0, 20, 24, -Math.PI * 0.75, -Math.PI * 0.25);
  node.addChild(new Path(shape, { stroke: "#666", lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(shape, { stroke: "#d8d8d8", lineWidth: 2, lineCap: "round" }));
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
    if (i === 0) { shape.moveTo(x, y); } else { shape.lineTo(x, y); }
  }
  node.addChild(new Path(shape, { stroke: "#666", lineWidth: 4, lineCap: "round", lineJoin: "round" }));
  node.addChild(new Path(shape, { stroke: "#d8d8d8", lineWidth: 2, lineCap: "round", lineJoin: "round" }));
  return node;
}

function idealCurvedMirrorIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(new Path(lineShape, { stroke: "#666", lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(lineShape, { stroke: "#d8d8d8", lineWidth: 2, lineCap: "round" }));
  node.addChild(new Circle(2.5, { x: 0, y: -8, fill: "#ff8844" }));
  return node;
}

function beamSplitterIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(-10, 10).lineTo(10, -10);
  node.addChild(new Path(lineShape, { stroke: "#999", lineWidth: 2, lineDash: [4, 3] }));
  node.addChild(new Path(new Shape().moveTo(0, 0).lineTo(-10, -10), { stroke: "#d8d8d8", lineWidth: 1.5 }));
  node.addChild(new Path(new Shape().moveTo(0, 0).lineTo(10, 10), { stroke: "#d8d8d8", lineWidth: 1.5 }));
  return node;
}

function idealLensIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(0, -14).lineTo(0, 14);
  node.addChild(new Path(lineShape, { stroke: "#44cc88", lineWidth: 2.5, lineCap: "round" }));
  const topArrow = new Shape().moveTo(-5, -10).lineTo(0, -14).lineTo(5, -10);
  const botArrow = new Shape().moveTo(-5, 10).lineTo(0, 14).lineTo(5, 10);
  node.addChild(new Path(topArrow, { stroke: "#44cc88", lineWidth: 2, lineCap: "round", lineJoin: "round" }));
  node.addChild(new Path(botArrow, { stroke: "#44cc88", lineWidth: 2, lineCap: "round", lineJoin: "round" }));
  return node;
}

function circleGlassIcon(): Node {
  const node = new Node();
  node.addChild(new Circle(12, { fill: "rgba(100, 180, 255, 0.25)", stroke: "rgba(60, 130, 210, 0.8)", lineWidth: 1.5 }));
  return node;
}

function sphericalLensIcon(): Node {
  const node = new Node();
  const shape = new Shape()
    .arc(-12, 0, 18, -Math.PI / 4, Math.PI / 4)
    .arc(12, 0, 18, Math.PI - Math.PI / 4, Math.PI + Math.PI / 4)
    .close();
  node.addChild(new Path(shape, { fill: "rgba(100, 180, 255, 0.25)", stroke: "rgba(60, 130, 210, 0.8)", lineWidth: 1.5 }));
  return node;
}

function polygonGlassIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(0, -12).lineTo(12, 10).lineTo(-12, 10).close();
  node.addChild(new Path(shape, { fill: "rgba(100, 180, 255, 0.25)", stroke: "rgba(60, 130, 210, 0.8)", lineWidth: 1.5 }));
  return node;
}

function halfPlaneGlassIcon(): Node {
  const node = new Node();
  const lineShape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(new Path(lineShape, { stroke: "rgba(60, 130, 210, 0.8)", lineWidth: 2 }));
  const hatchShape = new Shape();
  for (let x = -12; x <= 12; x += 5) {
    hatchShape.moveTo(x, 2).lineTo(x - 4, 10);
  }
  node.addChild(new Path(hatchShape, { stroke: "rgba(60, 130, 210, 0.5)", lineWidth: 1 }));
  return node;
}

function lineBlockerIcon(): Node {
  const node = new Node();
  const shape = new Shape().moveTo(-14, 0).lineTo(14, 0);
  node.addChild(new Path(shape, { stroke: "#555", lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(shape, { stroke: "#222", lineWidth: 2, lineCap: "round" }));
  return node;
}

function circleBlockerIcon(): Node {
  const node = new Node();
  node.addChild(new Circle(12, { fill: "rgba(30, 30, 30, 0.5)", stroke: "#555", lineWidth: 1.5 }));
  return node;
}

function apertureIcon(): Node {
  const node = new Node();
  const left = new Shape().moveTo(-14, 0).lineTo(-4, 0);
  const right = new Shape().moveTo(4, 0).lineTo(14, 0);
  node.addChild(new Path(left, { stroke: "#555", lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(left, { stroke: "#222", lineWidth: 2, lineCap: "round" }));
  node.addChild(new Path(right, { stroke: "#555", lineWidth: 4, lineCap: "round" }));
  node.addChild(new Path(right, { stroke: "#222", lineWidth: 2, lineCap: "round" }));
  return node;
}

// ── Component descriptors ────────────────────────────────────────────────────
// cx, cy are MODEL coordinates (metres, y-up, origin at screen centre).
// S = default half-size in metres (0.6 m = 60 px at 100 px/m).

function getComponentDescriptors(): ComponentDescriptor[] {
  const S = 0.6; // default half-size in model metres
  return [
    // ── Light Sources ──────────────────────────────────────────────────────
    {
      label: "Point Source",
      createIcon: pointSourceIcon,
      createElement: (cx, cy) => new PointSourceElement({ x: cx, y: cy }, 0.6),
    },
    {
      label: "Arc Source",
      createIcon: arcSourceIcon,
      createElement: (cx, cy) => new ArcLightSource({ x: cx, y: cy }, 0, Math.PI, 0.5),
    },
    {
      label: "Beam",
      createIcon: beamSourceIcon,
      createElement: (cx, cy) => new BeamSource({ x: cx, y: cy - S / 2 }, { x: cx, y: cy + S / 2 }, 0.5, 532, 0),
    },
    {
      label: "Single Ray",
      createIcon: singleRayIcon,
      createElement: (cx, cy) => new SingleRaySource({ x: cx - S / 2, y: cy }, { x: cx + S / 2, y: cy }, 1.0),
    },

    // ── Mirrors ────────────────────────────────────────────────────────────
    {
      label: "Flat Mirror",
      createIcon: segmentMirrorIcon,
      createElement: (cx, cy) => new SegmentMirror({ x: cx - S, y: cy }, { x: cx + S, y: cy }),
    },
    {
      label: "Arc Mirror",
      createIcon: arcMirrorIcon,
      createElement: (cx, cy) => new ArcMirror({ x: cx - S, y: cy }, { x: cx + S, y: cy }, { x: cx, y: cy + S * 0.5 }),
    },
    {
      label: "Parabolic Mirror",
      createIcon: parabolicMirrorIcon,
      createElement: (cx, cy) =>
        new ParabolicMirror({ x: cx - S, y: cy }, { x: cx + S, y: cy }, { x: cx, y: cy + S * 0.5 }),
    },
    {
      label: "Ideal Mirror",
      createIcon: idealCurvedMirrorIcon,
      createElement: (cx, cy) => new IdealCurvedMirror({ x: cx - S, y: cy }, { x: cx + S, y: cy }, 0.8),
    },
    {
      label: "Beam Splitter",
      createIcon: beamSplitterIcon,
      createElement: (cx, cy) =>
        new BeamSplitterElement({ x: cx - S * 0.7, y: cy - S * 0.7 }, { x: cx + S * 0.7, y: cy + S * 0.7 }, 0.5),
    },

    // ── Lenses / Glass ─────────────────────────────────────────────────────
    {
      label: "Ideal Lens",
      createIcon: idealLensIcon,
      createElement: (cx, cy) => new IdealLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2),
    },
    {
      label: "Circle Glass",
      createIcon: circleGlassIcon,
      createElement: (cx, cy) => new CircleGlass({ x: cx, y: cy }, { x: cx + S * 0.7, y: cy }, 1.5),
    },
    {
      label: "Spherical Lens",
      createIcon: sphericalLensIcon,
      createElement: (cx, cy) => new SphericalLens({ x: cx, y: cy - S }, { x: cx, y: cy + S }, 1.2, -1.2, 1.5),
    },
    {
      label: "Prism",
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
      label: "Half-Plane Glass",
      createIcon: halfPlaneGlassIcon,
      createElement: (cx, cy) => new HalfPlaneGlass({ x: cx - S * 1.5, y: cy }, { x: cx + S * 1.5, y: cy }, 1.5),
    },

    // ── Blockers ───────────────────────────────────────────────────────────
    {
      label: "Line Blocker",
      createIcon: lineBlockerIcon,
      createElement: (cx, cy) => new LineBlocker({ x: cx - S, y: cy }, { x: cx + S, y: cy }),
    },
    {
      label: "Circle Blocker",
      createIcon: circleBlockerIcon,
      createElement: (cx, cy) => new CircleBlocker({ x: cx, y: cy }, { x: cx + S * 0.5, y: cy }),
    },
    {
      label: "Aperture",
      createIcon: apertureIcon,
      createElement: (cx, cy) =>
        new ApertureElement(
          { x: cx - S, y: cy },
          { x: cx + S, y: cy },
          { x: cx - S * 0.2, y: cy },
          { x: cx + S * 0.2, y: cy },
        ),
    },
  ];
}

// ── Callback type ────────────────────────────────────────────────────────────

export type AddElementCallback = (element: OpticalElement) => OpticalElementView | null;

// ── Carousel builder ─────────────────────────────────────────────────────────

/**
 * Creates a Carousel containing icons for every available optical component.
 *
 * @param mvt - model-to-view transform, used to convert pointer position to
 *   model coordinates when the user drags an icon onto the canvas.
 * @param onAddElement - called with the newly created OpticalElement; should
 *   add it to the model, create its view, and return the view (or null).
 */
export function createComponentCarousel(mvt: ModelViewTransform2, onAddElement: AddElementCallback): Carousel {
  const descriptors = getComponentDescriptors();

  const carouselItems: CarouselItem[] = descriptors.map((descriptor) => ({
    createNode: () => {
      const icon = descriptor.createIcon();
      const label = new Text(descriptor.label, {
        font: "11px sans-serif",
        fill: "#ccc",
        maxWidth: ICON_SIZE + 20,
      });

      const container = new Node({
        children: [icon, label],
        cursor: "pointer",
      });

      label.centerX = icon.centerX;
      label.top = ICON_HALF + 2;

      // Creator with drag forwarding: press an icon → create element at the
      // pointer position (converted to model coords) → forward the drag.
      container.addInputListener(
        RichDragListener.createForwardingListener(container, (event: PressListenerEvent) => {
          const point = event.pointer.point;
          // Convert view (pixel) pointer position to model (metre) coordinates.
          const cx = mvt.viewToModelX(point.x);
          const cy = mvt.viewToModelY(point.y);
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
    itemsPerPage: 6,
    spacing: 10,
    margin: 8,
    fill: "rgba(25, 25, 45, 0.90)",
    stroke: "rgba(120, 120, 140, 1)",
    cornerRadius: 8,
    buttonOptions: {
      baseColor: "rgba(80, 80, 100, 0.6)",
      arrowPathOptions: {
        stroke: "#ccc",
        lineWidth: 2,
      },
    },
  });

  return carousel;
}

opticsLab.register("ComponentCarousel", { createComponentCarousel });
