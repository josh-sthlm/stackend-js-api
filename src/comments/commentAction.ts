import {
  CommentsActions,
  INVALIDATE_GROUP_COMMENTS,
  RECEIVE_COMMENTS,
  RECEIVE_GROUP_COMMENTS,
  REQUEST_COMMENTS,
  REQUEST_GROUP_COMMENTS,
  UPDATE_COMMENT
} from './commentReducer';

import { Comment, getMultipleComments, getComments, GetMultipleCommentsResult, CommentModule } from './index';
import { Thunk } from '../api';
import { receiveVotes } from '../vote/voteActions';

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
 * Load comments in a group and for a specific blogEntry
 *
 * @since 15 fen 2017
 * @author pelle
 */

//When loading comments receive is run when the server has responded
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

//Request comments from the server
export function requestGroupComments(module: string, referenceGroupId: number): CommentsActions {
  return {
    type: REQUEST_GROUP_COMMENTS,
    module,
    referenceGroupId
  };
}

//Requests and receive comments and store them in redux-state
export function fetchMultipleComments({
  module,
  referenceIds,
  referenceGroupId,
  p = 1,
  pageSize = DEFAULT_PAGE_SIZE
}: {
  module: string; // Module See Comments.CommentModule
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

//When loading comments receive is run when the server has responded
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

//Request comments from the server
export function requestComments(module: string, referenceId: number, referenceGroupId: number): CommentsActions {
  return {
    type: REQUEST_COMMENTS,
    module,
    referenceId,
    referenceGroupId
  };
}

//Invalidate group-comments from the server
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

//When loading comments receive is run when the server has responded
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
  referenceId: number; // Reference id to fetch comments for ex: blogEntryId
  referenceGroupId?: number; // Reference group id, for example blog id (optional)
  p?: number; //page number in paginated collection
  pageSize?: number;
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
