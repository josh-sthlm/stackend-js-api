import * as reducer from './referenceReducer';
import XcapObject from './XcapObject';
import { Thunk } from './index';
import { Dispatch } from 'redux';

export interface ReferenceHandler<T extends XcapObject> {
  type: string;
  onReferenceReceived: (objects: Array<T>, dispatch: Dispatch) => void;
}

const REFERENCE_HANDLERS: { [objectType: string]: ReferenceHandler<XcapObject> } = {};

export interface ReceiveReferences {
  entries: { [key: number]: any };
}

export function receiveReferences({ entries }: ReceiveReferences): reducer.ReceiveAction {
  return {
    type: reducer.RECEIVE_REFERENCES,
    entries
  };
}

type HandlerObjects = {
  [type: string]: Array<XcapObject>;
};

/**
 * Apply all registered reference handlers
 * @param entries
 */
export function applyReferenceHandlers({ entries }: ReceiveReferences): Thunk<void> {
  return (dispatch: any): void => {
    const handlerObjects: HandlerObjects = {};

    // Get the objects
    Object.keys(entries).forEach(key => {
      const object = entries[key as any];
      if (object && object.___type) {
        const handler = REFERENCE_HANDLERS[object.___type];
        if (handler) {
          let objects = handlerObjects[handler.type];
          if (!objects) {
            objects = handlerObjects[handler.type] = [];
          }
          objects.push(object);
        }
      }
    });

    // Apply the handler
    Object.keys(handlerObjects).forEach(type => {
      const handler = REFERENCE_HANDLERS[type];
      if (handler) {
        const objects = handlerObjects[type];
        handler.onReferenceReceived(objects, dispatch);
      }
    });
  };
}

/**
 * Add a reference handler
 * @param referenceHandler
 */
export function registerReferenceHandler<T extends XcapObject>(referenceHandler: ReferenceHandler<T>): void {
  REFERENCE_HANDLERS[referenceHandler.type] = referenceHandler as ReferenceHandler<XcapObject>;
}

/**
 * Remove a reference handler
 * @param referenceHandler
 */
export function unregisterReferenceHandler<T extends XcapObject>(referenceHandler: ReferenceHandler<T>): void {
  delete REFERENCE_HANDLERS[referenceHandler.type];
}
