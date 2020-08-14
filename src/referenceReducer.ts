// @flow
import update from 'immutability-helper';
import createReducer from './createReducer';

export const RECIEVE_REFERENCES = 'RECIEVE_REFERENCES';

export interface Recieve {
  type: 'RECIEVE_REFERENCES';
  entries: { [key: number]: any };
}

interface ReferenceState {
  [key: number]: any;
}
const initialState: ReferenceState = {};

export default createReducer(initialState, {
  RECIEVE_REFERENCES: (state: ReferenceState, action: Recieve) => update(state, { $merge: action.entries }),
});
