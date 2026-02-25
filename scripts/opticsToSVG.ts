/**
 * opticsToSVG.ts
 *
 * Generates an SVG of a convex lens with light rays for use as an icon.
 *
 * Uses geometric optics: rays intersect the curved lens surface, refract
 * through the lens, and converge at the focal point. Includes principal ray
 * (through optical center), optical axis, and a glass-like lens appearance.
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

// Focal length (optical center to focus)
const FOCAL_LENGTH = 18;
const FOCUS_X = LENS_CX + FOCAL_LENGTH;

// Ray entry y-positions (must be within lens aperture |y-cy| < ry)
const RAY_YS = [14, 22, 30, 38, 46]; // includes principal ray at 30
// ─────────────────────────────────────────────────────────────────

/** Round to 2 decimals for clean SVG output. */
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Intersection of horizontal ray at y with ellipse (x-cx)²/rx² + (y-cy)²/ry² = 1.
 * Returns left and right x-coordinates where the ray enters/exits the lens.
 */
function ellipseIntersectionX(y: number): { left: number; right: number } {
  const dy = y - LENS_CY;
  const radicand = 1 - (dy * dy) / (LENS_RY * LENS_RY);
  const halfWidth = radicand > 0 ? LENS_RX * Math.sqrt(radicand) : 0;
  return {
    left: r(LENS_CX - halfWidth),
    right: r(LENS_CX + halfWidth),
  };
}

/**
 * Ray geometry: entry point on left lens surface, exit on right surface,
 * converging to focal point. Principal ray (through center) exits at same y.
 */
function getRayPoints(entryY: number): {
  entryX: number;
  exitX: number;
  exitY: number;
  focusX: number;
  focusY: number;
  isPrincipal: boolean;
} {
  const { left: entryX, right: exitX } = ellipseIntersectionX(entryY);
  const isPrincipal = Math.abs(entryY - LENS_CY) < 1;
  // Principal ray: straight through. Others: converge to focal point.
  const focusY = isPrincipal ? entryY : LENS_CY;
  return {
    entryX,
    exitX,
    exitY: entryY, // thin lens: exit height ≈ entry height
    focusX: FOCUS_X,
    focusY,
    isPrincipal,
  };
}

function buildSvg(): string {
  const rays: string[] = [];

  for (const entryY of RAY_YS) {
    const { entryX, exitX, exitY, focusX, focusY, isPrincipal } = getRayPoints(entryY);
    const strokeWidth = isPrincipal ? RAY_STROKE_WIDTH * 1.2 : RAY_STROKE_WIDTH;
    const opacity = isPrincipal ? 1 : RAY_OPACITY;

    // Incoming ray: from left edge to lens surface (curved intersection)
    rays.push(
      `  <line x1="0" y1="${entryY}" x2="${entryX}" y2="${entryY}" ` +
        `stroke="${RAY_COLOR}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`,
    );
    // Refracted ray: from lens exit to focal point
    rays.push(
      `  <line x1="${exitX}" y1="${exitY}" x2="${focusX}" y2="${focusY}" ` +
        `stroke="${RAY_COLOR}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`,
    );
  }

  // Optical axis (subtle dashed line)
  const axisY = LENS_CY;
  const axis =
    `  <line x1="0" y1="${axisY}" x2="${SVG_WIDTH}" y2="${axisY}" ` +
    `stroke="${LENS_STROKE}" stroke-width="0.5" opacity="0.4" stroke-dasharray="2 2"/>`;

  // Focal point marker (small circle)
  const focusMarker =
    `  <circle cx="${FOCUS_X}" cy="${LENS_CY}" r="1.5" ` +
    `fill="none" stroke="${LENS_STROKE}" stroke-width="0.8" opacity="0.6"/>`;

  // Lens: ellipse with subtle glass gradient (light refraction effect)
  const lensGradient = `
  <defs>
    <linearGradient id="lensGlass" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4a6fa5;stop-opacity:0.08"/>
      <stop offset="50%" style="stop-color:#7eb3e8;stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:#4a6fa5;stop-opacity:0.08"/>
    </linearGradient>
  </defs>`;
  const lens =
    `  <ellipse cx="${LENS_CX}" cy="${LENS_CY}" rx="${LENS_RX}" ry="${LENS_RY}" ` +
    `fill="url(#lensGlass)" stroke="${LENS_STROKE}" stroke-width="${LENS_STROKE_WIDTH}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">${lensGradient}
  <!-- Optical axis -->
${axis}
  <!-- Focal point -->
${focusMarker}
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
