// @flow
import {
	CLOSE_REPLY_BOX,
	INVALIDATE_GROUP_COMMENTS,
	OPEN_REPLY_BOX,
	RECIEVE_COMMENTS,
	RECIEVE_GROUP_COMMENTS,
	REQUEST_COMMENTS,
	REQUEST_GROUP_COMMENTS,
	TOGGLE_COMMENT_SECTION,
	TOGGLE_EDIT_COMMENT,
	TOGGLE_REPLY_BOX,
	UPDATE_COMMENT
} from './commentReducer';
import * as blogActions from '../blog/groupBlogEntriesActions';
import {
  Comment,
  getMultipleComments,
  getComments,
  postComment as _postComment, GetMultipleCommentsResult, CommentModule
} from '../comments'
import { Thunk } from '../api';
//import { sendEventToGA } from '../analytics/analyticsFunctions';
import { recieveVotes } from '../vote/voteActions';
import { AnyAction } from 'redux';

const DEFAULT_PAGE_SIZE = 3;

/**
 * Get the key used to look up comments
 * @param action
 * @returns {string}
 */
export function _getCommentsStateKey(action: { module: string; referenceGroupId: string }): string {
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

//When loading comments recieve is run when the server has responded
function recieveGroupComments(module: string, referenceGroupId: number, json: string): AnyAction {
	return {
		type: RECIEVE_GROUP_COMMENTS,
		module,
		referenceGroupId,
		json,
		receievedAt: Date.now()
	};
}

//Request comments from the server
function requestGroupComments(module: string, referenceGroupId: number): AnyAction {
	return {
		type: REQUEST_GROUP_COMMENTS,
		module,
		referenceGroupId
	};
}

//Requests and recieve comments and store them in redux-state
export function fetchMultipleComments({
	module,
	referenceIds,
	referenceGroupId,
	p = 1,
	pageSize = DEFAULT_PAGE_SIZE
}: {
	module: string; // Module See Comments.CommentModule
	referenceIds: [number]; //Array of reference to fetch comments for
	referenceGroupId: number; // Reference group id, for example blog id (optional)
	p?: number; //page number in paginated collection
	pageSize?: number;
}): Thunk<GetMultipleCommentsResult> {
	return async (dispatch: any): Promise<GetMultipleCommentsResult> => {
		dispatch(requestGroupComments(module, referenceGroupId));
		const json = await dispatch(getMultipleComments({ module, referenceIds, pageSize, p }));
		dispatch(recieveGroupComments(module, referenceGroupId, json));
		return json;
	};
}

export interface RecieveCommentsJson {
	comments: {
		entries: [Comment];
	};
	likesByCurrentUser: any;
  error?: any;
}


//When loading comments recieve is run when the server has responded
function recieveComments(
	module: string,
	referenceId: number,
	referenceGroupId: number,
	json: RecieveCommentsJson
): AnyAction {
	return {
		type: RECIEVE_COMMENTS,
		module,
		referenceId,
		referenceGroupId,
		receievedAt: Date.now(),
		json
	};
}

//Request comments from the server
function requestComments(module: string, referenceId: number, referenceGroupId: number): any {
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
	module?: string;
	referenceGroupId: number;
}): any {
	return {
		type: INVALIDATE_GROUP_COMMENTS,
		module,
		referenceGroupId
	};
}

//When loading comments recieve is run when the server has responded
function updateComment(
	id: number,
	module: string,
	referenceId: number,
	referenceGroupId: number,
	json: Comment
): any {
	return {
		type: UPDATE_COMMENT,
		id,
		referenceId,
		referenceGroupId,
		module,
		receievedAt: Date.now(),
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
			const {
				comments,
				likesByCurrentUser,
				error,
				voteSummary,
				votes,
				hasVoted,
				myReview
			} = await dispatch(getComments({ module, referenceId, pageSize, p, useVotes }));

			if (voteSummary) {
				dispatch(
					recieveVotes(module ? module : 'comments', voteSummary, votes, hasVoted, myReview)
				);
			}

			return dispatch(
				recieveComments(module, referenceId, referenceGroupId, {
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
 * Post a comment
 * @param id
 * @param referenceId
 * @param referenceGroupId
 * @param module
 * @param parentId
 * @param body
 */
export function postComment({
	id,
	referenceId,
	referenceGroupId,
	module,
	parentId,
	body
}: {
	id?: number; // Post id
	referenceId: number; // Reference id to fetch comments for
	referenceGroupId: number; // Reference group id, for example blog id  (optional)
	module: CommentModule; // Module See Comments.CommentModule
	body: string; //The body text
	parentId?: number; //The id of the comment you want to reply on
}): Thunk<any> {
	return async (dispatch: any, getState): Promise<any> => {
		dispatch(blogActions.closeWriteCommentOrEdit());

		let typeOfComment = '';
		if (!!id && id > 0) {
			//This is an edit of a comment, close the open editor.
			const response = await dispatch(
				_postComment({
					commentId: id,
					referenceId,
					referenceGroupId,
					module,
					parentId,
					body
				})
			);
			const commentJson = dispatch(
				updateComment(id, module, referenceId, referenceGroupId, response.comment)
			);
			dispatch(toggleEditComment({ id }));
			// FIXME: readd ga
			//dispatch(sendEventToGA(gaEditCommentEventObject({ comment: response.comment })));
			typeOfComment = 'edit';
			return { ...commentJson, typeOfComment };
		} else {
			typeOfComment = 'new';
			//This is a new comment
			if (parentId && isFinite(parentId) && getState().openReplyBoxes.indexOf(parentId) !== -1) {
				//This is a reply and close the reply editor. This needs to be done before postcomment...
				dispatch(toggleReplyEditor({ parentId: parseInt(parentId + '') }));
				typeOfComment = 'reply';
			}
			const response = await dispatch(
				_postComment({
					commentId: id,
					referenceId,
					referenceGroupId,
					module,
					parentId,
					body
				})
			);

			const commentJson = dispatch(
				recieveComments(module, referenceId, referenceGroupId, {
					comments: {
						entries: [response.comment]
					},
					likesByCurrentUser: {}
				})
			);
			// FIXME: Re-add ga
			if (parentId && isFinite(parentId) && response.comment.id !== parentId) {
				//This is a reply and close the reply editor
				//dispatch(sendEventToGA(gaReplyEventObject({ comment: response.comment })));
			} else {
				//This is a plain new comment (not a reply)
				//dispatch(sendEventToGA(gaCommentEventObject({ comment: response.comment })));
			}
			return { ...commentJson, typeOfComment };
		}
	};
}

//Toggle Reply editor for selected parent comment id
export function toggleEditComment({
	id
}: {
	id: number; //Comment Id
}): AnyAction {
	return {
		type: TOGGLE_EDIT_COMMENT,
		id
	};
}

//Toggle Reply editor for selected parent comment id
export function toggleReplyEditor({
	parentId
}: {
	parentId: number; //Parent Comment Id
}): AnyAction {
	return {
		type: TOGGLE_REPLY_BOX,
		parentId
	};
}

//Open Reply editor for selected parent comment id
export function openReplyEditor({
	parentId
}: {
	parentId: number; //Parent Comment Id
}): AnyAction {
	return {
		type: OPEN_REPLY_BOX,
		parentId
	};
}

//close Reply editor for selected parent comment id
export function closeReplyEditor({
	parentId
}: {
	parentId: number; //Parent Comment Id
}): AnyAction {
	return {
		type: CLOSE_REPLY_BOX,
		parentId
	};
}

//Toggle Reply editor for selected parent comment id
export function toggleCommentSection(): AnyAction {
	return {
		type: TOGGLE_COMMENT_SECTION
	};
}
