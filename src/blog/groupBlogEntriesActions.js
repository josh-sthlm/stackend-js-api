// @flow
import _ from 'lodash/object';
import update from 'immutability-helper';
import * as categoryApi from '../category/category.js';
import * as groupActions from '../group/groupActions.js';
import * as blogActions from './blogActions.js';
import { listMyGroups } from '../group/group.js';
import * as xcapApi from '../xcap/api.js';
import * as commentActions from '../comments/commentAction.js';
import * as commentApi from '../comments/comments.js';
import type { Thunk, Dispatch } from '../types/store.js';
import {
	INVALIDATE_GROUP_BLOG_ENTRIES,
	RECIEVE_GROUP_BLOG_ENTRIES,
	REQUEST_GROUP_BLOG_ENTRIES,
	TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY,
	CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY,
	UPDATE_GROUP_BLOG_ENTRY
} from './groupBlogEntriesReducer.js';

import {
	type BlogEntry,
	getEntry,
	getEntries,
	saveEntry,
	type SetEntryStatus,
	setEntryStatus,
	gaPostEventObject,
	gaEditPostEventObject
} from './blog.js';
import { sendEventToGA } from '../analytics/analyticsFunctions.js';

/**
 * Load comments in a group and for a specific blogEntry
 *
 * @since 15 fen 2017
 * @author pelle
 */

//When loading comments recieve is run when the server has responded
function recieveBlogEntries(
	blogKey: string,
	json: { resultPaginated: { entries: [BlogEntry] } }
): any {
	return {
		type: RECIEVE_GROUP_BLOG_ENTRIES,
		blogKey,
		json,
		receievedAt: Date.now()
	};
}

//When loading comments recieve is run when the server has responded
export function cleanCacheBlogEntries({ blogKey }: { blogKey: string }): any {
	return {
		type: INVALIDATE_GROUP_BLOG_ENTRIES,
		blogKey,
		receievedAt: Date.now()
	};
}

//Request comments from the server
function requestBlogEntries(blogKey: string): any {
	return {
		type: REQUEST_GROUP_BLOG_ENTRIES,
		blogKey
	};
}
//Update already existing blog entry
function updateBlogEntry(
	blogKey: string,
	json: { resultPaginated: { entries: [BlogEntry] } }
): any {
	return {
		type: UPDATE_GROUP_BLOG_ENTRY,
		blogKey,
		json,
		receievedAt: Date.now()
	};
}

type FetchBlogEntries = {
	blogKey: string, //The id of the blogKey that you want to store the data in redux
	pageSize?: number,
	p?: number, //page number in paginated collection
	categories?: Array<categoryApi.Category>,
	invalidatePrevious?: boolean, //if true, invalidates previous blog-entries in this blog,
	goToBlogEntry?: string // Start the pagination at the specified entry permalink
};

/*
 * Requests and receive blog entries and store them in redux-state
 */
export function fetchBlogEntries({
	blogKey,
	pageSize = 15,
	p = 1,
	categories,
	invalidatePrevious = false,
	goToBlogEntry
}: FetchBlogEntries): Thunk<*> {
	return async (dispatch: Dispatch, getState: any) => {
		const categoryId = _.get(categories, '[0].id', null);

		try {
			dispatch(requestBlogEntries(blogKey));
			const { currentUser, groups } = getState();
			const auth = _.get(groups, 'auth', {});
			try {
				if (
					_.get(currentUser, 'isLoggedIn', false) &&
					(auth == null || Object.keys(auth).length === 0)
				) {
					const myGroups = await dispatch(listMyGroups());
					dispatch(groupActions.recieveGroupsAuth({ entries: _.get(myGroups, 'groupAuth') }));
				}
			} catch (e) {
				console.error("Couldn't recieveGroupsAuth in fetchBlogEntries for " + blogKey + ': ', e);
			}

			const blogEntries = await dispatch(
				getEntries({ blogKey, pageSize, p, categoryId, goToBlogEntry })
			);
			// FIXME: this should use the blog object returned by the above call, because this fails if there are no entries
			const groupRef = _.get(blogEntries, 'blog.groupRef');
			if (!!groupRef) {
				await dispatch(groupActions.recieveGroups({ entries: groupRef }));
			} else {
				console.error(
					"Couldn't recieveGroups in fetchBlogEntries for " + blogKey + '. Entries: ',
					blogEntries
				);
			}
			const blogRef = _.get(blogEntries, 'blog');
			if (!!blogRef) {
				await dispatch(blogActions.recieveBlogs({ entries: blogRef }));
			} else {
				console.error(
					"Couldn't recieveBlogs in fetchBlogEntries for " + blogKey + '. Entries: ',
					blogEntries
				);
			}
			if (invalidatePrevious) {
				await dispatch(cleanCacheBlogEntries({ blogKey }));
			}
			return dispatch(recieveBlogEntries(blogKey, blogEntries));
		} catch (e) {
			console.error("Couldn't fetchBlogEntries for " + blogKey + ': ', e);
		}
	};
}

/**
 * Requests and recieve entries and store them in redux-state
 */
export function fetchBlogEntry({
	id,
	permalink,
	blogKey
}: {
	id?: number,
	permalink?: string,
	blogKey: string
}): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		try {
			await dispatch(requestBlogEntries(blogKey));
			const { currentUser, groups } = getState();
			const auth = _.get(groups, 'auth', {});
			if (
				_.get(currentUser, 'isLoggedIn', false) &&
				(auth == null || Object.keys(auth).length === 0)
			) {
				let json = await dispatch(listMyGroups());
				await dispatch(groupActions.recieveGroupsAuth({ entries: _.get(json, 'groupAuth') }));
			}

			let json = await dispatch(getEntry({ id, entryPermaLink: permalink, blogKey }));
			await dispatch(_fetchBlogEntry(blogKey, json));
			return json;
		} catch (e) {
			console.log(
				'Error fetchBlogEntry ' +
					(id ? id : !!permalink ? permalink : '') +
					' from ' +
					blogKey +
					':',
				e
			);
		}
	};
}

type FetchBlogEntriesWithComments = {
	blogKey: string,
	page?: number,
	categories?: Array<categoryApi.Category>,
	goToBlogEntry?: string
};
export function fetchBlogEntriesWithComments({
	blogKey,
	page = 1,
	categories,
	goToBlogEntry
}: FetchBlogEntriesWithComments): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		let response;
		try {
			response = await dispatch(fetchBlogEntries({ blogKey, p: page, categories, goToBlogEntry }));
			if (!!response.json.error) {
				console.error(
					'Could not get blog entries for ' + blogKey + ': ',
					xcapApi.getJsonErrorText(response.json)
				);
				return null;
			}
			const referenceIds = response.json.resultPaginated.entries.map(entry => entry.id);

			return dispatch(
				commentActions.fetchMultipleComments({
					module: commentApi.CommentModule.BLOG,
					referenceIds,
					referenceGroupId: response.json.blogId
				})
			);
		} catch (e) {
			//FIXME: Probably a private group but need fail-check
			console.error("Couldn't fetchBlogEntriesWithComments for " + blogKey + ': ', response, e);
		}
	};
}

export function fetchBlogEntryWithComments({
	id,
	permalink,
	blogKey
}: {
	id?: number,
	permalink?: string,
	blogKey: string
}): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		try {
			const response = await dispatch(fetchBlogEntry({ id, permalink, blogKey }));
			const blogEntry = response.blogEntry;
			if (blogEntry) {
				return dispatch(
					commentActions.fetchComments({
						module: commentApi.CommentModule.BLOG,
						referenceId: blogEntry.id,
						referenceGroupId: blogEntry.blogId
					})
				);
			} else {
				console.warn(
					'No such blog entry. id=' +
						(!!id ? id : '?') +
						', permalink=' +
						(!!permalink ? permalink : '?') +
						', blogKey=' +
						blogKey
				);
			}
		} catch (e) {
			//FIXME: Probably a private group but need fail-check
			console.warn(e);
		}
	};
}

function _fetchBlogEntry(blogKey, json) {
	return (dispatch: any, getState: any) => {
		const groupRef = _.get(json, 'blog.groupRef', _.get(json, 'blogEntry.blogRef.groupRef'));
		if (groupRef) {
			dispatch(groupActions.recieveGroups({ entries: groupRef }));
		}
		const blogRef = _.get(json, 'blog', _.get(json, 'blogEntry.blogRef'));
		if (blogRef) {
			dispatch(blogActions.recieveBlogs({ entries: blogRef }));
		}

		return dispatch(
			recieveBlogEntries(blogKey, {
				resultPaginated: {
					entries: [json.blogEntry]
				},
				likes: json.likes
			})
		);
	};
}

/**
 * Edit or create a blog entry.
 *
 * @param blogEntryJson
 * @param type
 * @param draftId
 * @param blogKey
 */
export function postBlogEntry({
	blogEntryJson,
	type,
	draftId,
	blogKey
}: {
	blogEntryJson: any,
	type: 'PUBLISHED' | '',
	blogKey: string, //The id of the blogKey that you want to store the data in redux
	draftId?: number
}): Thunk<*> {
	return async (dispatch: any, getState: any) => {
		dispatch(requestBlogEntries(blogKey));

		const response = await dispatch(
			saveEntry({
				blogEntryJson,
				type,
				draftId,
				blogKey
			})
		);

		if (response.error) {
			return response;
		}

		//In order to keep pagination-object we need to merge with current state
		const resultPaginated = update(
			_.get(getState(), `groupBlogEntries[${blogKey}].json.resultPaginated`),
			{
				entries: { $push: [response.entry] }
			}
		);
		const state = { resultPaginated };

		if (!!blogEntryJson.id && blogEntryJson.id > 0) {
			//Edit an blogEntry
			dispatch(toggleWriteCommentOrEdit({ blogEntryId: response.entry.id, editorType: 'EDIT' }));
			dispatch(sendEventToGA(gaEditPostEventObject({ blogEntry: response.entry })));
			return dispatch(updateBlogEntry(blogKey, state));
		} else {
			//Add new blogEntry
			dispatch(sendEventToGA(gaPostEventObject({ blogEntry: response.entry })));
			return dispatch(recieveBlogEntries(blogKey, state));
		}
	};
}

export function changeBlogEntryStatus({ blogKey, id, status }: SetEntryStatus): Thunk<*> {
	return async (dispatch: any /*, getState: any*/) => {
		let response = await dispatch(setEntryStatus({ blogKey, id, status }));
		dispatch(updateBlogEntry(blogKey, { resultPaginated: { entries: [response.entry] } }));
	};
}

//Toggle Reply editor for selected parent comment id
export function toggleWriteCommentOrEdit({
	blogEntryId,
	editorType
}: {
	blogEntryId: number, //BlogEntry id
	editorType: 'EDIT' | 'COMMENT'
}): any {
	return {
		type: TOGGLE_EDIT_OR_COMMENT_BLOG_ENTRY,
		blogEntryId,
		editorType
	};
}

export function closeWriteCommentOrEdit() {
	return { type: CLOSE_EDIT_OR_COMMENT_BLOG_ENTRY };
}
