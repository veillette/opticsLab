/**
 * ImageOverlayNode.ts
 *
 * Renders DetectedImage markers (real / virtual image positions) produced
 * by the ray tracer in "images" mode as Scenery Node children.
 *
 *   Real images    – solid yellow-orange filled circle,  label "R"
 *   Virtual images – dashed cyan hollow circle,          label "V"
 *   Virtual object – dashed red hollow circle,           label "VO"
 *
 * Call setImages() every frame when in "images" mode; call setImages([])
 * to clear when switching away from that mode.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node, Text } from "scenerystack/scenery";
import { FONT_BOLD_9PX } from "../../OpticsLabConstants.js";
import opticsLab from "../../OpticsLabNamespace.js";
import type { DetectedImage } from "../model/optics/OpticsTypes.js";

const MARKER_RADIUS = 6; // px
const LABEL_OFFSET_X = MARKER_RADIUS + 3;
const LABEL_FONT = FONT_BOLD_9PX;

export class ImageOverlayNode extends Node {
  private readonly modelViewTransform: ModelViewTransform2;
  private lastImages: readonly DetectedImage[] | null = null;

  public constructor(modelViewTransform: ModelViewTransform2) {
    super({ pickable: false });
    this.modelViewTransform = modelViewTransform;
  }

  public setImages(images: readonly DetectedImage[]): void {
    // Skip rebuild when the same array reference is passed (cached TraceResult).
    if (images === this.lastImages) {
      return;
    }
    this.lastImages = images;

    // Dispose old marker/label nodes so their internal Properties, Bounds2
    // caches, and Tandem entries are released — removeAllChildren() alone
    // only detaches them from the scene graph.
    for (const child of [...this.children]) {
      child.dispose();
    }
    const mvt = this.modelViewTransform;

    for (const img of images) {
      const vx = mvt.modelToViewX(img.position.x);
      const vy = mvt.modelToViewY(img.position.y);
      const alpha = Math.min(1, Math.max(0.35, img.brightness));

      let marker: Circle;
      let labelText: string;
      let labelFill: string;

      if (img.imageType === "real") {
        marker = new Circle(MARKER_RADIUS, {
          fill: `rgba(255, 200, 0, ${(alpha * 0.85).toFixed(3)})`,
          stroke: `rgba(200, 150, 0, ${alpha.toFixed(3)})`,
          lineWidth: 1.5,
          x: vx,
          y: vy,
        });
        labelText = "R";
        labelFill = "rgba(255, 220, 80, 0.95)";
      } else if (img.imageType === "virtualObject") {
        marker = new Circle(MARKER_RADIUS, {
          fill: null,
          stroke: `rgba(255, 80, 80, ${alpha.toFixed(3)})`,
          lineWidth: 1.5,
          lineDash: [3, 2],
          x: vx,
          y: vy,
        });
        labelText = "VO";
        labelFill = "rgba(255, 100, 100, 0.95)";
      } else {
        marker = new Circle(MARKER_RADIUS, {
          fill: null,
          stroke: `rgba(0, 210, 255, ${alpha.toFixed(3)})`,
          lineWidth: 1.5,
          lineDash: [3, 2],
          x: vx,
          y: vy,
        });
        labelText = "V";
        labelFill = "rgba(80, 210, 255, 0.95)";
      }

      const label = new Text(labelText, {
        font: LABEL_FONT,
        fill: labelFill,
        x: vx + LABEL_OFFSET_X,
        y: vy + 3,
      });

      this.addChild(marker);
      this.addChild(label);
    }
  }
}

opticsLab.register("ImageOverlayNode", ImageOverlayNode);
