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
const PRESET_ROW = "rgba(160, 175, 200, 0.55)";
const PRESET_ROW_STROKE = "rgba(200, 210, 230, 0.5)";

function iconBackgroundFill(): Color | string {
  return OpticsLabColors.backgroundColorProperty.value;
}

// ── Intro: prism dispersing white light into a spectrum ────────────────────────
function wrapIntroIcon(): Node {
  const root = new Node();

  // Glass prism (equilateral triangle, apex upper-left)
  root.addChild(
    new Path(new Shape().moveTo(-12, -46).lineTo(-52, 36).lineTo(28, 36).close(), {
      fill: "rgba(120, 165, 215, 0.22)",
      stroke: "rgba(165, 205, 248, 0.9)",
      lineWidth: 3.5,
    }),
  );

  // Incoming white ray from the left, hitting left prism face
  root.addChild(
    new Line(-92, -10, -34, 8, {
      stroke: "rgba(255, 255, 230, 0.95)",
      lineWidth: 5,
      lineCap: "round",
    }),
  );

  // Dispersed spectrum exiting the right face
  const xE = 16;
  const yE = 4;
  const spectrum: [number, string][] = [
    [-46, "#9977ff"],
    [-24, "#44aaff"],
    [-2, "#55ee77"],
    [20, "#ffee44"],
    [42, "#ff7744"],
  ];
  for (const [yEnd, color] of spectrum) {
    root.addChild(
      new Line(xE, yE, 92, yEnd, {
        stroke: color,
        lineWidth: 3.5,
        lineCap: "round",
      }),
    );
  }

  return root;
}

// ── Lab: optical bench with point source, biconvex lens, detector screen ──────
function wrapLabIcon(): Node {
  const root = new Node();

  // Bench rail
  root.addChild(
    new Line(-96, 44, 96, 44, {
      stroke: "rgba(135, 150, 182, 0.9)",
      lineWidth: 7,
      lineCap: "round",
    }),
  );
  // Tick marks
  for (const x of [-72, -48, -24, 0, 24, 48, 72]) {
    root.addChild(
      new Line(x, 40, x, 48, {
        stroke: "rgba(85, 98, 128, 0.85)",
        lineWidth: 1.5,
      }),
    );
  }

  // Point source with three glow rings
  root.addChild(
    new Path(Shape.circle(-78, 14, 10), {
      fill: ACCENT,
      stroke: "rgba(255, 195, 85, 0.9)",
      lineWidth: 2.5,
    }),
  );
  root.addChild(
    new Path(Shape.circle(-78, 14, 19), {
      fill: null,
      stroke: "rgba(255, 190, 80, 0.38)",
      lineWidth: 2,
    }),
  );
  root.addChild(
    new Path(Shape.circle(-78, 14, 29), {
      fill: null,
      stroke: "rgba(255, 185, 75, 0.16)",
      lineWidth: 1.5,
    }),
  );
  // Source stand
  root.addChild(
    new Line(-78, 24, -78, 44, {
      stroke: "rgba(108, 124, 158, 0.85)",
      lineWidth: 3,
      lineCap: "round",
    }),
  );

  // Biconvex lens centered at x = 0
  root.addChild(
    new Path(new Shape().moveTo(0, -38).quadraticCurveTo(22, 4, 0, 44).quadraticCurveTo(-22, 4, 0, -38).close(), {
      fill: LENS_FILL,
      stroke: LENS_STROKE,
      lineWidth: 3,
    }),
  );

  // Flat detector screen on the right
  root.addChild(
    new Path(Shape.roundRect(64, -24, 9, 68, 3, 3), {
      fill: "rgba(75, 90, 122, 0.4)",
      stroke: "rgba(152, 168, 205, 0.9)",
      lineWidth: 2.5,
    }),
  );
  // Bright focal spot on screen
  root.addChild(
    new Path(Shape.circle(64, 12, 7), {
      fill: RAY,
      stroke: "rgba(85, 238, 119, 0.5)",
      lineWidth: 2.5,
    }),
  );

  // Three rays: source → lens → detector (all converging to focal spot)
  const rayRows: [number, number, string][] = [
    [4, 2, "rgba(85, 238, 119, 1.0)"],
    [14, 8, "rgba(85, 238, 119, 0.85)"],
    [24, 16, "rgba(85, 238, 119, 0.7)"],
  ];
  for (const [y0, yMid, color] of rayRows) {
    root.addChild(new Line(-68, y0, -11, y0, { stroke: color, lineWidth: 2.6, lineCap: "round" }));
    root.addChild(new Line(-11, y0, 11, yMid, { stroke: color, lineWidth: 2.6, lineCap: "round" }));
    root.addChild(
      new Line(11, yMid, 64, 12, {
        stroke: color.replace("1.0)", "0.75)").replace("0.85)", "0.62)").replace("0.7)", "0.5)"),
        lineWidth: 2.3,
        lineCap: "round",
      }),
    );
  }

  return root;
}

// ── Presets: three cards, each showing a distinct optical setup ────────────────
function wrapPresetsIcon(): Node {
  const root = new Node();

  // Card backgrounds (y centers: -36, 0, +36)
  const [y0card, y1card, y2card] = [-36, 0, 36];
  for (const y of [y0card, y1card, y2card]) {
    root.addChild(
      new Path(Shape.roundRect(-80, y - 16, 160, 28, 8, 8), {
        fill: PRESET_ROW,
        stroke: PRESET_ROW_STROKE,
        lineWidth: 1.5,
      }),
    );
  }

  // ── Card 1 (y=-36): refracting telescope — two lenses, parallel-in parallel-out ──
  {
    const y = y0card;
    // Objective lens (left, larger)
    root.addChild(
      new Path(
        new Shape()
          .moveTo(-58, y - 13)
          .quadraticCurveTo(-49, y, -58, y + 13)
          .quadraticCurveTo(-67, y, -58, y - 13)
          .close(),
        { fill: LENS_FILL, stroke: LENS_STROKE, lineWidth: 1.8 },
      ),
    );
    // Eyepiece lens (right, smaller)
    root.addChild(
      new Path(
        new Shape()
          .moveTo(-12, y - 9)
          .quadraticCurveTo(-6, y, -12, y + 9)
          .quadraticCurveTo(-18, y, -12, y - 9)
          .close(),
        { fill: LENS_FILL, stroke: LENS_STROKE, lineWidth: 1.8 },
      ),
    );
    // Parallel input rays (3)
    for (const dy of [-7, 0, 7]) {
      root.addChild(
        new Line(-80, y + dy, -67, y + dy, { stroke: dy === 0 ? RAY : RAY_SOFT, lineWidth: 1.8, lineCap: "round" }),
      );
    }
    // Converging between lenses
    root.addChild(new Line(-49, y - 7, -18, y - 2, { stroke: RAY_SOFT, lineWidth: 1.6, lineCap: "round" }));
    root.addChild(new Line(-49, y, -18, y, { stroke: RAY, lineWidth: 1.8, lineCap: "round" }));
    root.addChild(new Line(-49, y + 7, -18, y + 2, { stroke: RAY_SOFT, lineWidth: 1.6, lineCap: "round" }));
    // Parallel output rays after eyepiece
    for (const dy of [-5, 0, 5]) {
      root.addChild(
        new Line(-6, y + dy, 72, y + dy, { stroke: dy === 0 ? RAY : RAY_SOFT, lineWidth: 1.6, lineCap: "round" }),
      );
    }
  }

  // ── Card 2 (y=0): reflecting telescope — parallel rays + parabolic mirror ──
  {
    const y = y1card;
    // Parabolic mirror (concave, on right)
    root.addChild(
      new Path(new Shape().moveTo(46, y - 14).quadraticCurveTo(62, y, 46, y + 14), {
        stroke: MIRROR,
        lineWidth: 5,
        lineCap: "round",
        fill: null,
      }),
    );
    // Parallel incident rays
    root.addChild(new Line(-80, y - 7, 40, y - 7, { stroke: RAY_SOFT, lineWidth: 1.8, lineCap: "round" }));
    root.addChild(new Line(-80, y, 40, y, { stroke: RAY, lineWidth: 2, lineCap: "round" }));
    root.addChild(new Line(-80, y + 7, 40, y + 7, { stroke: RAY_SOFT, lineWidth: 1.8, lineCap: "round" }));
    // Reflected rays converging to focal point
    root.addChild(new Line(40, y - 7, 24, y, { stroke: RAY_SOFT, lineWidth: 1.8, lineCap: "round" }));
    root.addChild(new Line(40, y, 24, y, { stroke: RAY, lineWidth: 2, lineCap: "round" }));
    root.addChild(new Line(40, y + 7, 24, y, { stroke: RAY_SOFT, lineWidth: 1.8, lineCap: "round" }));
    // Focal point
    root.addChild(
      new Path(Shape.circle(24, y, 5), {
        fill: ACCENT,
        stroke: "rgba(255, 195, 85, 0.6)",
        lineWidth: 2,
      }),
    );
  }

  // ── Card 3 (y=+36): spectroscope — prism dispersing to spectrum ──
  {
    const y = y2card;
    // Mini prism
    root.addChild(
      new Path(
        new Shape()
          .moveTo(-54, y + 12)
          .lineTo(-38, y - 12)
          .lineTo(-22, y + 12)
          .close(),
        {
          fill: "rgba(120, 160, 210, 0.18)",
          stroke: "rgba(155, 195, 238, 0.75)",
          lineWidth: 1.8,
        },
      ),
    );
    // Incoming white ray
    root.addChild(
      new Line(-80, y, -54, y + 6, {
        stroke: "rgba(255, 255, 220, 0.9)",
        lineWidth: 2.5,
        lineCap: "round",
      }),
    );
    // Spectrum fan
    const mini: [number, string][] = [
      [-12, "#9977ff"],
      [-4, "#44aaff"],
      [4, "#55ee77"],
      [12, "#ffee44"],
      [20, "#ff7744"],
    ];
    for (const [yEnd, color] of mini) {
      root.addChild(
        new Line(-22, y + 8, 72, y + yEnd, {
          stroke: color,
          lineWidth: 2,
          lineCap: "round",
        }),
      );
    }
  }

  return root;
}

// ── Diffraction: grating with incoming beam and fanned orders ─────────────────
function wrapDiffractionIcon(): Node {
  const root = new Node();
  const y0 = -48;
  const y1 = 48;
  for (let i = -3; i <= 3; i++) {
    const x = i * 9;
    root.addChild(
      new Line(x, y0, x, y1, {
        stroke: "rgba(200, 210, 230, 0.85)",
        lineWidth: 3,
        lineCap: "round",
      }),
    );
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
