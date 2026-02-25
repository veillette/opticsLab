/**
 * OpticsLabColors.ts
 *
 * Central location for all colors used in the OpticsLab simulation, providing
 * support for different color profiles (default and projector mode).
 */

import { Color, ProfileColorProperty } from "scenerystack";
import opticsLab from "./OpticsLabNamespace.js";

// ── Base colors ───────────────────────────────────────────────────────────
const BLACK = new Color(0, 0, 0);
const WHITE = new Color(255, 255, 255);

// ── ProfileColorProperty factory ──────────────────────────────────────────
function profileColor(
  name: string,
  defaultColor: Color | string,
  projectorColor: Color | string,
): ProfileColorProperty {
  return new ProfileColorProperty(opticsLab, name, {
    default: defaultColor,
    projector: projectorColor,
  });
}

const OpticsLabColors = {
  // Background
  backgroundColorProperty: profileColor("backgroundColor", BLACK, WHITE),

  // Panels
  panelFillProperty: profileColor("panelFill", new Color(25, 25, 45, 0.95), new Color(245, 245, 250, 0.98)),
  panelStrokeProperty: profileColor("panelStroke", new Color(120, 120, 140), new Color(180, 180, 200)),

  // Preferences checkboxes
  checkboxPreferencesColorProperty: profileColor(
    "checkboxPreferencesColor",
    new Color(40, 40, 40),
    new Color(40, 40, 40),
  ),
  checkboxPreferencesColorBackgroundProperty: profileColor(
    "checkboxPreferencesColorBackground",
    new Color(200, 200, 220, 0.5),
    new Color(200, 200, 220, 0.5),
  ),

  // Preferences dialog
  preferencesTextProperty: profileColor("preferencesText", BLACK, BLACK),
  preferencesTextSecondaryProperty: profileColor(
    "preferencesTextSecondary",
    new Color(102, 102, 102),
    new Color(80, 80, 80),
  ),
};

opticsLab.register("OpticsLabColors", OpticsLabColors);

export default OpticsLabColors;
