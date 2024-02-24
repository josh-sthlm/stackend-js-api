import get from 'lodash/get';
import concat from 'lodash/concat';
import update from 'immutability-helper';
import createReducer from '../api/createReducer';
import { getJsonErrorText, logger, XcapJsonErrors } from '../api';
import { BlogEntry, GetEntriesResult } from './index';
import { LikeDataMap } from '../like';
import { emptyPaginatedCollection, PaginatedCollection } from '../api/PaginatedCollection';

//Action Type
export const REQUEST_GROUP_BLOG_ENTRIES = 'REQUEST_GROUP_BLOG_ENTRIES';
export const RECEIVE_GROUP_BLOG_ENTRIES = 'RECEIVE_GROUP_BLOG_ENTRIES';
export const INVALIDATE_GROUP_BLOG_ENTRIES = 'INVALIDATE_GROUP_BLOG_ENTRIES';
export const UPDATE_GROUP_BLOG_ENTRY = 'UPDATE_GROUP_BLOG_ENTRY';
export const UPDATE_AUTH_BLOG = 'UPDATE_AUTH_BLOG';

export type GroupBlogEntriesActions = Receive | Update | Request | Invalidate | UpdateAuthBlog;

type BlogKey = string; //ex: groups/news

export interface GroupBlogState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number;
  error?: XcapJsonErrors;
  json: {
    resultPaginated: PaginatedCollection<BlogEntry>;
    likesByCurrentUser: any;
    likes: LikeDataMap;
    blogId: number;
  };
}

export interface GroupBlogEntriesState {
  [blogKey: string]: GroupBlogState;
}

/**
 * Get the state for a given blogKey
 * @param groupBlogEntriesState
 * @param blogKey
 */
export function getGroupBlogState(
  groupBlogEntriesState: GroupBlogEntriesState,
  blogKey: string
): GroupBlogState | null {
  return groupBlogEntriesState[blogKey] || null;
}

/**
 * Get the blog entries
 * @param groupBlogEntriesState
 * @param blogKey
 */
export function getBlogEntries(
  groupBlogEntriesState: GroupBlogEntriesState,
  blogKey: string
): PaginatedCollection<BlogEntry> | null {
  const x: GroupBlogState | null = groupBlogEntriesState[blogKey];
  if (x) {
    return (x.json?.resultPaginated as PaginatedCollection<BlogEntry>) || null;
  }
  return null;
}

/**
 * Check if relevant blog entries exists in store
 * @param groupBlogEntriesState
 * @param blogKey
 * @param pageSize
 * @param p
 * @param categoryId
 */
export function hasBlogEntries(
  groupBlogEntriesState: GroupBlogEntriesState,
  blogKey: string,
  pageSize: number,
  p: number,
  categoryId?: number,
  goToBlogEntry?: string
): boolean {
  const pe = getBlogEntries(groupBlogEntriesState, blogKey);
  if (pe) {
    if (pe.page < p) {
      return false;
    }
    if (pe.pageSize != pageSize) {
      return false;
    }

    if (goToBlogEntry && !pe.entries.some(entry => entry.permalink === goToBlogEntry)) {
      return false;
    }

    return true;
    // FIXME: categoryId included in request, but not key
  }
  return false;
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

interface UpdateAuthBlog {
  type: typeof UPDATE_AUTH_BLOG;
  blogKey: BlogKey;
}

// FIXME: The reducer stores a lot of crap. The entire json response
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
              json: { $set: get(state, `[${action.blogKey}].json`, {}) }
            })
        }
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
                json: { $merge: { resultPaginated: emptyPaginatedCollection<BlogEntry>() } },
                error: { $set: action.json.error }
              })
          }
        });
      }

      // Combine the existing and new entries, update the existing if needed

      const origEntries: Array<BlogEntry> = get(
        getGroupBlogState(state, action.blogKey),
        'json.resultPaginated.entries',
        []
      );
      const addEntries: Array<BlogEntry> = [];
      action.json.resultPaginated.entries.forEach(e => {
        const existingEntry = origEntries.find(o => o.id === e.id);
        if (existingEntry) {
          Object.assign(existingEntry, e);
        } else {
          addEntries.push(e);
        }
      });

      const uniqueBlogEntries = concat(origEntries, addEntries);

      //console.log("RECEIVE_GROUP_BLOG_ENTRIES", action.json);

      return update(state, {
        [action.blogKey]: {
          $apply: (context): any =>
            update(context || {}, {
              isFetching: { $set: false },
              didInvalidate: { $set: false },
              lastUpdated: { $set: action.receivedAt },
              json: {
                $apply: (context): any => {
                  const op: any = {
                    resultPaginated: {
                      entries: { $set: uniqueBlogEntries }
                    }
                  };
                  /* FIXME: Improve this. The check is typically needed when this is called from saveEntry */
                  if (action.json.likes) {
                    op.likes = { $set: action.json.likes };
                  }
                  if (action.json.likesByCurrentUser) {
                    op.likesByCurrentUser = { $set: action.json.likesByCurrentUser };
                  }
                  if (action.json.blog) {
                    op.blog = { $set: action.json.blog };
                  }
                  if (action.json.authBlog) {
                    op.authBlog = { $set: action.json.authBlog };
                  }
                  if (action.json.blogKey) {
                    op.blogKey = { $set: action.json.blogKey };
                  }
                  if (action.json.categories) {
                    op.categories = { $set: action.json.categories };
                  }

                  return update(
                    Object.assign({}, context, { resultPaginated: action.json.resultPaginated }),
                    op as any
                  );
                }
              }
            })
        }
      });
    },

    INVALIDATE_GROUP_BLOG_ENTRIES: (state: GroupBlogEntriesState, action: Invalidate) => {
      return {
        ...state,
        ...{
          [action.blogKey]: {
            didInvalidate: true
          }
        }
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
                [indexOfUpdatedEntry]: { $set: updatedBlogEntry }
              }
            }
          }
        }
      });
    }
  }
);

export default groupBlogEntries;
