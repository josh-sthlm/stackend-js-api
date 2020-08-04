// @flow
import _ from 'lodash/object';
import { listForums, type Forum } from './forum.js';
import type { Thunk, Dispatch } from '../store.js';
import * as reducer from './forumReducer.js';

//Requests and recieve comments and store them in redux-state
export function fetchForums(): Thunk<*> {
	return async (dispatch: Dispatch /*, getState: GetState*/) => {
		dispatch(requestForums());
		const json = await dispatch(listForums({}));
		dispatch(recieveForums({ entries: _.get(json, 'forumsPaginated.entries', []) }));
	};
}

export function requestForums(): reducer.Request {
	return { type: reducer.actionTypes.REQUEST_FORUMS };
}

type RecieveForums = {
	entries: Array<Forum>
};
export function recieveForums({ entries }: RecieveForums): reducer.Recieve {
	return {
		type: reducer.actionTypes.RECIEVE_FORUMS,
		entries
	};
}
