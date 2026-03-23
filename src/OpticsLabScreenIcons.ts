/**
 * Home screen and navigation bar icons for each OpticsLab screen.
 * Motifs use scenery nodes; ScreenIcon scales and centers them on the standard joist background.
 */

import type { Color } from "scenerystack";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import OpticsLabColors from "./OpticsLabColors.js";

const RAY = "#55ee77";
const RAY_SOFT = "#88dd99";
const LENS_STROKE = "rgba(140, 200, 255, 0.95)";
const LENS_FILL = "rgba(100, 180, 255, 0.35)";
const MIRROR = "rgba(210, 210, 220, 0.9)";
const ACCENT = "#ffaa55";
const GRATING = "rgba(200, 210, 230, 0.85)";
const PRESET_ROW = "rgba(160, 175, 200, 0.55)";
const PRESET_ROW_STROKE = "rgba(200, 210, 230, 0.5)";

function iconBackgroundFill(): Color | string {
  return OpticsLabColors.backgroundColorProperty.value;
}

function wrapIntroIcon(): Node {
  const root = new Node();

  // Open book (simplified)
  const leftPage = new Path(Shape.roundRect(-85, -55, 78, 110, 4, 4), {
    fill: "rgba(55, 60, 80, 0.85)",
    stroke: "rgba(130, 140, 170, 0.6)",
    lineWidth: 2,
  });
  const rightPage = new Path(Shape.roundRect(7, -55, 78, 110, 4, 4), {
    fill: "rgba(45, 50, 70, 0.9)",
    stroke: "rgba(130, 140, 170, 0.6)",
    lineWidth: 2,
  });
  root.addChild(leftPage);
  root.addChild(rightPage);

  // Tiny ray diagram on right page
  const lens = new Path(Shape.ellipse(38, 0, 11, 20, 0), {
    fill: LENS_FILL,
    stroke: LENS_STROKE,
    lineWidth: 1.8,
  });
  root.addChild(lens);
  root.addChild(new Line(5, -18, 28, -18, { stroke: RAY, lineWidth: 2.5, lineCap: "round" }));
  root.addChild(new Line(5, 0, 28, 0, { stroke: RAY, lineWidth: 2.5, lineCap: "round" }));
  root.addChild(new Line(5, 18, 28, 18, { stroke: RAY, lineWidth: 2.5, lineCap: "round" }));
  root.addChild(new Line(48, -14, 72, -22, { stroke: RAY_SOFT, lineWidth: 2.2, lineCap: "round" }));
  root.addChild(new Line(48, 0, 75, 0, { stroke: RAY, lineWidth: 2.2, lineCap: "round" }));
  root.addChild(new Line(48, 14, 72, 22, { stroke: RAY_SOFT, lineWidth: 2.2, lineCap: "round" }));

  return root;
}

function wrapLabIcon(): Node {
  const root = new Node();

  // Optical bench
  root.addChild(
    new Line(-95, 42, 95, 42, {
      stroke: "rgba(120, 130, 150, 0.7)",
      lineWidth: 5,
      lineCap: "round",
    }),
  );

  // Point source
  root.addChild(
    new Path(Shape.circle(-72, 42, 7), {
      fill: ACCENT,
      stroke: "rgba(255, 200, 120, 0.9)",
      lineWidth: 1.5,
    }),
  );

  // Biconvex lens
  root.addChild(
    new Path(
      new Shape()
        .moveTo(-12, -38)
        .arc(0, 0, 38, -Math.PI / 2, Math.PI / 2, false)
        .arc(0, 0, 38, Math.PI / 2, -Math.PI / 2, true)
        .close(),
      { fill: LENS_FILL, stroke: LENS_STROKE, lineWidth: 2.2 },
    ),
  );

  // Mirror on the right
  root.addChild(new Line(62, -32, 62, 32, { stroke: MIRROR, lineWidth: 5, lineCap: "round" }));

  // Rays: source → lens → mirror → reflect
  root.addChild(new Line(-65, 42, -25, 42, { stroke: RAY, lineWidth: 2.8, lineCap: "round" }));
  root.addChild(new Line(-25, 42, 18, 15, { stroke: RAY, lineWidth: 2.5, lineCap: "round" }));
  root.addChild(new Line(18, 15, 58, 8, { stroke: RAY_SOFT, lineWidth: 2.2, lineCap: "round" }));
  root.addChild(new Line(58, 8, 58, -18, { stroke: RAY_SOFT, lineWidth: 2.2, lineCap: "round" }));
  root.addChild(new Line(58, -18, 20, -35, { stroke: RAY_SOFT, lineWidth: 2.2, lineCap: "round" }));

  return root;
}

function wrapPresetsIcon(): Node {
  const root = new Node();
  const w = 150;
  const h = 28;
  const gap = 14;
  for (let i = 0; i < 3; i++) {
    const y = -gap - h + i * (h + gap);
    root.addChild(
      new Path(Shape.roundRect(-w / 2, y, w, h, 6, 6), {
        fill: PRESET_ROW,
        stroke: PRESET_ROW_STROKE,
        lineWidth: 1.5,
      }),
    );
    // Mini “scene” stripes on each row
    root.addChild(
      new Line(-58, y + h / 2, -35, y + h / 2, {
        stroke: i === 1 ? LENS_STROKE : RAY,
        lineWidth: 2.5,
        lineCap: "round",
      }),
    );
    root.addChild(
      new Line(-20, y + h / 2, 18, y + h / 2, {
        stroke: RAY_SOFT,
        lineWidth: 2,
        lineCap: "round",
      }),
    );
  }
  // Bookmark tab on top card
  root.addChild(
    new Path(
      new Shape()
        .moveTo(52, -gap - h)
        .lineTo(62, -gap - h - 18)
        .lineTo(72, -gap - h)
        .close(),
      { fill: ACCENT, stroke: "rgba(255, 200, 140, 0.6)", lineWidth: 1 },
    ),
  );
  return root;
}

function wrapDiffractionIcon(): Node {
  const root = new Node();
  const y0 = -48;
  const y1 = 48;
  for (let i = -3; i <= 3; i++) {
    const x = i * 9;
    root.addChild(new Line(x, y0, x, y1, { stroke: GRATING, lineWidth: 3, lineCap: "round" }));
  }
  // Incoming beam
  root.addChild(new Line(-95, 0, -38, 0, { stroke: RAY, lineWidth: 3, lineCap: "round" }));
  // Diffracted orders (fan)
  const orders = [
    { a: -0.42, c: "#66eeff" },
    { a: -0.2, c: RAY_SOFT },
    { a: 0, c: RAY },
    { a: 0.22, c: "#eeff66" },
    { a: 0.45, c: "#ffaaee" },
  ];
  const L = 78;
  for (const { a, c } of orders) {
    root.addChild(
      new Line(38, 0, 38 + L * Math.cos(a), -L * Math.sin(a), {
        stroke: c,
        lineWidth: 2.4,
        lineCap: "round",
      }),
    );
  }
  return root;
}

export function createIntroScreenIcon(): ScreenIcon {
  return new ScreenIcon(wrapIntroIcon(), {
    fill: iconBackgroundFill(),
    maxIconWidthProportion: 0.9,
    maxIconHeightProportion: 0.9,
  });
}

export function createLabScreenIcon(): ScreenIcon {
  return new ScreenIcon(wrapLabIcon(), {
    fill: iconBackgroundFill(),
    maxIconWidthProportion: 0.9,
    maxIconHeightProportion: 0.9,
  });
}

export function createPresetsScreenIcon(): ScreenIcon {
  return new ScreenIcon(wrapPresetsIcon(), {
    fill: iconBackgroundFill(),
    maxIconWidthProportion: 0.88,
    maxIconHeightProportion: 0.88,
  });
}

export function createDiffractionScreenIcon(): ScreenIcon {
  return new ScreenIcon(wrapDiffractionIcon(), {
    fill: iconBackgroundFill(),
    maxIconWidthProportion: 0.9,
    maxIconHeightProportion: 0.9,
  });
}
