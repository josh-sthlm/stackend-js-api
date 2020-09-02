// @flow
import update from 'immutability-helper';
import _ from 'lodash';
import createReducer from '../api/createReducer';
import * as forumApi from './index';

export const RECEIVE_FORUMS = 'RECEIVE_FORUMS';
export const REQUEST_FORUMS = 'REQUEST_FORUMS';
export const INVALIDATE_FORUMS = 'INVALIDATE_FORUMS';

export type RequestForumsAction = {
  type: typeof REQUEST_FORUMS;
};
export type ReceiveForumsAction = {
  type: typeof RECEIVE_FORUMS;
  entries: Array<forumApi.Forum>;
};
export type InvalidateForumsAction = {
  type: typeof INVALIDATE_FORUMS;
};

export type ForumActions = RequestForumsAction | ReceiveForumsAction | InvalidateForumsAction;

export interface ForumState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number; //Date
  entries: Array<forumApi.Forum>;
}

const initialState: ForumState = {
  isFetching: false,
  didInvalidate: false,
  lastUpdated: 0,
  entries: [],
};

export default createReducer(initialState, {
  REQUEST_FORUMS: (state: ForumState, action: RequestForumsAction) =>
    update(state, {
      isFetching: { $set: true },
      didInvalidate: { $set: false },
    }),

  RECEIVE_FORUMS: (state: ForumState, action: ReceiveForumsAction) => {
    const uniqueForums = _(action.entries)
      .concat(_.get(state, `entries`, []))
      .groupBy('id')
      .map(_.spread(_.merge))
      .value();

    return update(state, {
      isFetching: { $set: false },
      didInvalidate: { $set: false },
      lastUpdated: { $set: Date.now() },
      entries: { $set: uniqueForums },
    });
  },

  INVALIDATE_FORUMS: (state: ForumState, action: InvalidateForumsAction) =>
    update(state, {
      didInvalidate: { $set: true },
    }),
});
