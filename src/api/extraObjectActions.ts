import { ExtraObjects, Thunk } from './index';
import { Dispatch } from 'redux';

/**
 * Handler for extra, non IdAware objects in XcapJsonResponses
 */
export interface ExtraObjectHandler<T> {
  /**
   * Key, for example "products"
   */
  key: string;

  /**
   * A context, or null for all
   */
  context: string | null;

  onExtraObjectsReceived: (objects: { [id: string]: any }, dispatch: Dispatch) => void;
}

const EXTRA_OBJECT_HANDLERS: { [key: string]: ExtraObjectHandler<any> } = {};

type HandlerObjects = {
  [handlerKey: string]: {
    [id: string]: any;
  };
};
/**
 * Apply all registered handlers for non IdAware objects
 * @param extraObjects
 */
export function applyExtraObjectHandlers(extraObjects: ExtraObjects): Thunk<void> {
  return (dispatch: any): void => {
    const handlerObjects: HandlerObjects = {};

    // Get the objects
    Object.keys(extraObjects).forEach(key => {
      const o = extraObjects[key as any];
      Object.keys(o).forEach(cc => {
        const handlerKey = getExistingHandlerKey(key, cc);
        if (handlerKey) {
          handlerObjects[handlerKey] = o[cc];
        }
      });
    });

    // Apply the handlers
    Object.keys(handlerObjects).forEach(handlerKey => {
      const handler = EXTRA_OBJECT_HANDLERS[handlerKey];
      if (handler) {
        const objects = handlerObjects[handlerKey];
        handler.onExtraObjectsReceived(objects, dispatch);
      }
    });
  };
}

/**
 * Add an extra object handler
 * @param handler
 */
export function registerExtraObjectHandler<T>(handler: ExtraObjectHandler<T>): void {
  const key = getKey(handler);
  EXTRA_OBJECT_HANDLERS[key] = handler;
}

/**
 * Remove an extra object handler
 * @param handler
 */
export function unregisterExtraObjectHandler(handler: ExtraObjectHandler<any>): void {
  const key = getKey(handler);
  delete EXTRA_OBJECT_HANDLERS[key];
}

export function getKey<T>(handler: ExtraObjectHandler<T>): string {
  return handler.key + ':' + (handler.context ? handler.context : '*');
}

export function getExistingHandlerKey(key: string, context: string): string | null {
  let k = key + ':' + context;
  if (EXTRA_OBJECT_HANDLERS[k]) {
    return k;
  }
  k = key + ':*';
  return EXTRA_OBJECT_HANDLERS[k] ? k : null;
}
