// @flow
import _ from 'lodash';
import { List } from 'immutable';
import update from 'immutability-helper';
import * as commentAction from './commentAction';
import * as commentsApi from '../comments';
import { emptyPaginatedCollection } from '../PaginatedCollection';

//Action Type
export const REQUEST_GROUP_COMMENTS = 'REQUEST_GROUP_COMMENTS';
export const RECIEVE_GROUP_COMMENTS = 'RECIEVE_GROUP_COMMENTS';
export const REQUEST_COMMENTS = 'REQUEST_COMMENTS';
export const RECIEVE_COMMENTS = 'RECIEVE_COMMENTS';
export const UPDATE_COMMENT = 'UPDATE_COMMENT';
export const INVALIDATE_GROUP_COMMENTS = 'INVALIDATE_GROUP_COMMENTS';
export const TOGGLE_REPLY_BOX = 'TOGGLE_REPLY_BOX';
export const OPEN_REPLY_BOX = 'OPEN_REPLY_BOX';
export const CLOSE_REPLY_BOX = 'CLOSE_REPLY_BOX';
export const OPEN_COMMENT_SECTION = 'OPEN_COMMENT_SECTION';
export const CLOSE_COMMENT_SECTION = 'CLOSE_COMMENT_SECTION';
export const TOGGLE_COMMENT_SECTION = 'TOGGLE_COMMENT_SECTION';
export const TOGGLE_EDIT_COMMENT = 'TOGGLE_EDIT_COMMENT';

export type commentActionType =
	| 'REQUEST_GROUP_COMMENTS'
	| 'RECIEVE_GROUP_COMMENTS'
	| 'INVALIDATE_GROUP_COMMENTS'
	| 'REQUEST_COMMENTS'
	| 'RECIEVE_COMMENTS'
	| 'UPDATE_COMMENT';

export type commentsAction =
	| { type: 'REQUEST_GROUP_COMMENTS', module: string, referenceGroupId: number }
	| {
			type: 'RECIEVE_GROUP_COMMENTS',
			module: string,
			referenceGroupId: number,
			json: {
				comments: any,
				likesByCurrentUser: any
			}
	  }
	| { type: 'INVALIDATE_GROUP_COMMENTS', module: string, referenceGroupId: number }
	| { type: 'REQUEST_COMMENTS', module: string, referenceId: number, referenceGroupId: number }
	| {
			type: 'RECIEVE_COMMENTS',
			module: string,
			referenceId: number,
			referenceGroupId: number,
			json: commentAction.RecieveCommentsJson
	  }
	| {
			type: 'UPDATE_COMMENT',
			id: number,
			module: string,
			referenceId: number,
			referenceGroupId: number,
			json: commentsApi.Comment
	  };

export type openReplyBoxesActionType = 'TOGGLE_REPLY_BOX' | 'OPEN_REPLY_BOX' | 'CLOSE_REPLY_BOX';
//TODO: implement //export type openReplyBoxesAction = {

export type openCommentSectionActionType =
	| 'OPEN_COMMENT_SECTION'
	| 'CLOSE_COMMENT_SECTION'
	| 'TOGGLE_COMMENT_SECTION';
//TODO: implement //export type openCommentSectionAction = {

export type openEditCommentActionType = 'TOGGLE_EDIT_COMMENT';
//TODO: implement //export type openEditCommentAction = {

interface State {
	[blogkey: string]: {
		isFetching: boolean,
		didInvalidate: boolean,
		lastUpdated: number,
		json: {
			likesByCurrentUser: any,
			comments: {
				[id: number]: {
					isFetching: boolean,
					didInvalidate: boolean,
					lastUpdated: number,
					entries: Array<commentsApi.Comment>
				}
			},
			error?: string
		}
	}
}

//Reducer
export function GroupComments(state: State = {}, action: commentsAction) {
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

		case RECIEVE_GROUP_COMMENTS:
			key = commentAction._getCommentsStateKey(action);

			if (!!state[key].json && state[key].json !== '') {
				let json = state[key].json;
				json.comments = Object.assign({}, state[key].json.comments, action.json.comments);
				json.likesByCurrentUser = Object.assign(
					{},
					state[key].json.likesByCurrentUser,
					action.json.likesByCurrentUser
				);

				return Object.assign({}, state, {
					[key]: {
						isFetching: false,
						didInvalidate: false,
						lastUpdated: action.receievedAt,
						json
					}
				});
			} else {
				return Object.assign({}, state, {
					[key]: {
						isFetching: false,
						didInvalidate: false,
						lastUpdated: action.receievedAt,
						json: action.json
					}
				});
			}

		case REQUEST_COMMENTS: {
			key = commentAction._getCommentsStateKey(action);

			const requestBlogEntryComments = Object.assign(
				{},
				!!state[key] ? state[key].json.comments[action.referenceId] : {},
				{
					isFetching: true,
					didInvalidate: false
				}
			);

			const requestBlogEntiesWithComments = Object.assign(
				{},
				!!state[key] ? state[key].json.comments : {},
				{ [action.referenceId]: requestBlogEntryComments }
			);

			let likesByCurrentUser = Object.assign(
				{},
				!!state[key] ? state[key].json.likesByCurrentUser : {}
			);

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

		case RECIEVE_COMMENTS: {
			const { referenceId } = action;
			key = commentAction._getCommentsStateKey(action);
			if (action.json.error) {
				return update(state, {
					[key]: {
						isFetching: { $set: false },
						didInvalidate: { $set: false },
						lastUpdated: { $set: action.receievedAt },
						json: {
							comments: {
								[referenceId]: {
									$set: {
										isFetching: false,
										didInvalidate: false,
										lastUpdated: action.receievedAt,
										error: action.json.error
									}
								}
							}
						}
					}
				});
			}

			let origComments = _.get(state, `[${key}].json.comments[${referenceId}].entries`, []);
			let newComments: Array<Comment> = [];
			action.json.comments.entries.forEach(e => {
				let orig = origComments.find(o => o.id === e.id);
				if (orig) {
					_.assign(orig, e);
				} else {
					newComments.push(e);
				}
			});

			const referenceIdUniqueComments = _.concat(origComments, newComments);

			const pagination = _.get(
				state,
				`[${key}].json.comments[${referenceId}]`,
				emptyPaginatedCollection()
			);
			delete pagination['entries'];
			pagination.totalSize += action.json.comments.entries.length;

			let x = update(action.json.comments, {
				isFetching: { $set: false },
				didInvalidate: { $set: false },
				lastUpdated: { $set: action.receievedAt },
				entries: { $set: referenceIdUniqueComments }
			});

			// Work around for $merge not beeing able to $set
			let first =
				typeof state[key] === 'undefined' ||
				typeof state[key].json.comments[referenceId] === 'undefined';
			let op = first ? '$set' : '$merge';

			return update(state, {
				[key]: {
					isFetching: { $set: false },
					didInvalidate: { $set: false },
					lastUpdated: { $set: action.receievedAt },
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
					lastUpdated: { $set: action.receievedAt },
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

export function openReplyBoxes(
	state: Array<number> = [],
	action: { type: string, parentId: number }
) {
	switch (action.type) {
		case OPEN_REPLY_BOX:
			return List(state).concat([action.parentId]);

		case CLOSE_REPLY_BOX:
			return List(state).delete(state.indexOf(action.parentId));

		case TOGGLE_REPLY_BOX:
			//if reply box is closed
			if (state.indexOf(action.parentId) === -1) {
				//open replybox
				return List(state).concat([action.parentId]);
			} else {
				//close replybox
				return List(state).delete(state.indexOf(action.parentId));
			}

		default:
			return state;
	}
}

export function openEditComment(state: Array<number> = [], action: { type: string, id: number }) {
	switch (action.type) {
		case TOGGLE_EDIT_COMMENT:
			//if Edit Comment is closed
			if (state.indexOf(action.id) === -1) {
				//open Edit Comment
				return List(state).concat([action.id]);
			} else {
				//close Edit Comment
				return List(state).delete(state.indexOf(action.id));
			}

		default:
			return state;
	}
}

export function openCommentSection(state: boolean = false, action: { type: string }) {
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
