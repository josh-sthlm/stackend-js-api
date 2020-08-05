// @flow
import _ from 'lodash';
import { listForums } from './forum';
import type { Forum } from './forum';
import type { Thunk } from '../store';
import { Dispatch} from 'redux';
import * as reducer from './forumReducer';

//Requests and recieve comments and store them in redux-state
export function fetchForums(): Thunk<any> {
	return async (dispatch: Dispatch /*, getState: GetState*/) => {
		dispatch(requestForums());
		const json = await dispatch(listForums({}));
		dispatch(recieveForums({ entries: _.get(json, 'forumsPaginated.entries', []) }));
	};
}

export function requestForums(): reducer.Request {
	return { type: reducer.actionTypes.REQUEST_FORUMS };
}

interface RecieveForums {
	entries: Array<Forum>
};
export function recieveForums({ entries }: RecieveForums): reducer.Recieve {
	return {
		type: reducer.actionTypes.RECIEVE_FORUMS,
		entries
	};
}
