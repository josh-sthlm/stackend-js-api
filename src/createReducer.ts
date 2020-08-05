//@flow

import { Action } from 'redux';

type Reducer<S: any, A: Action> = (S, A) => S;

export default function createReducer<S, A: *>(
	initialState: S,
	handlers: { [key: Action]: Reducer<S, A> }
): Reducer<S, A> {
	return function reducer(state: S = initialState, action: A): S {
		return handlers.hasOwnProperty(action.type) ? handlers[action.type](state, action) : state;
	};
}
