// @flow
import update from 'immutability-helper';
// @ts-ignore
import chain from 'lodash/chain';
import get from 'lodash/get';
import * as forumApi from './index';
import createReducer from '../api/createReducer';

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
  entries: []
};

// export default function forums(state: ForumState = initialState, action: ForumActions): ForumState {
//   switch (action.type) {
//     case REQUEST_FORUMS:
//       return update(state, {
//         isFetching: { $set: true },
//         didInvalidate: { $set: false }
//       });
//
//     case RECEIVE_FORUMS: {
//       const allForums = action.entries.concat(get(state, `entries`, []));
//       const uniqueForums = allForums.filter((a, i) => allForums.findIndex(s => a.id === s.id) === i);
//       // console.log(forums1);
//       //
//       // const uniqueForums = chain(action.entries)
//       //   .concat(get(state, `entries`, []))
//       //   .groupBy('id')
//       //   .map(spread(merge))
//       //   .value();
//
//       const forumState = update(state, {
//         isFetching: { $set: false },
//         didInvalidate: { $set: false },
//         lastUpdated: { $set: Date.now() },
//         entries: { $set: uniqueForums }
//       });
//
//       console.log(forumState);
//
//       return forumState;
//     }
//
//     case INVALIDATE_FORUMS:
//       return update(state, {
//         didInvalidate: { $set: true }
//       });
//
//     default:
//       return state;
//   }
// }

export const forums = createReducer(initialState, {
  REQUEST_FORUMS: (state: ForumState) =>
    update(state, {
      isFetching: { $set: true },
      didInvalidate: { $set: false }
    }),

  RECEIVE_FORUMS: (state: ForumState, action: ReceiveForumsAction) => {
    const allForums = action.entries.concat(get(state, `entries`, []));
    const uniqueForums = allForums.filter((a, i) => allForums.findIndex(s => a.id === s.id) === i);
    // console.log(forums1);
    //
    // const uniqueForums = chain(action.entries)
    //   .concat(get(state, `entries`, []))
    //   .groupBy('id')
    //   .map(spread(merge))
    //   .value();

    const forumState = update(state, {
      isFetching: { $set: false },
      didInvalidate: { $set: false },
      lastUpdated: { $set: Date.now() },
      entries: { $set: uniqueForums }
    });

    return forumState;
  },

  INVALIDATE_FORUMS: (state: ForumState, action: InvalidateForumsAction) =>
    update(state, {
      didInvalidate: { $set: true }
    })
});

export default forums;
