// @flow
import _ from 'lodash';
import { Forum, listForums } from '../forum';
import { Thunk } from '../api';
import { ForumActions, RECEIVE_FORUMS, REQUEST_FORUMS } from './forumReducer';

//Requests and receive comments and store them in redux-state
export function fetchForums(): Thunk<void> {
  return async (dispatch: any): Promise<void> => {
    dispatch(requestForums());
    const json = await dispatch(listForums({}));
    dispatch(receiveForums({ entries: _.get(json, 'forumsPaginated.entries', []) }));
  };
}

export function requestForums(): ForumActions {
  return { type: REQUEST_FORUMS };
}

export function receiveForums({ entries }: { entries: Array<Forum> }): ForumActions {
  return {
    type: RECEIVE_FORUMS,
    entries,
  };
}
