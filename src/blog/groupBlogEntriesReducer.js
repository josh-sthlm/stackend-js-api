// @flow
import _ from 'lodash/object';
import { concat } from 'lodash/array';
//import { spread } from 'lodash/function';
//import { groupBy, map } from 'lodash/collection';

import update from 'immutability-helper';
import * as blogApi from './blog.js';
import { LOCATION_CHANGE } from 'react-router-redux';
import createReducer from '../types/createReducer';
import * as xcapApi from './../xcap/api.js';

//Action Type
export const REQUEST_GROUP_BLOG_ENTRIES = 'REQUEST_GROUP_BLOG_ENTRIES';
export const RECIEVE_GROUP_BLOG_ENTRIES = 'RECIEVE_GROUP_BLOG_ENTRIES';
export const INVALIDATE_GROUP_BLOG_ENTRIES = 'INVALIDATE_GROUP_BLOG_ENTRIES';
export const TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY = 'TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY';
export const CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY = 'CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY';
export const UPDATE_GROUP_BLOG_ENTRY = 'UPDATE_GROUP_BLOG_ENTRY';

const actionTypes = {
	INVALIDATE_GROUP_BLOG_ENTRIES,
	RECIEVE_GROUP_BLOG_ENTRIES,
	REQUEST_GROUP_BLOG_ENTRIES,
	TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY,
	CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY,
	UPDATE_GROUP_BLOG_ENTRY
};
export type GroupBlogEntriesActions = Recieve | Update | Request | Invalidate;
export type GroupBlogEntriesActionTypes = $Keys<typeof actionTypes>;

type BlogKey = string; //ex: king/blog

type State = {
	[BlogKey]: {
		isFetching: boolean,
		didInvalidate: boolean,
		json: {
			resultPaginated: {
				entries: Array<blogApi.BlogEntry>
			},
			userRsvpStatuses: any,
			likesByCurrentUser: any,
			blogId: number
		},
		lastUpdated: number
	}
};
type Recieve = {
	type: 'RECIEVE_GROUP_BLOG_ENTRIES',
	blogKey: BlogKey,
	receievedAt: number,
	json: {
		blogId: number,
		resultPaginated: {
			entries: Array<blogApi.BlogEntry>
		},
		userRsvpStatuses: any,
		likesByCurrentUser: any,
		error?: string
	}
};

type Update = {
	type: 'UPDATE_GROUP_BLOG_ENTRY',
	blogKey: BlogKey,
	receievedAt: number,
	json: {
		blogId: number,
		resultPaginated: {
			entries: Array<blogApi.BlogEntry>
		},
		userRsvpStatuses: any,
		likesByCurrentUser: any
	}
};
type Request = {
	type: 'REQUEST_GROUP_BLOG_ENTRIES',
	blogKey: BlogKey
};
type Invalidate = {
	type: 'INVALIDATE_GROUP_BLOG_ENTRIES',
	blogKey: BlogKey
};

//Reducer
export const groupBlogEntries = createReducer(
	{},
	{
		REQUEST_GROUP_BLOG_ENTRIES: (state: State, action: Request) =>
			update(state, {
				[action.blogKey]: {
					$apply: context =>
						update(context || {}, {
							isFetching: { $set: true },
							didInvalidate: { $set: false },
							json: { $set: _.get(state, `[${action.blogKey}].json`, {}) }
						})
				}
			}),
		RECIEVE_GROUP_BLOG_ENTRIES: (state: State, action: Recieve) => {
			if (!!action.json.error) {
				console.warn(
					RECIEVE_GROUP_BLOG_ENTRIES,
					'Error:',
					action.blogKey,
					xcapApi.getJsonErrorText(action.json)
				);
				return update(state, {
					[action.blogKey]: {
						$apply: context =>
							update(context || {}, {
								isFetching: { $set: false },
								didInvalidate: { $set: false },
								lastUpdated: { $set: action.receievedAt },
								json: { $merge: { resultPagined: { page: 1, totalSize: 0, entries: [] } } },
								error: { $set: action.json.error }
							})
					}
				});
			}

			// Combine the existing and new entries, update the existing if needed
			let origEntries = _.get(state, `[${action.blogKey}].json.resultPaginated.entries`, []);
			let addEntries = [];
			action.json.resultPaginated.entries.forEach(e => {
				let existingEntry = origEntries.find(o => o.id == e.id);
				if (existingEntry) {
					_.assign(existingEntry, e);
				} else {
					addEntries.push(e);
				}
			});

			const uniqueBlogEntries = concat(origEntries, addEntries);

			//console.log("RECIEVE_GROUP_BLOG_ENTRIES", action.json);

			return update(state, {
				[action.blogKey]: {
					$apply: context =>
						update(context || {}, {
							isFetching: { $set: false },
							didInvalidate: { $set: false },
							lastUpdated: { $set: action.receievedAt },
							json: {
								$apply: context =>
									update(Object.assign({}, context, action.json), {
										resultPaginated: {
											entries: { $set: uniqueBlogEntries }
										}
									})
							}
						})
				}
			});
		},
		INVALIDATE_GROUP_BLOG_ENTRIES: (state: State, action: Invalidate) => {
			return {
				...state,
				...{
					[action.blogKey]: {
						didInvalidate: true
					}
				}
			};
		},
		UPDATE_GROUP_BLOG_ENTRY: (state: State, action: Update) => {
			// Last index is the updated entry
			const updatedBlogEntry =
				action.json.resultPaginated.entries[action.json.resultPaginated.entries.length - 1];
			const indexOfUpdatedEntry = state[action.blogKey].json.resultPaginated.entries
				.map(blogEntry => blogEntry.id)
				.indexOf(updatedBlogEntry.id);

			return update(state, {
				[action.blogKey]: {
					isFetching: { $set: false },
					didInvalidate: { $set: false },
					lastUpdated: { $set: action.receievedAt },
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

type OpenBlogEntryWriteCommentSection =
	| false
	| { blogEntryId: number, editorType: 'EDIT' | 'COMMENT' };

type OpenBlogEntryWriteCommentSectionAction = {
	type: string,
	blogEntryId: number,
	editorType: 'EDIT' | 'COMMENT'
};
export function openBlogEntryWriteCommentSection(
	state: OpenBlogEntryWriteCommentSection = false,
	action: OpenBlogEntryWriteCommentSectionAction
) {
	switch (action.type) {
		case TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY:
			if (
				!!state &&
				state.blogEntryId === action.blogEntryId &&
				state.editorType === action.editorType
			) {
				return false;
			} else {
				return {
					blogEntryId: action.blogEntryId,
					editorType: action.editorType
				};
			}
		case LOCATION_CHANGE:
		case CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY:
			return false;
		default:
			return state;
	}
}
