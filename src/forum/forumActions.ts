// @flow
import get from 'lodash/get';
import { Forum, listForums, ListForumsResult } from './index';
import { Thunk } from '../api';
import { ForumActions, RECEIVE_FORUMS, REQUEST_FORUMS } from './forumReducer';

//Requests and receive comments and store them in redux-state
export function fetchForums(): Thunk<Promise<ListForumsResult>> {
  return async (dispatch: any): Promise<ListForumsResult> => {
    dispatch(requestForums());
    const json = await dispatch(listForums({}));
    dispatch(receiveForums({ entries: get(json, 'forumsPaginated.entries', []) }));
    return json;
  };
}

export function requestForums(): ForumActions {
  return { type: REQUEST_FORUMS };
}

export function receiveForums({ entries }: { entries: Array<Forum> }): ForumActions {
  return {
    type: RECEIVE_FORUMS,
    entries
  };
}
