// @flow
import _ from 'lodash';

import update from 'immutability-helper';
import * as blogApi from './index';
import createReducer from '../api/createReducer';
import { getJsonErrorText } from '../api';
import { REACT_ROUTER_REDUX_LOCATION_CHANGE } from '../request/requestReducers';
import { logger } from '../api';
import { BlogEntry, GetEntriesResult } from './index';
import { LikeDataMap } from '../like';

//Action Type
export const REQUEST_GROUP_BLOG_ENTRIES = 'REQUEST_GROUP_BLOG_ENTRIES';
export const RECEIVE_GROUP_BLOG_ENTRIES = 'RECEIVE_GROUP_BLOG_ENTRIES';
export const INVALIDATE_GROUP_BLOG_ENTRIES = 'INVALIDATE_GROUP_BLOG_ENTRIES';
export const TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY = 'TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY';
export const CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY = 'CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY';
export const UPDATE_GROUP_BLOG_ENTRY = 'UPDATE_GROUP_BLOG_ENTRY';

export type GroupBlogEntriesActions = Receive | Update | Request | Invalidate;

type BlogKey = string; //ex: groups/news

export interface GroupBlogEntriesState {
  [BlogKey: string]: {
    isFetching: boolean;
    didInvalidate: boolean;
    json: {
      resultPaginated: {
        entries: Array<blogApi.BlogEntry>;
      };
      userRsvpStatuses: any;
      likesByCurrentUser: any;
      likes: LikeDataMap;
      blogId: number;
    };
    lastUpdated: number;
  };
}

interface Receive {
  type: typeof RECEIVE_GROUP_BLOG_ENTRIES;
  blogKey: BlogKey;
  receivedAt: number;
  json: GetEntriesResult;
}

export type UpdateBlogEntry = {
  blogId?: number;
  resultPaginated: {
    entries: Array<BlogEntry>;
  };
  userRsvpStatuses?: any;
  likesByCurrentUser?: any;
};

interface Update {
  type: typeof UPDATE_GROUP_BLOG_ENTRY;
  blogKey: BlogKey;
  receivedAt: number;
  json: UpdateBlogEntry;
}

interface Request {
  type: typeof REQUEST_GROUP_BLOG_ENTRIES;
  blogKey: BlogKey;
}

interface Invalidate {
  type: typeof INVALIDATE_GROUP_BLOG_ENTRIES;
  blogKey: BlogKey;
}

//Reducer
export const groupBlogEntries = createReducer(
  {},
  {
    REQUEST_GROUP_BLOG_ENTRIES: (state: GroupBlogEntriesState, action: Request) =>
      update(state, {
        [action.blogKey]: {
          $apply: (context): any =>
            update(context || {}, {
              isFetching: { $set: true },
              didInvalidate: { $set: false },
              // @ts-ignore
              json: { $set: _.get(state, `[${action.blogKey}].json`, {}) },
            }),
        },
      }),

    RECEIVE_GROUP_BLOG_ENTRIES: (state: GroupBlogEntriesState, action: Receive) => {
      if (action.json.error) {
        logger.warn(RECEIVE_GROUP_BLOG_ENTRIES, 'Error:', action.blogKey, getJsonErrorText(action.json));

        return update(state, {
          [action.blogKey]: {
            $apply: (context): any =>
              update(context || {}, {
                isFetching: { $set: false },
                didInvalidate: { $set: false },
                lastUpdated: { $set: action.receivedAt },
                // @ts-ignore
                json: { $merge: { resultPaginated: { page: 1, totalSize: 0, entries: [] } } },
                error: { $set: action.json.error },
              }),
          },
        });
      }

      // Combine the existing and new entries, update the existing if needed
      // @ts-ignore
      const origEntries: Array<BlogEntry> = _.get(state, `[${action.blogKey}].json.resultPaginated.entries`, []);
      const addEntries: Array<BlogEntry> = [];
      action.json.resultPaginated.entries.forEach(e => {
        const existingEntry = origEntries.find(o => o.id === e.id);
        if (existingEntry) {
          _.assign(existingEntry, e);
        } else {
          addEntries.push(e);
        }
      });

      const uniqueBlogEntries = _.concat(origEntries, addEntries);

      //console.log("RECEIVE_GROUP_BLOG_ENTRIES", action.json);

      return update(state, {
        [action.blogKey]: {
          $apply: (context): any =>
            update(context || {}, {
              isFetching: { $set: false },
              didInvalidate: { $set: false },
              lastUpdated: { $set: action.receivedAt },
              json: {
                $apply: (context): any =>
                  update(Object.assign({}, context, action.json), {
                    resultPaginated: {
                      entries: { $set: uniqueBlogEntries },
                    },
                  }),
              },
            }),
        },
      });
    },

    INVALIDATE_GROUP_BLOG_ENTRIES: (state: GroupBlogEntriesState, action: Invalidate) => {
      return {
        ...state,
        ...{
          [action.blogKey]: {
            didInvalidate: true,
          },
        },
      };
    },

    UPDATE_GROUP_BLOG_ENTRY: (state: GroupBlogEntriesState, action: Update) => {
      // Last index is the updated entry
      const updatedBlogEntry = action.json.resultPaginated.entries[action.json.resultPaginated.entries.length - 1];
      const indexOfUpdatedEntry = state[action.blogKey].json.resultPaginated.entries
        .map(blogEntry => blogEntry.id)
        .indexOf(updatedBlogEntry.id);

      return update(state, {
        [action.blogKey]: {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: action.receivedAt },
          json: {
            resultPaginated: {
              entries: {
                [indexOfUpdatedEntry]: { $set: updatedBlogEntry },
              },
            },
          },
        },
      });
    },
  }
);

export default groupBlogEntries;

type OpenBlogEntryWriteCommentSection = false | { blogEntryId: number; editorType: 'EDIT' | 'COMMENT' };

export type OpenBlogEntryWriteCommentSectionActions =
  | {
      type: typeof TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY;
      blogEntryId: number;
      editorType: 'EDIT' | 'COMMENT';
    }
  | {
      type: typeof REACT_ROUTER_REDUX_LOCATION_CHANGE;
    }
  | {
      type: typeof CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY;
    };

export function openBlogEntryWriteCommentSection(
  state: OpenBlogEntryWriteCommentSection = false,
  action: OpenBlogEntryWriteCommentSectionActions
): OpenBlogEntryWriteCommentSection {
  switch (action.type) {
    case TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY:
      if (!!state && state.blogEntryId === action.blogEntryId && state.editorType === action.editorType) {
        return false;
      } else {
        return {
          blogEntryId: action.blogEntryId,
          editorType: action.editorType,
        };
      }
    case REACT_ROUTER_REDUX_LOCATION_CHANGE:
    case CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY:
      return false;
    default:
      return state;
  }
}
