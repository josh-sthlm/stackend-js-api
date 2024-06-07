// @flow
import get from 'lodash/get';
import concat from 'lodash/concat';
import assign from 'lodash/assign';
import update from 'immutability-helper';
import * as commentAction from './commentAction';
import * as commentsApi from './index';
import { Comment, CommentModule, CommentSortCriteria } from './index';
import { emptyPaginatedCollection, PaginatedCollection } from '../api/PaginatedCollection';
import SortOrder from '../api/SortOrder';

//Action Type
export const REQUEST_GROUP_COMMENTS = 'REQUEST_GROUP_COMMENTS';
export const RECEIVE_GROUP_COMMENTS = 'RECEIVE_GROUP_COMMENTS';
export const REQUEST_COMMENTS = 'REQUEST_COMMENTS';
export const RECEIVE_COMMENTS = 'RECEIVE_COMMENTS';
export const UPDATE_COMMENT = 'UPDATE_COMMENT';
export const INVALIDATE_GROUP_COMMENTS = 'INVALIDATE_GROUP_COMMENTS';
export const COMMENT_REMOVED = 'COMMENT_REMOVED';

export interface CommentCollectionState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number;
  entries: Array<commentsApi.Comment>;
}

export interface CommentsState {
  /**
   * Comments, arranged by getCommentsStateKey()
   */
  [commentsStateKey: string]: {
    isFetching: boolean;
    didInvalidate: boolean;
    lastUpdated: number;
    json: {
      likesByCurrentUser: any;
      comments: {
        [referenceId: number]: CommentCollectionState;
      };
      error?: string;
    };
  };
}

export interface CommonParameters {
  module: CommentModule;
  referenceId: number;
  referenceGroupId: number;
  commentSortCriteria: CommentSortCriteria;
  order: SortOrder;
}

export type CommentsActions =
  | {
      type: typeof REQUEST_GROUP_COMMENTS;
      module: CommentModule;
      referenceGroupId: number;
      commentSortCriteria: CommentSortCriteria;
      order: SortOrder;
    }
  | {
      type: typeof RECEIVE_GROUP_COMMENTS;
      module: CommentModule;
      referenceGroupId: number;
      receivedAt: number;
      json: {
        comments: any;
        likesByCurrentUser: any;
      };
      commentSortCriteria: CommentSortCriteria;
      order: SortOrder;
    }
  | {
      type: typeof INVALIDATE_GROUP_COMMENTS;
      module: CommentModule;
      referenceGroupId: number;
      commentSortCriteria: CommentSortCriteria;
      order: SortOrder;
    }
  | (CommonParameters & {
      type: typeof REQUEST_COMMENTS;
    })
  | (CommonParameters & {
      type: typeof RECEIVE_COMMENTS;
      receivedAt: number;
      json: commentAction.ReceiveCommentsJson;
    })
  | (CommonParameters & {
      type: typeof UPDATE_COMMENT;
      id: number;
      receivedAt: number;
      json: commentsApi.Comment;
    })
  | (CommonParameters & {
      type: typeof COMMENT_REMOVED;
      id: number;
    });

//Reducer
export function GroupComments(state: CommentsState = {}, action: CommentsActions): CommentsState {
  let key = '';
  switch (action.type) {
    case REQUEST_GROUP_COMMENTS:
      key = commentAction._getCommentsStateKey(action);

      return Object.assign({}, state, {
        [key]: {
          isFetching: true,
          didInvalidate: false,
          json: typeof state[key] !== 'undefined' ? state[key].json : ''
        }
      });

    case RECEIVE_GROUP_COMMENTS:
      key = commentAction._getCommentsStateKey(action);

      if (state[key].json) {
        const json = state[key].json;
        json.comments = Object.assign({}, state[key].json.comments, action.json.comments);
        json.likesByCurrentUser = Object.assign({}, state[key].json.likesByCurrentUser, action.json.likesByCurrentUser);

        return Object.assign({}, state, {
          [key]: {
            isFetching: false,
            didInvalidate: false,
            lastUpdated: action.receivedAt,
            json
          }
        });
      } else {
        return Object.assign({}, state, {
          [key]: {
            isFetching: false,
            didInvalidate: false,
            lastUpdated: action.receivedAt,
            json: action.json
          }
        });
      }

    case REQUEST_COMMENTS: {
      key = commentAction._getCommentsStateKey(action);

      const requestBlogEntryComments = Object.assign(
        {},
        state[key] && state[key].json ? state[key].json.comments[action.referenceId] : {},
        {
          isFetching: true,
          didInvalidate: false
        }
      );

      const requestBlogEntiesWithComments = Object.assign({}, state[key] ? state[key].json.comments : {}, {
        [action.referenceId]: requestBlogEntryComments
      });

      const likesByCurrentUser = Object.assign({}, state[key] ? state[key].json.likesByCurrentUser : {});

      return Object.assign({}, state, {
        [key]: {
          isFetching: true,
          didInvalidate: false,
          json: {
            comments: requestBlogEntiesWithComments,
            likesByCurrentUser
          }
        }
      });
    }

    case RECEIVE_COMMENTS: {
      const { referenceId } = action;
      key = commentAction._getCommentsStateKey(action);

      if (action.json.error) {
        const s: CommentCollectionState = {
          isFetching: false,
          didInvalidate: false,
          lastUpdated: action.receivedAt,
          entries: []
        };

        // @ts-ignore
        return update(state, {
          [key]: {
            isFetching: { $set: false },
            didInvalidate: { $set: false },
            lastUpdated: { $set: action.receivedAt },
            error: { $set: action.json.error },
            json: {
              comments: {
                [referenceId]: {
                  $set: s
                }
              }
            }
          }
        });
      }

      const origComments: any = get(state, `[${key}].json.comments[${referenceId}].entries`, []);
      const newComments: Array<Comment> = [];
      action.json.comments.entries.forEach(e => {
        const orig = origComments.find((o: Comment) => o.id === e.id);
        if (orig) {
          assign(orig, e);
        } else {
          newComments.push(e);
        }
      });

      const referenceIdUniqueComments: Array<Comment> = concat(origComments, newComments);

      const pagination: PaginatedCollection<Comment> = get(
        state,
        `[${key}].json.comments[${referenceId}]`,
        emptyPaginatedCollection()
      ) as PaginatedCollection<Comment>;

      delete (pagination as any)['entries'];
      pagination.totalSize += action.json.comments.entries.length;

      const x = update(action.json.comments, {
        entries: { $set: referenceIdUniqueComments }
      });

      // Work around for $merge not being able to $set
      const first = typeof state[key] === 'undefined' || typeof state[key].json.comments[referenceId] === 'undefined';
      const op = first ? '$set' : '$merge';

      return update(state, {
        [key]: {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: action.receivedAt },
          json: {
            likesByCurrentUser: { $merge: action.json.likesByCurrentUser },
            comments: {
              [referenceId]: {
                [op]: {
                  ...pagination,
                  ...x
                }
              }
            }
          }
        }
      });
    }

    case UPDATE_COMMENT: {
      key = commentAction._getCommentsStateKey(action);
      const updatedComment = action.json;
      const indexOfUpdatedComment = state[key].json.comments[action.referenceId].entries
        .map(comment => comment.id)
        .indexOf(updatedComment.id);
      return update(state, {
        [key]: {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: action.receivedAt },
          json: {
            comments: {
              [action.referenceId]: {
                entries: {
                  [indexOfUpdatedComment]: { $set: action.json }
                }
              }
            }
          }
        }
      });
    }

    case COMMENT_REMOVED: {
      key = commentAction._getCommentsStateKey(action);

      const entries = state[key]?.json?.comments[action.referenceId]?.entries;
      if (!entries) {
        return state;
      }
      const idx = entries.findIndex(c => c.id === action.id);
      if (idx === -1) {
        return state;
      }

      return update(state, {
        [key]: {
          lastUpdated: { $set: Date.now() },
          json: {
            comments: {
              [action.referenceId]: {
                entries: { $splice: [[idx, 1]] }
              }
            }
          }
        }
      });
    }

    case INVALIDATE_GROUP_COMMENTS:
      key = commentAction._getCommentsStateKey(action);
      return Object.assign({}, state, {
        [key]: {
          didInvalidate: true
        }
      });
    default:
      return state;
  }
}

export default GroupComments;
