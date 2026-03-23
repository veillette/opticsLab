/**
 * PhET-iO instrumented wrapper for one {@link OpticalElement} in a {@link PhetioGroup}.
 */

import type { Tandem } from "scenerystack/tandem";
import { IOType, ObjectLiteralIO, PhetioObject } from "scenerystack/tandem";
import opticsLab from "../../../OpticsLabNamespace.js";
import { deserializeElement, LIVE_ELEMENT_STATE_KEY } from "./elementSerialization.js";
import type { OpticalElement } from "./OpticsTypes.js";

type ElementStateRecord = Record<string, unknown>;

export default class OpticalElementPhetioObject extends PhetioObject {
  public opticalElement: OpticalElement;

  public constructor(tandem: Tandem, stateOrLive: ElementStateRecord) {
    const live = stateOrLive[LIVE_ELEMENT_STATE_KEY] as OpticalElement | undefined;
    const opticalElement =
      live ??
      (() => {
        const el = deserializeElement(stateOrLive);
        if (!el) {
          throw new Error("OpticalElementPhetioObject: deserializeElement returned null");
        }
        return el;
      })();

    super({
      tandem,
      phetioType: OpticalElementPhetioObject.opticalElementInstanceIO,
      phetioDynamicElement: true,
      phetioDocumentation: "One draggable optical element (source, lens, mirror, etc.) in the play area.",
    });

    this.opticalElement = opticalElement;
  }

  public override dispose(): void {
    this.opticalElement.dispose();
    super.dispose();
  }

  public static readonly opticalElementInstanceIO = new IOType<OpticalElementPhetioObject, ElementStateRecord>(
    "OpticalElementInstanceIO",
    {
      supertype: ObjectLiteralIO,
      documentation: "Serialized optical element (type-specific fields plus stable id).",
      metadataDefaults: { phetioDynamicElement: true },
      toStateObject: (obj) => ({ ...obj.opticalElement.serialize(), id: obj.opticalElement.id }),
      stateObjectToCreateElementArguments: (state: ElementStateRecord) => [state],
      applyState: (obj, state) => {
        obj.opticalElement.dispose();
        const el = deserializeElement(state);
        if (!el) {
          throw new Error("OpticalElementPhetioObject.applyState: invalid element state");
        }
        obj.opticalElement = el;
      },
    },
  );
}

opticsLab.register("OpticalElementPhetioObject", OpticalElementPhetioObject);
