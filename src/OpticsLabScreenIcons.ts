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

  // Open book with center spine, plus a compact optics diagram.
  const leftPage = new Path(Shape.roundRect(-86, -56, 79, 112, 6, 6), {
    fill: "rgba(56, 62, 84, 0.9)",
    stroke: "rgba(130, 140, 170, 0.6)",
    lineWidth: 2,
  });
  const rightPage = new Path(Shape.roundRect(7, -56, 79, 112, 6, 6), {
    fill: "rgba(44, 50, 72, 0.95)",
    stroke: "rgba(130, 140, 170, 0.6)",
    lineWidth: 2,
  });
  root.addChild(leftPage);
  root.addChild(rightPage);
  root.addChild(
    new Line(0, -50, 0, 50, {
      stroke: "rgba(165, 175, 205, 0.7)",
      lineWidth: 2.5,
      lineCap: "round",
    }),
  );

  // Left-page "notes" lines to communicate intro/tutorial content.
  for (const y of [-24, -8, 8, 24]) {
    root.addChild(
      new Line(-72, y, -20, y, {
        stroke: "rgba(165, 180, 210, 0.55)",
        lineWidth: 2,
        lineCap: "round",
      }),
    );
  }

  // Right-page ray diagram.
  const lens = new Path(Shape.ellipse(42, 0, 10, 24, 0), {
    fill: LENS_FILL,
    stroke: LENS_STROKE,
    lineWidth: 2,
  });
  root.addChild(lens);
  root.addChild(new Line(10, -16, 31, -16, { stroke: RAY, lineWidth: 2.5, lineCap: "round" }));
  root.addChild(new Line(10, 0, 31, 0, { stroke: RAY, lineWidth: 2.5, lineCap: "round" }));
  root.addChild(new Line(10, 16, 31, 16, { stroke: RAY, lineWidth: 2.5, lineCap: "round" }));
  root.addChild(new Line(53, -12, 75, -26, { stroke: RAY_SOFT, lineWidth: 2.4, lineCap: "round" }));
  root.addChild(new Line(53, 0, 78, 0, { stroke: RAY, lineWidth: 2.4, lineCap: "round" }));
  root.addChild(new Line(53, 12, 75, 26, { stroke: RAY_SOFT, lineWidth: 2.4, lineCap: "round" }));

  return root;
}

function wrapLabIcon(): Node {
  const root = new Node();

  // Optical bench and supports.
  root.addChild(
    new Line(-98, 44, 98, 44, {
      stroke: "rgba(120, 132, 156, 0.85)",
      lineWidth: 6,
      lineCap: "round",
    }),
  );
  for (const x of [-72, -10, 52]) {
    root.addChild(
      new Line(x, 44, x, 24, {
        stroke: "rgba(100, 112, 136, 0.8)",
        lineWidth: 3,
        lineCap: "round",
      }),
    );
  }

  // Point source
  root.addChild(
    new Path(Shape.circle(-76, 12, 8), {
      fill: ACCENT,
      stroke: "rgba(255, 200, 120, 0.9)",
      lineWidth: 1.8,
    }),
  );
  root.addChild(
    new Path(Shape.circle(-76, 12, 14), {
      stroke: "rgba(255, 190, 110, 0.35)",
      lineWidth: 1.5,
    }),
  );

  // Biconvex lens mounted at center.
  root.addChild(
    new Path(new Shape().moveTo(-16, -30).quadraticCurveTo(0, 0, -16, 30).quadraticCurveTo(16, 0, 16, -30).close(), {
      fill: LENS_FILL,
      stroke: LENS_STROKE,
      lineWidth: 2.4,
    }),
  );
  root.addChild(
    new Line(0, 30, 0, 44, {
      stroke: "rgba(110, 130, 165, 0.9)",
      lineWidth: 2.2,
      lineCap: "round",
    }),
  );

  // Mirror on the right with slight tilt and stand.
  root.addChild(new Line(66, -26, 74, 26, { stroke: MIRROR, lineWidth: 5, lineCap: "round" }));
  root.addChild(
    new Line(70, 26, 70, 44, {
      stroke: "rgba(120, 130, 150, 0.85)",
      lineWidth: 2.2,
      lineCap: "round",
    }),
  );

  // Main ray path: source -> lens -> mirror -> reflection.
  root.addChild(new Line(-68, 12, -22, 12, { stroke: RAY, lineWidth: 2.8, lineCap: "round" }));
  root.addChild(new Line(-22, 12, 14, 4, { stroke: RAY, lineWidth: 2.6, lineCap: "round" }));
  root.addChild(new Line(14, 4, 64, -4, { stroke: RAY_SOFT, lineWidth: 2.4, lineCap: "round" }));
  root.addChild(new Line(64, -4, 22, -30, { stroke: RAY_SOFT, lineWidth: 2.4, lineCap: "round" }));

  // Secondary faint ray gives the icon more "lab" complexity without clutter.
  root.addChild(new Line(-68, 20, -22, 18, { stroke: "rgba(120, 220, 150, 0.85)", lineWidth: 2, lineCap: "round" }));
  root.addChild(new Line(-22, 18, 13, 14, { stroke: "rgba(120, 220, 150, 0.85)", lineWidth: 1.9, lineCap: "round" }));
  root.addChild(new Line(13, 14, 62, 12, { stroke: "rgba(120, 220, 150, 0.8)", lineWidth: 1.8, lineCap: "round" }));

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
