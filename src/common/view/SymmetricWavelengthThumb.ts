/**
 * SymmetricWavelengthThumb.ts
 *
 * A bowtie-shaped slider thumb for the wavelength control.
 *
 * Two inverted triangles meet at the origin (track centre):
 *   • upper triangle: base at the top,  apex pointing DOWN to (0, 0)
 *   • lower triangle: base at the bottom, apex pointing UP   to (0, 0)
 *
 * This minimises occlusion of the spectrum track — the shape is widest at
 * the extremes and narrows to a point exactly at the track centre line.
 * Origin at (0, 0) so the Slider's default setCenterY() centres the thumb
 * on the track with no additional offset.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../OpticsLabColors.js";
import {
  SLIDER_THUMB_HEIGHT,
  SLIDER_THUMB_WIDTH,
  WAVELENGTH_THUMB_HIT_AREA_DILATION,
  WAVELENGTH_THUMB_OUTLINE_WIDTH,
} from "../../OpticsLabConstants.js";

const W = SLIDER_THUMB_WIDTH; // full width  (e.g. 10 px)
const H = SLIDER_THUMB_HEIGHT; // full height (e.g. 20 px)

/**
 * Bowtie outline (two triangles, apices touching at origin):
 *
 *   (-W/2, -H/2) ──── (W/2, -H/2)   ← top base
 *               \    /
 *                \  /
 *                (0, 0)              ← track centre
 *                /  \
 *               /    \
 *   (-W/2,  H/2) ──── (W/2,  H/2)   ← bottom base
 */
function buildBowtiePath(): Shape {
  const hw = W / 2;
  const hh = H / 2;

  const shape = new Shape();

  // Upper triangle (inverted — base on top, apex down)
  shape.moveTo(-hw, -hh).lineTo(hw, -hh).lineTo(0, 0).close();

  // Lower triangle (inverted — base on bottom, apex up)
  shape.moveTo(-hw, hh).lineTo(hw, hh).lineTo(0, 0).close();

  return shape;
}

export class SymmetricWavelengthThumb extends Node {
  public constructor(wavelengthProperty: TReadOnlyProperty<number>) {
    super({ tandem: Tandem.OPT_OUT });

    const body = new Path(buildBowtiePath(), {
      stroke: OpticsLabColors.wavelengthThumbStrokeProperty,
      lineWidth: WAVELENGTH_THUMB_OUTLINE_WIDTH,
    });

    this.addChild(body);

    // Generous touch / mouse areas for easy grabbing.
    const expanded = body.bounds.dilatedXY(WAVELENGTH_THUMB_HIT_AREA_DILATION, WAVELENGTH_THUMB_HIT_AREA_DILATION);
    this.mouseArea = expanded;
    this.touchArea = expanded;

    // Reactively colour the body with the current wavelength.
    const listener = (wavelength: number): void => {
      body.fill = VisibleColor.wavelengthToColor(wavelength);
    };
    wavelengthProperty.link(listener);
    this.disposeEmitter.addListener(() => wavelengthProperty.unlink(listener));
  }
}
