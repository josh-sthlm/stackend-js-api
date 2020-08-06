// @flow
import update from 'immutability-helper';
import createReducer from './createReducer';

export type referenceActions = Recieve;
export type referenceActionTypes = 'RECIEVE_REFERENCES';
export const RECIEVE_REFERENCES = 'RECIEVE_REFERENCES';

export interface Recieve {
	type: 'RECIEVE_REFERENCES',
	entries: { [key: number]: any }
}

interface State {
	[key: number]: any
}
const initialState:State = {};

export default createReducer(initialState, {
	RECIEVE_REFERENCES: (state: State, action: Recieve) => update(state, { $merge: action.entries })
});
