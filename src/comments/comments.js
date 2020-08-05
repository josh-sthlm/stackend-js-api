// @flow
import { getJson, post, SortOrder, type XcapJsonResult } from '../api.ts';
import * as groupApi from '../group/group.js';
import * as user from '../user/user.ts';
import * as gaFunctions from '../functions/gaFunctions.js';
import { type Thunk } from '../store.ts';
import { type LikesByCurrentUser } from '../like.ts';
import { type PaginatedCollection } from '../PaginatedCollection.ts';

declare var __xcapRunningServerSide: any;

/**
 * Comment class name
 */
export const COMMENT_CLASS: string = 'se.josh.xcap.comment.impl.CommentImpl';

/**
 * Comment manager component class name
 */
export const COMPONENT_CLASS: string = 'se.josh.xcap.comment.CommentManager';

/**
 * Component name
 */
export const COMPONENT_NAME: string = 'comment';

/**
 * Definition of a comment
 */
export type Comment = {
	__type: 'se.josh.xcap.comment.impl.CommentImpl',
	id: number,
	parentId: number /** parent id if reply */,
	permalink: string,
	creatorUserId: number,
	creatorUserRef: user.User,
	createdDate: Date,
	modifiedDate: number,
	modifiedByUserId: number,
	modifiedByUserRef?: user.User,
	referenceGroupId: number,
	referenceId: number /** For instance blogEntryId */,
	referenceRef: any,
	userApprovalStatus: string,
	modStatus: string,
	ttl: number,
	expiresDate: number,
	obfuscatedReference: string,
	subject: string,
	body: string,
	plainTextBody: string,
	numberOfLikes: number,
	type?: string // (hack) Used in CommentList to add a editor to the list of comments
};

/**
 * Sort criteria
 */
export const CommentSortCriteria = {
	/**
	 * Sort by creation date.
	 */
	CREATED: 'CREATED',

	/**
	 * Sort after creation date, but preserving replies. The commenting system
	 * supports one level of replies.
	 */
	CREATED_WITH_REPLIES: 'CREATED_WITH_REPLIES'
};

export type commentModule = '' | 'blog';

/**
 *
 */
export const CommentModule: {
	GENERIC: commentModule,
	BLOG: commentModule
} = {
	/**
	 * Generic comment module
	 */
	GENERIC: '',

	/**
	 * Blog comment module
	 */
	BLOG: 'blog'
};

export type GetCommentsResult = XcapJsonResult & {
	likesByCurrentUser: LikesByCurrentUser,
	comments: PaginatedCollection<Comment>,
	minutesToEdit: number,
	commentsAllowed: boolean
};

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
}: any): Thunk<GetCommentsResult> {
	if (isNaN(referenceId)) {
		throw 'Parameter referenceId is required';
	}

	return getJson({
		url: (module !== CommentModule.GENERIC ? '/' + module : '') + '/comments/list',
		parameters: arguments
	});
}

export type GetMultipleCommentsResult = XcapJsonResult & {
	likesByCurrentUser: LikesByCurrentUser,

	/** Maps from reference id to comments */
	comments: Map<string, PaginatedCollection<Comment>>,

	minutesToEdit: number
};

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
 * @param pageSize
 */
export function getMultipleComments({
	module = CommentModule.GENERIC,
	referenceIds,
	pageSize = null,
	sortCriteria = CommentSortCriteria.CREATED_WITH_REPLIES,
	order = SortOrder.DESCENDING
}: any): Thunk<GetMultipleCommentsResult> {
	if (!Array.isArray(referenceIds)) {
		throw 'Parameter referenceIds is required';
	}

	return getJson({
		url: (module !== CommentModule.GENERIC ? '/' + module : '') + '/comments/list-multiple',
		parameters: arguments
	});
}

export type PostCommentResult = XcapJsonResult & {
	comment: Comment
};

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
 * @param moduleId Stackend module id
 * @returns {Promise}
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
	commentId?: number,
	referenceId: number,
	referenceGroupId?: number,
	module: commentModule,
	parentId?: number,
	subject?: string,
	body: string,
	extraInformation?: any,
	referenceUrl?: string
}): Thunk<PostCommentResult> {
	// Add referenceUrl, if not set
	if (!referenceUrl && typeof __xcapRunningServerSide === 'undefined') {
		arguments[0].referenceUrl = window.location.href;
	}

	return post({
		url: (module !== CommentModule.GENERIC ? '/' + module : '') + '/comments/post',
		parameters: arguments
	});
}

type GaTrackNewComment = {
	comment: Comment
};

export function gaCommentEventObject({ comment }: GaTrackNewComment) {
	return getEventObject('comment', comment);
}

export function gaEditCommentEventObject({ comment }: GaTrackNewComment) {
	return getEventObject('edit_comment', comment);
}

export function gaReplyEventObject({ comment }: GaTrackNewComment) {
	return getEventObject('comment_reply', comment);
}

export function getEventObject(eventAction: any, comment: any) {
	const { eventLabel, eventCategory } = getGALabels({ comment });
	return {
		event_action: eventAction,
		event_label: eventLabel,
		event_category: eventCategory
	};
}

function getGALabels({ comment }: GaTrackNewComment) {
	const objectType = `${comment.__type.substring(comment.__type.lastIndexOf('.') + 1)}`;
	//FIXME: hardcoded that comments is only on blogEntries
	const blogEntry = comment.referenceRef;
	if (!!blogEntry) {
		const { groupName, groupType, groupTypeEnum } = groupApi.getGAGroupData({
			blog: blogEntry.blogRef
		});
		const blogEntryName = !!blogEntry.permalink ? blogEntry.permalink : '';
		const eventCategory = `${gaFunctions.getGaObjectName({
			object: comment.__type,
			relatedToObject: groupType
		})}_(${objectType}_${groupTypeEnum})`;
		const eventLabel = `${groupName}_${blogEntryName}_(${blogEntry.blogId}_${blogEntry.id})`;
		return { eventLabel, eventCategory };
	} else {
		//FIXME: create backup tracking
		console.warn("using fallback tracking of new comment, didn't find blogEntry");
		const eventCategory = gaFunctions.getGaObjectName({
			object: comment.__type,
			relatedToObject: 'commentModule'
		});
		const eventLabel = `id:${comment.id},parentId:${comment.parentId}`; //FIXME: add proper label for stackend
		return { eventLabel, eventCategory };
	}
}
