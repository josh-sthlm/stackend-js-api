// @flow
import _ from 'lodash';
import { listForums, Forum } from '../forum';
import { Thunk } from '../api';
import * as reducer from './forumReducer';

//Requests and receive comments and store them in redux-state
export function fetchForums(): Thunk<void> {
	return async (dispatch: any /*, getState: GetState*/) => {
		dispatch(requestForums());
		const json = await dispatch(listForums({}));
		dispatch(recieveForums({ entries: _.get(json, 'forumsPaginated.entries', []) }));
	};
}

export function requestForums(): reducer.Request {
	// @ts-ignore
  return { type: reducer.actionTypes.REQUEST_FORUMS };
}

export function recieveForums({ entries }: { entries: Array<Forum> }): reducer.Recieve {
	// @ts-ignore
  return {
		type: reducer.actionTypes.RECIEVE_FORUMS,
		entries
	};
}
