// @flow
import update from 'immutability-helper';
import type { Action } from '../types/action.js';
import createReducer from '../types/createReducer.js';

export type referenceActions = Recieve;
export type referenceActionTypes = 'RECIEVE_REFERENCES';
export const RECIEVE_REFERENCES = 'RECIEVE_REFERENCES';

export type Recieve = {
	type: 'RECIEVE_REFERENCES',
	entries: { [key: number]: any }
};

type State = {
	[key: number]: any
};
const initialState = {};

export default createReducer(initialState, {
	RECIEVE_REFERENCES: (state: State, action: Action) => update(state, { $merge: action.entries })
});
