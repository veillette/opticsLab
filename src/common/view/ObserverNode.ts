/**
 * ObserverNode.ts
 *
 * Draggable Scenery Node representing the observer in "observer" mode.
 *
 * Visual components:
 *   – Dashed yellow circle indicating the collection radius
 *   – Small filled dot at the observer position (drag to reposition)
 *   – Small handle on the rim of the radius circle (drag to resize radius)
 *
 * Dragging the center dot translates the observer position in model space.
 * Dragging the rim handle adjusts the collection radius.
 */

import type { Property } from "scenerystack/axon";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node, RichDragListener, Text } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import opticsLab from "../../OpticsLabNamespace.js";
import type { Observer } from "../model/optics/OpticsTypes.js";

export const DEFAULT_OBSERVER: Observer = {
  position: { x: 0.3, y: 0 },
  radius: 0.12,
};

const CENTER_DOT_RADIUS = 7; // px
const RIM_HANDLE_RADIUS = 5; // px

export class ObserverNode extends Node {
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly observerProperty: Property<Observer | null>;
  private readonly radiusCircle: Circle;
  private readonly rimHandle: Circle;

  public constructor(observerProperty: Property<Observer | null>, modelViewTransform: ModelViewTransform2) {
    super();
    this.modelViewTransform = modelViewTransform;
    this.observerProperty = observerProperty;

    // ── Visual components (local coords, rebuilt each frame) ─────────────────

    this.radiusCircle = new Circle(0, {
      stroke: "rgba(255, 220, 80, 0.65)",
      lineWidth: 1.5,
      lineDash: [5, 3],
      fill: "rgba(255, 220, 80, 0.06)",
      pickable: false,
    });

    const centerDot = new Circle(CENTER_DOT_RADIUS, {
      fill: "rgba(255, 220, 80, 0.9)",
      stroke: "rgba(160, 120, 0, 1.0)",
      lineWidth: 1.5,
      cursor: "move",
    });
    centerDot.tagName = "div";
    centerDot.focusable = true;
    centerDot.accessibleHelpText = "Press arrow keys to move the observer";

    const labelNode = new Text("observer", {
      font: "11px sans-serif",
      fill: "rgba(255, 220, 80, 0.85)",
      centerX: 0,
      bottom: -(CENTER_DOT_RADIUS + 3),
    });

    this.rimHandle = new Circle(RIM_HANDLE_RADIUS, {
      fill: "rgba(255, 220, 80, 0.55)",
      stroke: "rgba(160, 120, 0, 0.9)",
      lineWidth: 1,
      cursor: "ew-resize",
    });

    this.addChild(this.radiusCircle);
    this.addChild(centerDot);
    this.addChild(labelNode);
    this.addChild(this.rimHandle);

    // ── Center-dot drag — translates observer position ────────────────────────
    // Use start + accumulated delta pattern (like attachTranslationDrag) so that
    // rebuild() repositioning the parent node doesn't shift the coordinate frame
    // under the pointer mid-drag.
    let startPos = { x: 0, y: 0 };
    let accX = 0;
    let accY = 0;
    centerDot.addInputListener(
      new RichDragListener({
        tandem: Tandem.OPTIONAL,
        transform: modelViewTransform,
        start: () => {
          const current = observerProperty.value ?? DEFAULT_OBSERVER;
          startPos = { x: current.position.x, y: current.position.y };
          accX = 0;
          accY = 0;
        },
        drag: (_event, listener) => {
          accX += listener.modelDelta.x;
          accY += listener.modelDelta.y;
          const current = observerProperty.value ?? DEFAULT_OBSERVER;
          observerProperty.value = {
            position: { x: startPos.x + accX, y: startPos.y + accY },
            radius: current.radius,
          };
        },
      }),
    );

    // ── Rim-handle drag — resizes collection radius ───────────────────────────
    let startRadius = 0;
    let accR = 0;
    this.rimHandle.addInputListener(
      new RichDragListener({
        tandem: Tandem.OPTIONAL,
        transform: modelViewTransform,
        start: () => {
          startRadius = (observerProperty.value ?? DEFAULT_OBSERVER).radius;
          accR = 0;
        },
        drag: (_event, listener) => {
          accR += listener.modelDelta.x;
          const current = observerProperty.value ?? DEFAULT_OBSERVER;
          observerProperty.value = {
            position: current.position,
            radius: Math.max(0.02, startRadius + accR),
          };
        },
      }),
    );

    this.rebuild();
    observerProperty.link(() => this.rebuild());
  }

  private rebuild(): void {
    const obs = this.observerProperty.value ?? DEFAULT_OBSERVER;
    const mvt = this.modelViewTransform;

    this.x = mvt.modelToViewX(obs.position.x);
    this.y = mvt.modelToViewY(obs.position.y);

    const radiusPx = Math.abs(mvt.modelToViewDeltaX(obs.radius));
    this.radiusCircle.radius = radiusPx;
    this.rimHandle.x = radiusPx;
    this.rimHandle.y = 0;
  }
}

opticsLab.register("ObserverNode", ObserverNode);
