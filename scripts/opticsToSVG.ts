/**
 * opticsToSVG.ts
 *
 * Generates an SVG of a convex lens with light rays for use as an icon.
 *
 * The lens is drawn as an ellipse. Parallel rays enter from the left,
 * refract through the lens, and converge at the focal point on the right.
 */

import * as fs from "node:fs";

// ── Magic numbers ─────────────────────────────────────────────────
const SVG_WIDTH = 60;
const SVG_HEIGHT = 60;

const LENS_CX = 30;
const LENS_CY = 30;
const LENS_RX = 8; // horizontal radius (thickness)
const LENS_RY = 22; // vertical radius (height)

const RAY_COLOR = "#3b82f6";
const RAY_STROKE_WIDTH = 1.2;
const RAY_OPACITY = 0.9;

const LENS_STROKE = "#1e3a5f";
const LENS_STROKE_WIDTH = 1;
const LENS_FILL = "none";

// Focal length (optical center to focus)
const FOCAL_LENGTH = 18;
const FOCUS_X = LENS_CX + FOCAL_LENGTH;

// Ray entry points (y positions, evenly spaced)
const RAY_YS = [12, 20, 28, 36, 44];
// ─────────────────────────────────────────────────────────────────

/**
 * Refraction at a thin lens: parallel rays converge at focal point.
 * Ray enters horizontally at y=entryY, exits lens at right edge, then goes to focus.
 */
function getRayPoints(entryY: number): { exitX: number; exitY: number; focusX: number; focusY: number } {
  const exitX = LENS_CX + LENS_RX;
  const exitY = entryY; // horizontal entry, exit at same y (thin lens approx)
  return { exitX, exitY, focusX: FOCUS_X, focusY: LENS_CY };
}

function buildSvg(): string {
  const rays: string[] = [];

  for (const entryY of RAY_YS) {
    const { exitX, exitY, focusX, focusY } = getRayPoints(entryY);
    // Incoming ray: left edge to lens
    rays.push(
      `  <line x1="0" y1="${entryY}" x2="${LENS_CX - LENS_RX}" y2="${entryY}" ` +
        `stroke="${RAY_COLOR}" stroke-width="${RAY_STROKE_WIDTH}" opacity="${RAY_OPACITY}"/>`,
    );
    // Refracted ray: lens to focus
    rays.push(
      `  <line x1="${exitX}" y1="${exitY}" x2="${focusX}" y2="${focusY}" ` +
        `stroke="${RAY_COLOR}" stroke-width="${RAY_STROKE_WIDTH}" opacity="${RAY_OPACITY}"/>`,
    );
  }

  // Lens as ellipse
  const lens =
    `  <ellipse cx="${LENS_CX}" cy="${LENS_CY}" rx="${LENS_RX}" ry="${LENS_RY}" ` +
    `fill="${LENS_FILL}" stroke="${LENS_STROKE}" stroke-width="${LENS_STROKE_WIDTH}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
  <!-- Lens -->
${lens}
  <!-- Light rays -->
${rays.join("\n")}
</svg>`;
}

const svg: string = buildSvg();

const outputPath = "public/icons/icon.svg";
fs.mkdirSync("public/icons", { recursive: true });
fs.writeFileSync(outputPath, svg, "utf8");
