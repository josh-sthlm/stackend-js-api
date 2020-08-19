// @flow
import _ from 'lodash';
import update from 'immutability-helper';
import createReducer from '../createReducer';
import * as forumApi from '../forum';
import { ForumThreadEntry } from '../forum';

export type ForumThreadActions = Request | Receive | Invalidate | Rate | Like | DeleteEntry | Update;


export const RECEIVE_FORUM_THREADS ='RECEIVE_FORUM_THREADS';
export const REQUEST_FORUM_THREADS = 'REQUEST_FORUM_THREADS';
export const INVALIDATE_FORUM_THREADS = 'INVALIDATE_FORUM_THREADS';
export const RECEIVE_VOTE_FORUM_THREAD = 'RECEIVE_VOTE_FORUM_THREAD';
export const RECEIVE_LIKE_FORUM_THREAD = 'RECEIVE_LIKE_FORUM_THREAD';
export const UPDATE_FORUM_THREAD_ENTRY = 'UPDATE_FORUM_THREAD_ENTRY';
export const DELETE_FORUM_THREAD = 'DELETE_FORUM_THREAD';


export type Request =  {
  type: typeof REQUEST_FORUM_THREADS;
};
export type Receive =  {
  type: typeof RECEIVE_FORUM_THREADS;
  entries: Array<forumApi.ForumThreadEntry>;
  forumPermalink: string;
  pageSize: number;
};

export type Update = {
  type: typeof UPDATE_FORUM_THREAD_ENTRY;
  entry: forumApi.ForumThreadEntry;
  forumPermalink: string;
};

export type Invalidate =  {
  type: typeof INVALIDATE_FORUM_THREADS;
};
export type Rate =  {
  type: typeof RECEIVE_VOTE_FORUM_THREAD;
  voteJson: forumApi.VoteReturn;
  forumPermalink: string;
};

export type Like =  {
  type: typeof RECEIVE_LIKE_FORUM_THREAD;
  referenceId: number;
  receivedLikes: any;
  forumPermalink: string;
};
export type DeleteEntry = {
  type: typeof DELETE_FORUM_THREAD;
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

  RECEIVE_FORUM_THREADS: (state: ForumThreadState, action: Receive) => {
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

  RECEIVE_VOTE_FORUM_THREAD: (state: ForumThreadState, action: Rate) => {
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

  RECEIVE_LIKE_FORUM_THREAD: (state: ForumThreadState, action: Like) => {
    const forumThreadKey = state.forums[action.forumPermalink].findIndex(thread => thread.id === action.referenceId);
    return update(state, {
      // @ts-ignore
      forums: {
        [action.forumPermalink]: {
          [forumThreadKey]: {
            numberOfLikes: { $set: action.receivedLikes.numberOfLikes },
            likedByCurrentUser: {
              $apply: (context: string): any =>
                update(context || {}, {
                  likes: { $set: action.receivedLikes.numberOfLikes },
                  likedByCurrentUser: {
                    $set: !action.receivedLikes.remove,
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
