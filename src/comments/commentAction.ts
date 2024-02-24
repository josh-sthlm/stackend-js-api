import {
  COMMENT_REMOVED,
  CommentCollectionState,
  CommentsActions,
  CommentsState,
  INVALIDATE_GROUP_COMMENTS,
  RECEIVE_COMMENTS,
  RECEIVE_GROUP_COMMENTS,
  REQUEST_COMMENTS,
  REQUEST_GROUP_COMMENTS,
  UPDATE_COMMENT
} from "./commentReducer";

import {
  Comment,
  CommentModule,
  CommentSortCriteria,
  getComment,
  GetCommentResult,
  getComments,
  getMultipleComments,
  GetMultipleCommentsResult
} from "./index";
import { Thunk, XcapJsonErrors } from "../api";
import SortOrder from "../api/SortOrder";
import { receiveVotes } from "../vote/voteActions";
import { LikeDataMap, LikesByCurrentUser } from "../like";
import { receiveLikes } from "../like/likeActions";

/**
 * The default page size: 3
 */
const DEFAULT_PAGE_SIZE = 3;

/**
 * Get the key used to look up comments
 * @param action
 * @returns {string}
 */
export function _getCommentsStateKey<
  T extends {
    module: CommentModule;
    referenceGroupId: number;
    commentSortCriteria: CommentSortCriteria;
    order: SortOrder;
  }
>(action: T): string {
  return getCommentsStateKey(action.module, action.referenceGroupId, action.commentSortCriteria, action.order);
}

/**
 * Get the key used to look up comments
 * @param module
 * @param referenceGroupId
 * @param commentSortCriteria
 * @param order
 * @returns {string}
 */
export function getCommentsStateKey(
  module: CommentModule,
  referenceGroupId: number,
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): string {
  return module + ':' + referenceGroupId + ':' + commentSortCriteria + ':' + order;
}

/**
 * Add comments to the redux store (typically run by the fetch-methods)
 * @param module
 * @param referenceGroupId
 * @param json
 * @param commentSortCriteria
 * @param order
 */
export function receiveGroupComments(
  module: CommentModule,
  referenceGroupId: number,
  json: {
    comments: any;
    likesByCurrentUser: any;
  },
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): CommentsActions {
  return {
    type: RECEIVE_GROUP_COMMENTS,
    module,
    referenceGroupId,
    commentSortCriteria,
    order,
    json,
    receivedAt: Date.now()
  };
}

/**
 * Request comments from the server
 * @param module
 * @param referenceGroupId
 * @param commentSortCriteria
 * @param order
 */
export function requestGroupComments(
  module: CommentModule,
  referenceGroupId: number,
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): CommentsActions {
  return {
    type: REQUEST_GROUP_COMMENTS,
    module,
    referenceGroupId,
    commentSortCriteria,
    order
  };
}

/**
 * Requests and receive comments and store them in redux-state
 * @param module
 * @param referenceIds
 * @param referenceGroupId
 * @param p
 * @param pageSize
 * @param commentSortCriteria
 * @param order
 */
export function fetchMultipleComments({
  module,
  referenceIds,
  referenceGroupId,
  p = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  commentSortCriteria = CommentSortCriteria.CREATED_WITH_REPLIES,
  order = SortOrder.DESCENDING
}: {
  module: CommentModule; // Module See Comments.CommentModule
  referenceIds: Array<number>; //Array of reference to fetch comments for
  referenceGroupId: number; // Reference group id, for example blog id (optional)
  p?: number; //page number in paginated collection
  pageSize?: number;
  commentSortCriteria?: CommentSortCriteria;
  order?: SortOrder.DESCENDING;
}): Thunk<Promise<GetMultipleCommentsResult>> {
  return async (dispatch: any): Promise<GetMultipleCommentsResult> => {
    dispatch(requestGroupComments(module, referenceGroupId, commentSortCriteria, order));
    const json = await dispatch(
      getMultipleComments({ module, referenceIds, pageSize, p, sortCriteria: commentSortCriteria, order })
    );
    dispatch(receiveGroupComments(module, referenceGroupId, json, commentSortCriteria, order));
    dispatch(receiveCommentLikes(json));
    return json;
  };
}

export interface ReceiveCommentsJson {
  comments: {
    entries: Array<Comment>;
  };
  likesByCurrentUser: LikesByCurrentUser;
  error?: XcapJsonErrors;
}

/**
 * Add comments into the redux store (typically run by the fetch-methods)
 * @param module
 * @param referenceId
 * @param referenceGroupId
 * @param json
 * @param commentSortCriteria
 * @param order
 */
export function receiveComments(
  module: CommentModule,
  referenceId: number,
  referenceGroupId: number,
  json: ReceiveCommentsJson,
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): CommentsActions {
  return {
    type: RECEIVE_COMMENTS,
    module,
    referenceId,
    referenceGroupId,
    commentSortCriteria,
    order,
    receivedAt: Date.now(),
    json
  };
}

/**
 * Request comments from the server
 */
export function requestComments(
  module: CommentModule,
  referenceId: number,
  referenceGroupId: number,
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): CommentsActions {
  return {
    type: REQUEST_COMMENTS,
    module,
    referenceId,
    referenceGroupId,
    commentSortCriteria,
    order
  };
}

/**
 * Remove comments from the redux store (but not from the backend storage)
 */
export function invalidateComments({
  module,
  referenceGroupId,
  commentSortCriteria,
  order
}: {
  module: CommentModule;
  referenceGroupId: number;
  commentSortCriteria: CommentSortCriteria;
  order: SortOrder;
}): CommentsActions {
  return {
    type: INVALIDATE_GROUP_COMMENTS,
    module,
    referenceGroupId,
    commentSortCriteria,
    order
  };
}

/**
 * When loading comments receive is run when the server has responded
 * @param id
 * @param module
 * @param referenceId
 * @param referenceGroupId
 * @param json
 * @param commentSortCriteria
 * @param order
 */
export function updateComment(
  id: number,
  module: CommentModule,
  referenceId: number,
  referenceGroupId: number,
  json: Comment,
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): CommentsActions {
  return {
    type: UPDATE_COMMENT,
    id,
    referenceId,
    referenceGroupId,
    commentSortCriteria,
    order,
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
   * Sort
   */
  commentSortCriteria?: CommentSortCriteria;

  /**
   * Sort order
   */
  order?: SortOrder;

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
  commentSortCriteria = CommentSortCriteria.CREATED_WITH_REPLIES,
  order = SortOrder.DESCENDING,
  p = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  useVotes = false
}: FetchComments): Thunk<Promise<GetCommentResult | null>> {
  return async (dispatch: any): Promise<GetCommentResult | null> => {
    dispatch(requestComments(module, referenceId, referenceGroupId, commentSortCriteria, order));

    const r = await dispatch(
      getComments({ module, referenceId, pageSize, p, useVotes, sortCriteria: commentSortCriteria, order })
    );

    const { comments, likesByCurrentUser, error, voteSummary, votes, hasVoted, myReview } = r;
    if (voteSummary) {
      dispatch(receiveVotes(module ? module : 'comments', voteSummary, votes, hasVoted, myReview));
    }

    const json = { comments, likesByCurrentUser, error };

    dispatch(receiveCommentLikes(json));
    dispatch(receiveComments(module, referenceId, referenceGroupId, json, commentSortCriteria, order));

    return r;
  };
}

/**
 * Fetch a single comment
 * @param module
 * @param id
 * @param referenceId
 * @param referenceGroupId
 * @param commentSortCriteria
 * @param order
 * @param useVotes
 */
export function fetchComment({
  module,
  id,
  referenceId,
  referenceGroupId = 0,
  commentSortCriteria = CommentSortCriteria.CREATED_WITH_REPLIES,
  order = SortOrder.DESCENDING,
  useVotes = false
}: {
  module: CommentModule;
  id: number;
  referenceId: number;
  referenceGroupId: number;
  commentSortCriteria?: CommentSortCriteria;
  order?: SortOrder;
  useVotes?: boolean;
}): Thunk<Promise<GetCommentResult>> {
  return async (dispatch: any): Promise<GetCommentResult> => {
    const r: GetCommentResult = await dispatch(getComment({ id, module, useVotes }));

    dispatch(
      receiveComments(
        module,
        referenceId,
        referenceGroupId,
        {
          comments: {
            entries: r.comment ? [r.comment] : []
          },
          likesByCurrentUser: {}, // FIXME: likes
          error: r.error
        },
        commentSortCriteria,
        order
      )
    );

    // FIXME: receiveCommentLikes

    return r;
  };
}

/**
 * Remove a comment from the store.
 * @param module
 * @param id
 * @param referenceId
 * @param referenceGroupId
 * @param commentSortCriteria
 * @param order
 */
export function removeCommentFromStore({
  module,
  id,
  referenceId,
  referenceGroupId = 0,
  commentSortCriteria,
  order
}: {
  module: CommentModule;
  id: number;
  referenceId: number;
  referenceGroupId?: number;
  commentSortCriteria: CommentSortCriteria;
  order: SortOrder;
}): Thunk<void> {
  return (dispatch: any): void => {
    dispatch({
      type: COMMENT_REMOVED,
      id,
      module,
      referenceId,
      referenceGroupId,
      commentSortCriteria,
      order
    });
  };
}

/**
 * Get comments from the redux store
 * @param commentsState
 * @param commentType
 * @param referenceGroupId
 * @param referenceId
 * @param commentSortCriteria
 * @param order
 * @returns a CommentCollectionState or null, if not loaded
 */
export function getCommentsFromStore(
  commentsState: CommentsState,
  commentType: CommentModule,
  referenceGroupId: number,
  referenceId: number,
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): CommentCollectionState | null {
  const key = getCommentsStateKey(commentType, referenceGroupId, commentSortCriteria, order);
  const x = commentsState[key]?.json?.comments;
  if (!x) {
    return null;
  }
  const y: CommentCollectionState = x[referenceId];
  return y ? y : null;
}

/**
 * Get the number of minutes to edit a comment, or -1 for eternal.
 * @param commentsState
 * @param commentType
 * @param referenceGroupId
 * @param referenceId
 * @param commentSortCriteria
 * @param order
 */
export function getMinutesToEdit(
  commentsState: CommentsState,
  commentType: CommentModule,
  referenceGroupId: number,
  referenceId: number,
  commentSortCriteria: CommentSortCriteria,
  order: SortOrder
): number {
  const key = getCommentsStateKey(commentType, referenceGroupId, commentSortCriteria, order);
  const json = commentsState[key]?.json;
  if (json) {
    const minutesToEdit = (json as any)?.minutesToEdit; // FIXME: not included in interface
    if (typeof minutesToEdit === 'number') {
      return minutesToEdit;
    }
  }

  return -1;
}

/**
 * Update the comments likes in the redux store
 * @param json
 */
export function receiveCommentLikes(json: ReceiveCommentsJson): Thunk<void> {
  const likeDataMap: LikeDataMap = {};

  if (json?.comments?.entries) {
    json.comments.entries.forEach(c => {
      likeDataMap[c.obfuscatedReference] = {
        likes: c.numberOfLikes,
        likedByCurrentUser: json.likesByCurrentUser[c.id] || false
      };
    });
  }

  return (dispatch: any): void => dispatch(receiveLikes(likeDataMap));
}
