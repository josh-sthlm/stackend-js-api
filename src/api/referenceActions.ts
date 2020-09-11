// @flow
import * as reducer from './referenceReducer';

interface ReceiveReferences {
  entries: { [key: number]: any };
}

export function receiveReferences({ entries }: ReceiveReferences): reducer.ReceiveAction {
  return {
    type: reducer.RECEIVE_REFERENCES,
    entries
  };
}
