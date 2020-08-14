// @flow
import _ from 'lodash';

import update from 'immutability-helper';
import * as blogApi from '../blog';
import createReducer from '../createReducer';
import { getJsonErrorText } from '../api';
import { REACT_ROUTER_REDUX_LOCATION_CHANGE } from '../request/requestReducers';
import { logger } from '../api';
import { BlogEntry, GetEntriesResult } from '../blog';

//Action Type
export const REQUEST_GROUP_BLOG_ENTRIES = 'REQUEST_GROUP_BLOG_ENTRIES';
export const RECIEVE_GROUP_BLOG_ENTRIES = 'RECIEVE_GROUP_BLOG_ENTRIES';
export const INVALIDATE_GROUP_BLOG_ENTRIES = 'INVALIDATE_GROUP_BLOG_ENTRIES';
export const TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY = 'TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY';
export const CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY = 'CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY';
export const UPDATE_GROUP_BLOG_ENTRY = 'UPDATE_GROUP_BLOG_ENTRY';

export type GroupBlogEntriesActions = Recieve | Update | Request | Invalidate;
export type GroupBlogEntriesActionTypes =
  | 'INVALIDATE_GROUP_BLOG_ENTRIES'
  | 'RECIEVE_GROUP_BLOG_ENTRIES'
  | 'REQUEST_GROUP_BLOG_ENTRIES'
  | 'TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY'
  | 'CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY'
  | 'UPDATE_GROUP_BLOG_ENTRY';

type BlogKey = string; //ex: king/blog

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
      blogId: number;
    };
    lastUpdated: number;
  };
}

interface Recieve {
  type: 'RECIEVE_GROUP_BLOG_ENTRIES';
  blogKey: BlogKey;
  receievedAt: number;
  json: GetEntriesResult;
}

interface Update {
  type: 'UPDATE_GROUP_BLOG_ENTRY';
  blogKey: BlogKey;
  receievedAt: number;
  json: {
    blogId: number;
    resultPaginated: {
      entries: Array<blogApi.BlogEntry>;
    };
    userRsvpStatuses: any;
    likesByCurrentUser: any;
  };
}

interface Request {
  type: 'REQUEST_GROUP_BLOG_ENTRIES';
  blogKey: BlogKey;
}

interface Invalidate {
  type: 'INVALIDATE_GROUP_BLOG_ENTRIES';
  blogKey: BlogKey;
}

//Reducer
export const groupBlogEntries = createReducer(
  {},
  {
    REQUEST_GROUP_BLOG_ENTRIES: (state: GroupBlogEntriesState, action: Request) =>
      update(state, {
        [action.blogKey]: {
          $apply: context =>
            update(context || {}, {
              isFetching: { $set: true },
              didInvalidate: { $set: false },
              // @ts-ignore
              json: { $set: _.get(state, `[${action.blogKey}].json`, {}) },
            }),
        },
      }),

    RECIEVE_GROUP_BLOG_ENTRIES: (state: GroupBlogEntriesState, action: Recieve) => {
      if (action.json.error) {
        logger.warn(RECIEVE_GROUP_BLOG_ENTRIES, 'Error:', action.blogKey, getJsonErrorText(action.json));

        return update(state, {
          [action.blogKey]: {
            $apply: context =>
              update(context || {}, {
                isFetching: { $set: false },
                didInvalidate: { $set: false },
                lastUpdated: { $set: action.receievedAt },
                // @ts-ignore
                json: { $merge: { resultPagined: { page: 1, totalSize: 0, entries: [] } } },
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

      //console.log("RECIEVE_GROUP_BLOG_ENTRIES", action.json);

      return update(state, {
        [action.blogKey]: {
          $apply: context =>
            update(context || {}, {
              isFetching: { $set: false },
              didInvalidate: { $set: false },
              lastUpdated: { $set: action.receievedAt },
              json: {
                $apply: context =>
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
          lastUpdated: { $set: action.receievedAt },
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

export interface OpenBlogEntryWriteCommentSectionAction {
  type: string;
  blogEntryId: number;
  editorType: 'EDIT' | 'COMMENT';
}

export function openBlogEntryWriteCommentSection(
  state: OpenBlogEntryWriteCommentSection = false,
  action: OpenBlogEntryWriteCommentSectionAction
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
