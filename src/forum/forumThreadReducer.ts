// @flow
import _ from 'lodash';
import update from 'immutability-helper';
import { Action } from 'redux';
import createReducer from '../createReducer';
import * as forumApi from '../forum';
import { ForumThreadEntry } from '../forum';

export type ForumThreadActions = Request | Recieve | Invalidate | Rate | Like | DeleteEntry;

export const actionTypes = {
  RECIEVE_FORUM_THREADS: 'RECIEVE_FORUM_THREADS',
  REQUEST_FORUM_THREADS: 'REQUEST_FORUM_THREADS',
  INVALIDATE_FORUM_THREADS: 'INVALIDATE_FORUM_THREADS',
  RECIEVE_VOTE_FORUM_THREAD: 'RECIEVE_VOTE_FORUM_THREAD',
  RECIEVE_LIKE_FORUM_THREAD: 'RECIEVE_LIKE_FORUM_THREAD',
  UPDATE_FORUM_THREAD_ENTRY: 'UPDATE_FORUM_THREAD_ENTRY',
  DELETE_FORUM_THREAD: 'DELETE_FORUM_THREAD',
};

export type Request = Action & {
  type: 'REQUEST_FORUM_THREADS';
};
export type Recieve = Action & {
  type: 'RECIEVE_FORUM_THREADS';
  entries: Array<forumApi.ForumThreadEntry>;
  forumPermalink: string;
  pageSize: number;
};
export type Update = Action & {
  type: 'UPDATE_FORUM_THREAD_ENTRY';
  entry: forumApi.ForumThreadEntry;
  forumPermalink: string;
};
export type Invalidate = Action & {
  type: 'INVALIDATE_FORUM_THREADS';
};
export type Rate = Action & {
  type: 'RECIEVE_VOTE_FORUM_THREAD';
  voteJson: forumApi.VoteReturn;
  forumPermalink: string;
};
export type Like = Action & {
  type: 'RECIEVE_LIKE_FORUM_THREAD';
  referenceId: number;
  recievedLikes: any;
  forumPermalink: string;
};
export type DeleteEntry = Action & {
  type: 'DELETE_FORUM_THREAD';
  entry: forumApi.ForumThreadEntry;
};

export interface ForumThreadState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number; //Date
  forums: {
    [forumPermalink: string]: Array<forumApi.ForumThreadEntry>;
  };
}

const initialState: ForumThreadState = {
  isFetching: false,
  didInvalidate: false,
  lastUpdated: 0,
  forums: {},
};

export default createReducer(initialState, {
  REQUEST_FORUM_THREADS: (state: ForumThreadState) =>
    update(state, {
      isFetching: { $set: true },
      didInvalidate: { $set: false },
    }),

  RECIEVE_FORUM_THREADS: (state: ForumThreadState, action: Recieve) => {
    const uniqueForumThreads = _(action.entries)
      .concat(_.get(state, `forums[${action.forumPermalink}]`, []))
      .groupBy('id')
      .map(_.spread(_.merge))
      .value()
      .sort((a: ForumThreadEntry, b: ForumThreadEntry) => (a.sticky ? 1 : 0) - (b.sticky ? 1 : 0));

    return update(state, {
      isFetching: { $set: false },
      didInvalidate: { $set: false },
      lastUpdated: { $set: Date.now() },
      // @ts-ignore
      forums: {
        [action.forumPermalink]: {
          // FIXME: Error?
          // @ts-ignore
          $apply: (forumPermalink: string): any => update(forumPermalink || [], { $set: uniqueForumThreads }),
        },
      },
    });
  },

  UPDATE_FORUM_THREAD_ENTRY: (state: ForumThreadState, action: Update) => {
    let indexOfUpdatedEntry = state.forums[action.forumPermalink].map(entry => entry.id).indexOf(action.entry.id);

    if (indexOfUpdatedEntry === -1) {
      // Addition
      indexOfUpdatedEntry = state.forums[action.forumPermalink].length;
    }

    return update(state, {
      isFetching: { $set: false },
      didInvalidate: { $set: false },
      lastUpdated: { $set: Date.now() },
      forums: {
        [action.forumPermalink]: {
          [indexOfUpdatedEntry]: { $set: action.entry },
        },
      },
    });
  },
  INVALIDATE_FORUM_THREADS: (state: ForumThreadState) =>
    update(state, {
      didInvalidate: { $set: true },
    }),

  RECIEVE_VOTE_FORUM_THREAD: (state: ForumThreadState, action: Rate) => {
    const forumThreadKey = state.forums[action.forumPermalink].findIndex(
      thread => thread.id === action.voteJson.referenceId
    );

    return update(state, {
      // @ts-ignore
      forums: {
        [action.forumPermalink]: {
          [forumThreadKey]: {
            voteByCurrentUser: { $set: action.voteJson.score },
            voteSummary: { $set: action.voteJson.voteSummary },
          },
        },
      },
    });
  },

  RECIEVE_LIKE_FORUM_THREAD: (state: ForumThreadState, action: Like) => {
    const forumThreadKey = state.forums[action.forumPermalink].findIndex(thread => thread.id === action.referenceId);
    return update(state, {
      // @ts-ignore
      forums: {
        [action.forumPermalink]: {
          [forumThreadKey]: {
            numberOfLikes: { $set: action.recievedLikes.numberOfLikes },
            likedByCurrentUser: {
              $apply: (context: string): any =>
                update(context || {}, {
                  likes: { $set: action.recievedLikes.numberOfLikes },
                  likedByCurrentUser: {
                    $set: !action.recievedLikes.remove,
                  },
                }),
            },
          },
        },
      },
    });
  },
  DELETE_FORUM_THREAD: (state: ForumThreadState, action: DeleteEntry) => {
    const forumThreadEntryKey = state.forums[action.entry.forumRef.permalink].findIndex(
      thread => thread.id === action.entry.id
    );
    return update(state, {
      forums: {
        [action.entry.forumRef.permalink]: {
          [forumThreadEntryKey]: { $set: action.entry },
        },
      },
    });
  },
});
