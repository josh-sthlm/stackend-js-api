// @flow
import _ from 'lodash';
import update from 'immutability-helper';
import * as commentAction from './commentAction';
import * as commentsApi from './index';
import { Comment } from './index';
import { emptyPaginatedCollection, PaginatedCollection } from '../api/PaginatedCollection';

//Action Type
export const REQUEST_GROUP_COMMENTS = 'REQUEST_GROUP_COMMENTS';
export const RECEIVE_GROUP_COMMENTS = 'RECEIVE_GROUP_COMMENTS';
export const REQUEST_COMMENTS = 'REQUEST_COMMENTS';
export const RECEIVE_COMMENTS = 'RECEIVE_COMMENTS';
export const UPDATE_COMMENT = 'UPDATE_COMMENT';
export const INVALIDATE_GROUP_COMMENTS = 'INVALIDATE_GROUP_COMMENTS';
export const TOGGLE_REPLY_BOX = 'TOGGLE_REPLY_BOX';
export const OPEN_REPLY_BOX = 'OPEN_REPLY_BOX';
export const CLOSE_REPLY_BOX = 'CLOSE_REPLY_BOX';
export const OPEN_COMMENT_SECTION = 'OPEN_COMMENT_SECTION';
export const CLOSE_COMMENT_SECTION = 'CLOSE_COMMENT_SECTION';
export const TOGGLE_COMMENT_SECTION = 'TOGGLE_COMMENT_SECTION';
export const TOGGLE_EDIT_COMMENT = 'TOGGLE_EDIT_COMMENT';

export type CommentsActions =
  | {
      type: typeof REQUEST_GROUP_COMMENTS;
      module: string;
      referenceGroupId: number;
    }
  | {
      type: typeof RECEIVE_GROUP_COMMENTS;
      module: string;
      referenceGroupId: number;
      receivedAt: number;
      json: {
        comments: any;
        likesByCurrentUser: any;
      };
    }
  | {
      type: typeof INVALIDATE_GROUP_COMMENTS;
      module: string;
      referenceGroupId: number;
    }
  | {
      type: typeof REQUEST_COMMENTS;
      module: string;
      referenceId: number;
      referenceGroupId: number;
    }
  | {
      type: typeof RECEIVE_COMMENTS;
      module: string;
      referenceId: number;
      referenceGroupId: number;
      receivedAt: number;
      json: commentAction.ReceiveCommentsJson;
    }
  | {
      type: typeof UPDATE_COMMENT;
      id: number;
      module: string;
      referenceId: number;
      referenceGroupId: number;
      receivedAt: number;
      json: commentsApi.Comment;
    };

export type openReplyBoxesActionType = 'TOGGLE_REPLY_BOX' | 'OPEN_REPLY_BOX' | 'CLOSE_REPLY_BOX';
//TODO: implement //export type openReplyBoxesAction = {

export type openCommentSectionActionType = 'OPEN_COMMENT_SECTION' | 'CLOSE_COMMENT_SECTION' | 'TOGGLE_COMMENT_SECTION';
//TODO: implement //export type openCommentSectionAction = {

export type openEditCommentActionType = 'TOGGLE_EDIT_COMMENT';
//TODO: implement //export type openEditCommentAction = {

export interface CommentsState {
  [blogkey: string]: {
    isFetching: boolean;
    didInvalidate: boolean;
    lastUpdated: number;
    json: {
      likesByCurrentUser: any;
      comments: {
        [id: number]: {
          isFetching: boolean;
          didInvalidate: boolean;
          lastUpdated: number;
          entries: Array<commentsApi.Comment>;
        };
      };
      error?: string;
    };
  };
}

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
          json: typeof state[key] !== 'undefined' ? state[key].json : '',
        },
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
            json,
          },
        });
      } else {
        return Object.assign({}, state, {
          [key]: {
            isFetching: false,
            didInvalidate: false,
            lastUpdated: action.receivedAt,
            json: action.json,
          },
        });
      }

    case REQUEST_COMMENTS: {
      key = commentAction._getCommentsStateKey(action);

      const requestBlogEntryComments = Object.assign(
        {},
        state[key] ? state[key].json.comments[action.referenceId] : {},
        {
          isFetching: true,
          didInvalidate: false,
        }
      );

      const requestBlogEntiesWithComments = Object.assign({}, state[key] ? state[key].json.comments : {}, {
        [action.referenceId]: requestBlogEntryComments,
      });

      const likesByCurrentUser = Object.assign({}, state[key] ? state[key].json.likesByCurrentUser : {});

      return Object.assign({}, state, {
        [key]: {
          isFetching: true,
          didInvalidate: false,
          json: {
            comments: requestBlogEntiesWithComments,
            likesByCurrentUser,
          },
        },
      });
    }

    case RECEIVE_COMMENTS: {
      const { referenceId } = action;
      key = commentAction._getCommentsStateKey(action);

      if (action.json.error) {
        // @ts-ignore
        return update(state, {
          [key]: {
            isFetching: { $set: false },
            didInvalidate: { $set: false },
            lastUpdated: { $set: action.receivedAt },
            json: {
              comments: {
                [referenceId]: {
                  $set: {
                    isFetching: false,
                    didInvalidate: false,
                    lastUpdated: action.receivedAt,
                    error: action.json.error,
                  },
                },
              },
            },
          },
        });
      }

      const origComments: any = _.get(state, `[${key}].json.comments[${referenceId}].entries`, []);
      const newComments: Array<Comment> = [];
      action.json.comments.entries.forEach(e => {
        const orig = origComments.find((o: Comment) => o.id === e.id);
        if (orig) {
          _.assign(orig, e);
        } else {
          newComments.push(e);
        }
      });

      const referenceIdUniqueComments: Array<Comment> = _.concat(origComments, newComments);
      // @ts-ignore
      const pagination: PaginatedCollection<Comment> = _.get(
        state,
        `[${key}].json.comments[${referenceId}]`,
        emptyPaginatedCollection()
      );

      delete (pagination as any)['entries'];
      pagination.totalSize += action.json.comments.entries.length;

      const x = update(action.json.comments, {
        entries: { $set: referenceIdUniqueComments },
      });

      // Work around for $merge not beeing able to $set
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
                  ...x,
                },
              },
            },
          },
        },
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
                  [indexOfUpdatedComment]: { $set: action.json },
                },
              },
            },
          },
        },
      });
    }

    case INVALIDATE_GROUP_COMMENTS:
      key = commentAction._getCommentsStateKey(action);
      return Object.assign({}, state, {
        [key]: {
          didInvalidate: true,
        },
      });
    default:
      return state;
  }
}

export default GroupComments;

export type OpenReplyBoxesState = Array<number>;

export function openReplyBoxes(
  state: OpenReplyBoxesState = [],
  action: { type: string; parentId: number }
): OpenReplyBoxesState {
  switch (action.type) {
    case OPEN_REPLY_BOX:
      return state.concat(action.parentId);

    case CLOSE_REPLY_BOX: {
      const i = state.indexOf(action.parentId);
      if (i == -1) {
        return state;
      }
      return Object.assign([], state.splice(i, 1));
    }

    case TOGGLE_REPLY_BOX: {
      //if reply box is closed
      const i = state.indexOf(action.parentId);
      if (i === -1) {
        //open replybox
        return state.concat(action.parentId);
      } else {
        //close replybox
        state.splice(i, 1);
        return Object.assign([], state);
      }
    }

    default:
      return state;
  }
}

export type OpenEditCommentState = Array<number>;

export function openEditComment(
  state: OpenEditCommentState = [],
  action: { type: string; id: number }
): OpenEditCommentState {
  switch (action.type) {
    case TOGGLE_EDIT_COMMENT: {
      //if Edit Comment is closed
      const i = state.indexOf(action.id);
      if (i === -1) {
        //open Edit Comment
        return state.concat(action.id);
      } else {
        //close Edit Comment
        state.splice(i, 1);
        return Object.assign([], state);
      }
    }

    default:
      return state;
  }
}

export type OpenCommentSectionState = boolean;

export function openCommentSection(
  state: OpenCommentSectionState = false,
  action: { type: string }
): OpenCommentSectionState {
  switch (action.type) {
    case OPEN_COMMENT_SECTION:
      return true;
    case CLOSE_COMMENT_SECTION:
      return false;
    case TOGGLE_COMMENT_SECTION:
      return !state;
    default:
      return state;
  }
}
