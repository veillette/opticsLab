/**
 * Home screen and navigation bar icons for each OpticsLab screen.
 * Motifs use scenery nodes; ScreenIcon scales and centers them on the standard joist background.
 */

import type { Color } from "scenerystack";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import OpticsLabColors from "./OpticsLabColors.js";

// ── Shared icon palette ────────────────────────────────────────────────────────
const RAY = "#55ee77";
const RAY_SOFT = "#88dd99";
const LENS_STROKE = "rgba(140, 200, 255, 0.95)";
const LENS_FILL = "rgba(100, 180, 255, 0.35)";
const MIRROR = "rgba(210, 210, 220, 0.9)";
const ACCENT = "#ffaa55";
const PRESET_ROW = "rgba(160, 175, 200, 0.55)";
const PRESET_ROW_STROKE = "rgba(200, 210, 230, 0.5)";

// ── Intro icon ─────────────────────────────────────────────────────────────────
const INTRO_PRISM_FILL = "rgba(120, 165, 215, 0.22)";
const INTRO_PRISM_STROKE = "rgba(165, 205, 248, 0.9)";
const INTRO_PRISM_LINE_WIDTH = 3.5;
const INTRO_WHITE_RAY_STROKE = "rgba(255, 255, 230, 0.95)";
const INTRO_WHITE_RAY_LINE_WIDTH = 5;
const INTRO_SPECTRUM_EXIT_X = 16;
const INTRO_SPECTRUM_EXIT_Y = 4;
const INTRO_SPECTRUM_LINE_WIDTH = 3.5;
const INTRO_SPECTRUM: [number, string][] = [
  [-46, "#9977ff"],
  [-24, "#44aaff"],
  [-2, "#55ee77"],
  [20, "#ffee44"],
  [42, "#ff7744"],
];

// ── Lab icon ───────────────────────────────────────────────────────────────────
const LAB_BENCH_STROKE = "rgba(135, 150, 182, 0.9)";
const LAB_BENCH_LINE_WIDTH = 7;
const LAB_TICK_X_POSITIONS = [-72, -48, -24, 0, 24, 48, 72];
const LAB_TICK_STROKE = "rgba(85, 98, 128, 0.85)";
const LAB_TICK_LINE_WIDTH = 1.5;
const LAB_SOURCE_X = -78;
const LAB_SOURCE_Y = 14;
const LAB_SOURCE_GLOW_STROKE = "rgba(255, 195, 85, 0.9)";
const LAB_SOURCE_RING1_STROKE = "rgba(255, 190, 80, 0.38)";
const LAB_SOURCE_RING2_STROKE = "rgba(255, 185, 75, 0.16)";
const LAB_STAND_STROKE = "rgba(108, 124, 158, 0.85)";
const LAB_DETECTOR_X = 64;
const LAB_DETECTOR_FILL = "rgba(75, 90, 122, 0.4)";
const LAB_DETECTOR_STROKE = "rgba(152, 168, 205, 0.9)";
const LAB_FOCAL_SPOT_Y = 12;
const LAB_FOCAL_SPOT_STROKE = "rgba(85, 238, 119, 0.5)";
const LAB_RAY_ROWS: [number, number, string][] = [
  [4, 2, "rgba(85, 238, 119, 1.0)"],
  [14, 8, "rgba(85, 238, 119, 0.85)"],
  [24, 16, "rgba(85, 238, 119, 0.7)"],
];

// ── Presets icon ───────────────────────────────────────────────────────────────
const PRESET_CARD_Y_CENTERS = [-36, 0, 36] as const;
const PRESET_MINI_PRISM_FILL = "rgba(120, 160, 210, 0.18)";
const PRESET_MINI_PRISM_STROKE = "rgba(155, 195, 238, 0.75)";
const PRESET_WHITE_RAY_STROKE = "rgba(255, 255, 220, 0.9)";
const PRESET_FOCAL_GLOW_STROKE = "rgba(255, 195, 85, 0.6)";
const PRESET_SPECTRUM: [number, string][] = [
  [-12, "#9977ff"],
  [-4, "#44aaff"],
  [4, "#55ee77"],
  [12, "#ffee44"],
  [20, "#ff7744"],
];

// ── Diffraction icon ───────────────────────────────────────────────────────────
const DIFFRACTION_GRATING_Y0 = -48;
const DIFFRACTION_GRATING_Y1 = 48;
const DIFFRACTION_GRATING_SPACING = 9;
const DIFFRACTION_GRATING_STROKE = "rgba(200, 210, 230, 0.85)";
const DIFFRACTION_GRATING_LINE_WIDTH = 3;
const DIFFRACTION_FAN_LENGTH = 78;
const DIFFRACTION_ORDERS: { a: number; c: string }[] = [
  { a: -0.42, c: "#66eeff" },
  { a: -0.2, c: RAY_SOFT },
  { a: 0, c: RAY },
  { a: 0.22, c: "#eeff66" },
  { a: 0.45, c: "#ffaaee" },
];

function iconBackgroundFill(): Color | string {
  return OpticsLabColors.backgroundColorProperty.value;
}

// ── Intro: prism dispersing white light into a spectrum ────────────────────────
function wrapIntroIcon(): Node {
  const root = new Node();

  // Glass prism (equilateral triangle, apex upper-left)
  root.addChild(
    new Path(new Shape().moveTo(-12, -46).lineTo(-52, 36).lineTo(28, 36).close(), {
      fill: INTRO_PRISM_FILL,
      stroke: INTRO_PRISM_STROKE,
      lineWidth: INTRO_PRISM_LINE_WIDTH,
    }),
  );

  // Incoming white ray from the left, hitting left prism face
  root.addChild(
    new Line(-92, -10, -34, 8, {
      stroke: INTRO_WHITE_RAY_STROKE,
      lineWidth: INTRO_WHITE_RAY_LINE_WIDTH,
      lineCap: "round",
    }),
  );

  // Dispersed spectrum exiting the right face
  for (const [yEnd, color] of INTRO_SPECTRUM) {
    root.addChild(
      new Line(INTRO_SPECTRUM_EXIT_X, INTRO_SPECTRUM_EXIT_Y, 92, yEnd, {
        stroke: color,
        lineWidth: INTRO_SPECTRUM_LINE_WIDTH,
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
      stroke: LAB_BENCH_STROKE,
      lineWidth: LAB_BENCH_LINE_WIDTH,
      lineCap: "round",
    }),
  );
  // Tick marks
  for (const x of LAB_TICK_X_POSITIONS) {
    root.addChild(
      new Line(x, 40, x, 48, {
        stroke: LAB_TICK_STROKE,
        lineWidth: LAB_TICK_LINE_WIDTH,
      }),
    );
  }

  // Point source with three glow rings
  root.addChild(
    new Path(Shape.circle(LAB_SOURCE_X, LAB_SOURCE_Y, 10), {
      fill: ACCENT,
      stroke: LAB_SOURCE_GLOW_STROKE,
      lineWidth: 2.5,
    }),
  );
  root.addChild(
    new Path(Shape.circle(LAB_SOURCE_X, LAB_SOURCE_Y, 19), {
      fill: null,
      stroke: LAB_SOURCE_RING1_STROKE,
      lineWidth: 2,
    }),
  );
  root.addChild(
    new Path(Shape.circle(LAB_SOURCE_X, LAB_SOURCE_Y, 29), {
      fill: null,
      stroke: LAB_SOURCE_RING2_STROKE,
      lineWidth: 1.5,
    }),
  );
  // Source stand
  root.addChild(
    new Line(LAB_SOURCE_X, 24, LAB_SOURCE_X, 44, {
      stroke: LAB_STAND_STROKE,
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
    new Path(Shape.roundRect(LAB_DETECTOR_X, -24, 9, 68, 3, 3), {
      fill: LAB_DETECTOR_FILL,
      stroke: LAB_DETECTOR_STROKE,
      lineWidth: 2.5,
    }),
  );
  // Bright focal spot on screen
  root.addChild(
    new Path(Shape.circle(LAB_DETECTOR_X, LAB_FOCAL_SPOT_Y, 7), {
      fill: RAY,
      stroke: LAB_FOCAL_SPOT_STROKE,
      lineWidth: 2.5,
    }),
  );

  // Three rays: source → lens → detector (all converging to focal spot)
  for (const [y0, yMid, color] of LAB_RAY_ROWS) {
    root.addChild(new Line(-68, y0, -11, y0, { stroke: color, lineWidth: 2.6, lineCap: "round" }));
    root.addChild(new Line(-11, y0, 11, yMid, { stroke: color, lineWidth: 2.6, lineCap: "round" }));
    root.addChild(
      new Line(11, yMid, LAB_DETECTOR_X, LAB_FOCAL_SPOT_Y, {
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

  // Card backgrounds
  for (const y of PRESET_CARD_Y_CENTERS) {
    root.addChild(
      new Path(Shape.roundRect(-80, y - 16, 160, 28, 8, 8), {
        fill: PRESET_ROW,
        stroke: PRESET_ROW_STROKE,
        lineWidth: 1.5,
      }),
    );
  }

  const [y0card, y1card, y2card] = PRESET_CARD_Y_CENTERS;

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
        stroke: PRESET_FOCAL_GLOW_STROKE,
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
          fill: PRESET_MINI_PRISM_FILL,
          stroke: PRESET_MINI_PRISM_STROKE,
          lineWidth: 1.8,
        },
      ),
    );
    // Incoming white ray
    root.addChild(
      new Line(-80, y, -54, y + 6, {
        stroke: PRESET_WHITE_RAY_STROKE,
        lineWidth: 2.5,
        lineCap: "round",
      }),
    );
    // Spectrum fan
    for (const [yEnd, color] of PRESET_SPECTRUM) {
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
  for (let i = -3; i <= 3; i++) {
    const x = i * DIFFRACTION_GRATING_SPACING;
    root.addChild(
      new Line(x, DIFFRACTION_GRATING_Y0, x, DIFFRACTION_GRATING_Y1, {
        stroke: DIFFRACTION_GRATING_STROKE,
        lineWidth: DIFFRACTION_GRATING_LINE_WIDTH,
        lineCap: "round",
      }),
    );
  }
  // Incoming beam
  root.addChild(new Line(-95, 0, -38, 0, { stroke: RAY, lineWidth: 3, lineCap: "round" }));
  // Diffracted orders (fan)
  for (const { a, c } of DIFFRACTION_ORDERS) {
    root.addChild(
      new Line(38, 0, 38 + DIFFRACTION_FAN_LENGTH * Math.cos(a), -DIFFRACTION_FAN_LENGTH * Math.sin(a), {
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
