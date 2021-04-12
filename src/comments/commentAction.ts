import {
  COMMENT_REMOVED,
  CommentsActions,
  INVALIDATE_GROUP_COMMENTS,
  RECEIVE_COMMENTS,
  RECEIVE_GROUP_COMMENTS,
  REQUEST_COMMENTS,
  REQUEST_GROUP_COMMENTS,
  UPDATE_COMMENT
} from './commentReducer';

import {
  Comment,
  getMultipleComments,
  getComments,
  GetMultipleCommentsResult,
  CommentModule,
  getComment,
  GetCommentResult
} from './index';
import { Thunk } from '../api';
import { receiveVotes } from '../vote/voteActions';

/**
 * The default page size: 3
 */
const DEFAULT_PAGE_SIZE = 3;

/**
 * Get the key used to look up comments
 * @param action
 * @returns {string}
 */
export function _getCommentsStateKey<T extends { module: string; referenceGroupId: number }>(action: T): string {
  return action.module + ':' + action.referenceGroupId;
}

/**
 * Get the key used to look up comments
 * @param module
 * @param referenceGroupId
 * @returns {string}
 */
export function getCommentsStateKey(module: string, referenceGroupId: number): string {
  return module + ':' + referenceGroupId;
}

/**
 * Add comments to the redux store (typically run by the fetch-methods)
 * @param module
 * @param referenceGroupId
 * @param json
 */
export function receiveGroupComments(
  module: string,
  referenceGroupId: number,
  json: {
    comments: any;
    likesByCurrentUser: any;
  }
): CommentsActions {
  return {
    type: RECEIVE_GROUP_COMMENTS,
    module,
    referenceGroupId,
    json,
    receivedAt: Date.now()
  };
}

/**
 * Request comments from the server
 * @param module
 * @param referenceGroupId
 */
export function requestGroupComments(module: string, referenceGroupId: number): CommentsActions {
  return {
    type: REQUEST_GROUP_COMMENTS,
    module,
    referenceGroupId
  };
}

/**
 * Requests and receive comments and store them in redux-state
 * @param module
 * @param referenceIds
 * @param referenceGroupId
 * @param p
 * @param pageSize
 */
export function fetchMultipleComments({
  module,
  referenceIds,
  referenceGroupId,
  p = 1,
  pageSize = DEFAULT_PAGE_SIZE
}: {
  module: CommentModule; // Module See Comments.CommentModule
  referenceIds: Array<number>; //Array of reference to fetch comments for
  referenceGroupId: number; // Reference group id, for example blog id (optional)
  p?: number; //page number in paginated collection
  pageSize?: number;
}): Thunk<Promise<GetMultipleCommentsResult>> {
  return async (dispatch: any): Promise<GetMultipleCommentsResult> => {
    dispatch(requestGroupComments(module, referenceGroupId));
    const json = await dispatch(getMultipleComments({ module, referenceIds, pageSize, p }));
    dispatch(receiveGroupComments(module, referenceGroupId, json));
    return json;
  };
}

export interface ReceiveCommentsJson {
  comments: {
    entries: Array<Comment>;
  };
  likesByCurrentUser: any;
  error?: any;
}

/**
 * Add comments into the redux store (typically run by the fetch-methods)
 * @param module
 * @param referenceId
 * @param referenceGroupId
 * @param json
 */
export function receiveComments(
  module: string,
  referenceId: number,
  referenceGroupId: number,
  json: ReceiveCommentsJson
): CommentsActions {
  return {
    type: RECEIVE_COMMENTS,
    module,
    referenceId,
    referenceGroupId,
    receivedAt: Date.now(),
    json
  };
}

/**
 * Request comments from the server
 */
export function requestComments(module: string, referenceId: number, referenceGroupId: number): CommentsActions {
  return {
    type: REQUEST_COMMENTS,
    module,
    referenceId,
    referenceGroupId
  };
}

/**
 * Remove comments from the redux store (but not from the backend storage)
 */
export function invalidateComments({
  module,
  referenceGroupId
}: {
  module: string;
  referenceGroupId: number;
}): CommentsActions {
  return {
    type: INVALIDATE_GROUP_COMMENTS,
    module,
    referenceGroupId
  };
}

/**
 * When loading comments receive is run when the server has responded
 * @param id
 * @param module
 * @param referenceId
 * @param referenceGroupId
 * @param json
 */
export function updateComment(
  id: number,
  module: string,
  referenceId: number,
  referenceGroupId: number,
  json: Comment
): CommentsActions {
  return {
    type: UPDATE_COMMENT,
    id,
    referenceId,
    referenceGroupId,
    module,
    receivedAt: Date.now(),
    json
  };
}

export interface FetchComments {
  module: CommentModule;
  /**
   * Reference id to fetch comments for ex: blogEntryId
   */
  referenceId: number;
  /**
   * Reference group id, for example blog id (optional)
   */
  referenceGroupId?: number;
  /**
   * Page number in paginated collection
   */
  p?: number;
  /**
   * Number of entries per page
   */
  pageSize?: number;

  /**
   * Fetch vote/rating data?
   */
  useVotes?: boolean;
}

/**
 * Requests and receive comments and store them in redux-state
 */
export function fetchComments({
  module,
  referenceId,
  referenceGroupId = 0,
  p = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  useVotes = false
}: FetchComments): Thunk<any> {
  return async (dispatch: any): Promise<any> => {
    dispatch(requestComments(module, referenceId, referenceGroupId));
    try {
      const { comments, likesByCurrentUser, error, voteSummary, votes, hasVoted, myReview } = await dispatch(
        getComments({ module, referenceId, pageSize, p, useVotes })
      );

      if (voteSummary) {
        dispatch(receiveVotes(module ? module : 'comments', voteSummary, votes, hasVoted, myReview));
      }

      return dispatch(
        receiveComments(module, referenceId, referenceGroupId, {
          comments,
          likesByCurrentUser,
          error
        })
      );
    } catch (e) {
      console.error("Couldn't fetchComments: ", e);
    }
  };
}

/**
 * Fetch a single comment
 * @param module
 * @param id
 * @param referenceId
 * @param referenceGroupId
 * @param useVotes
 */
export function fetchComment({
  module,
  id,
  referenceId,
  referenceGroupId = 0,
  useVotes = false
}: {
  module: CommentModule;
  id: number;
  referenceId: number;
  referenceGroupId: number;
  useVotes?: boolean;
}): Thunk<Promise<GetCommentResult>> {
  return async (dispatch: any): Promise<GetCommentResult> => {
    const r: GetCommentResult = await dispatch(getComment({ id, module, useVotes }));

    dispatch(
      receiveComments(module, referenceId, referenceGroupId, {
        comments: {
          entries: r.comment ? [r.comment] : []
        },
        likesByCurrentUser: {}, // FIXME: likes
        error: r.error
      })
    );

    return r;
  };
}

/**
 * Remove a comment from the store.
 * @param module
 * @param id
 * @param referenceId
 * @param referenceGroupId
 */
export function removeCommentFromStore({
  module,
  id,
  referenceId,
  referenceGroupId = 0
}: {
  module: CommentModule;
  id: number;
  referenceId: number;
  referenceGroupId?: number;
}): Thunk<void> {
  return (dispatch: any): void => {
    dispatch({
      type: COMMENT_REMOVED,
      id,
      module,
      referenceId,
      referenceGroupId
    });
  };
}
