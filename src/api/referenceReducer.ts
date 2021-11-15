import update from 'immutability-helper';
import createReducer from './createReducer';

export const RECEIVE_REFERENCES = 'RECEIVE_REFERENCES';

export interface ReceiveAction {
  type: typeof RECEIVE_REFERENCES;
  entries: { [key: number]: any };
}

interface ReferenceState {
  [key: number]: any;
}
const initialState: ReferenceState = {};

export default createReducer(initialState, {
  RECEIVE_REFERENCES: (state: ReferenceState, action: ReceiveAction) => update(state, { $merge: action.entries })
});
