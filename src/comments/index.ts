// @flow
import { getJson, post, XcapJsonResult, Thunk, isRunningInBrowser, XcapOptionalParameters } from '../api';
import SortOrder from '../api/SortOrder';
import UserApprovalStatus from '../api/UserApprovalStatus';
//import * as groupApi from './group';
//import * as gaFunctions from '../functions/gaFunctions';
import { LikesByCurrentUser } from '../like';
import { PaginatedCollection } from '../api/PaginatedCollection';
import CreatedDateAware from '../api/CreatedDateAware';
import XcapObject from '../api/XcapObject';
import CreatorUserIdAware from '../api/CreatorUserIdAware';
import ModifiedDateAware from '../api/ModifiedDateAware';
import ModifiedByUserIdAware from '../api/ModifiedByUserIdAware';
import PermalinkAware from '../api/PermalinkAware';
import ModerationAware from '../api/ModerationAware';
import ExpirationDateAware from '../api/ExpirationDateAware';
import ReferenceIdAware from '../api/ReferenceIdAware';
import ReferenceGroupIdAware from '../api/ReferenceGroupIdAware';
import UserApprovalAware from '../api/UserApprovalAware';
import ReferenceAble from '../api/ReferenceAble';

/**
 * Comment class name
 */
export const COMMENT_CLASS = 'se.josh.xcap.comment.impl.CommentImpl';

/**
 * Comment manager component class name
 */
export const COMPONENT_CLASS = 'se.josh.xcap.comment.CommentManager';

/**
 * Component name
 */
export const COMPONENT_NAME = 'comment';

/**
 * Definition of a comment
 */
export interface Comment
  extends XcapObject,
    CreatorUserIdAware,
    CreatedDateAware,
    ModifiedDateAware,
    ModifiedByUserIdAware,
    PermalinkAware,
    ModerationAware,
    ExpirationDateAware,
    ReferenceIdAware<XcapObject>,
    ReferenceGroupIdAware,
    UserApprovalAware,
    ReferenceAble {
  __type: 'se.josh.xcap.comment.impl.CommentImpl';
  parentId: number /** parent id if reply */;
  subject: string;
  body: string;
  plainTextBody: string;
  numberOfLikes: number;
  type?: string; // (hack) Used in CommentList to add a editor to the list of comments
}

/**
 * Sort criteria
 */
export enum CommentSortCriteria {
  /**
   * Sort by creation date.
   */
  CREATED = 'CREATED',

  /**
   * Sort after creation date, but preserving replies. The commenting system
   * supports one level of replies.
   */
  CREATED_WITH_REPLIES = 'CREATED_WITH_REPLIES'
}

/**
 * Is this comments instance tied to another function, or free standing?
 */
export enum CommentModule {
  /**
   * Free standing comments
   */
  GENERIC = '',

  /**
   * Comments on blog entries
   */
  BLOG = 'blog'
}

export interface BaseCommentRequest extends XcapOptionalParameters {
  module: CommentModule;
  useVotes?: boolean;
}

export interface ListRequest extends BaseCommentRequest {
  referenceId: number;
  p?: number | null;
  pageSize?: number | null;
  sortCriteria?: CommentSortCriteria;
  order?: SortOrder;
}

export interface BaseCommentsResult extends XcapJsonResult {
  likesByCurrentUser: LikesByCurrentUser;
  //minutesToEdit: number;
  //commentsAllowed: boolean;
}

export interface GetCommentResult extends BaseCommentsResult {
  comment: Comment | null;
}

export interface GetRequest extends BaseCommentRequest {
  id: number;
}

/**
 * Get a single comment
 * @param id
 * @param module
 * @param referenceId
 * @param useVotes
 */
export function getComment({
  id,
  module = CommentModule.GENERIC,
  useVotes = false
}: GetRequest): Thunk<Promise<GetCommentResult>> {
  return getJson({
    url: (module !== CommentModule.GENERIC ? '/' + module : '') + '/comments/get',
    parameters: arguments
  });
}

export interface GetCommentsResult extends BaseCommentsResult {
  comments: PaginatedCollection<Comment>;
  minutesToEdit: number;
  commentsAllowed: boolean;
}

/**
 * Get comments for a reference id.
 *
 * @param module {CommentModule} optional module: "blog" to get blog comments
 * @param referenceId Reference id (required)
 * @param sortCriteria {CommentSortCriteria} (optional)
 * @param order {SortOrder} (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @param useVotes Fetch votes (optional)
 */
export function getComments({
  module = CommentModule.GENERIC,
  referenceId,
  p = null,
  pageSize = null,
  sortCriteria = CommentSortCriteria.CREATED_WITH_REPLIES,
  order = SortOrder.DESCENDING,
  useVotes = false
}: ListRequest): Thunk<Promise<GetCommentsResult>> {
  if (isNaN(referenceId)) {
    throw Error('Parameter referenceId is required');
  }

  return getJson({
    url: (module !== CommentModule.GENERIC ? '/' + module : '') + '/comments/list',
    parameters: arguments
  });
}

export interface GetMultipleCommentsResult extends XcapJsonResult {
  likesByCurrentUser: LikesByCurrentUser;

  /** Maps from reference id to comments */
  comments: { [referenceId: string]: PaginatedCollection<Comment> };

  minutesToEdit: number;
}

/**
 * Get multiple comments given an array of reference ids.
 *
 * Pagination is not supported since we deal with multiple collections.
 * However, the page size can be set and applies to all collections.
 *
 * The result is returned as a map from reference Ids to PaginatedCollection of comments.
 *
 * Pagination for the separate comment lists can be implemented using {@link getComments}.
 *
 * @param module {CommentModule} optional module: "blog" to get blog comments
 * @param referenceIds {Array} of referenceIds
 * @param sortCriteria
 * @param order
 * @param p
 * @param pageSize
 */
export function getMultipleComments({
  module = CommentModule.GENERIC,
  referenceIds,
  p = null,
  pageSize = null,
  sortCriteria = CommentSortCriteria.CREATED_WITH_REPLIES,
  order = SortOrder.DESCENDING
}: {
  module: CommentModule;
  referenceIds: Array<number>;
  p: number | null | undefined;
  pageSize: number | null | undefined;
  sortCriteria?: CommentSortCriteria;
  order?: SortOrder;
}): Thunk<Promise<GetMultipleCommentsResult>> {
  if (!Array.isArray(referenceIds)) {
    throw Error('Parameter referenceIds is required');
  }
  return getJson({
    url: (module !== CommentModule.GENERIC ? '/' + module : '') + '/comments/list-multiple',
    parameters: arguments
  });
}

export interface PostCommentResult extends XcapJsonResult {
  comment: Comment;
}

/**
 * Post a comment.
 * @param commentId {number} Comment id, available on edit.. (Optional)
 * @param module {CommentModule} optional module: "blog" to get blog comments
 * @param referenceId {number} Reference id
 * @param referenceGroupId Optional reference group id
 * @param parentId Id of parent comment, if reply (Optional)
 * @param subject
 * @param body Body HTML. Up to 64KB.
 * @param extraInformation Application specific text.
 * @param referenceUrl Reference url
 */
export function postComment({
  commentId,
  referenceId,
  referenceGroupId = 0,
  module = CommentModule.GENERIC,
  parentId = 0,
  subject,
  body,
  extraInformation,
  referenceUrl
}: {
  commentId?: number;
  referenceId: number;
  referenceGroupId?: number;
  module: CommentModule;
  parentId?: number;
  subject?: string;
  body: string;
  extraInformation?: any;
  referenceUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<PostCommentResult>> {
  // Add referenceUrl, if not set
  if (!referenceUrl && isRunningInBrowser()) {
    arguments[0].referenceUrl = window.location.href;
  }

  return post({
    url: (module !== CommentModule.GENERIC ? '/' + module : '') + '/comments/post',
    parameters: arguments
  });
}

/**
 * Set user approval status of a comment
 * @param id
 * @param status
 * @param commentModule
 * @param moduleId, optional module id for checking elevated privileges
 */
export function setCommentUserApprovalStatus({
  id,
  status,
  commentModule = CommentModule.GENERIC,
  moduleId
}: {
  id: number;
  status: UserApprovalStatus;
  commentModule: CommentModule;
  moduleId?: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: (commentModule !== CommentModule.GENERIC ? '/' + commentModule : '') + '/comments/moderate',
    parameters: arguments
  });
}
