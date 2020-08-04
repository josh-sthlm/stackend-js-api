// @flow
import _ from 'lodash/object';
import * as forumApi from './forum.js';
import * as likeApi from '../like.js';
import * as api from '../api.js';
import * as forumActions from './forumActions.js';
import type { Thunk, Dispatch, GetState } from '../store.js';
import * as reducer from './forumThreadReducer.js';
import { sendEventToGA } from '../analytics/analyticsFunctions.js';
import { removeForumThreadEntry } from './forum.js';
import { handleAccordionStatus } from '../Accordion/accordionReducer.jsx';

type FetchForumThreads = {
	forumPermalink: string,
	pageSize?: number,
	page?: number
};

/**
 * Requests and recieve forumThreads and store them in redux-state
 */
export function fetchForumThreads({
	forumPermalink,
	page,
	pageSize = 25
}: FetchForumThreads): Thunk<*> {
	return async (dispatch: Dispatch /*, getState: GetState*/) => {
		dispatch(requestForumThreads());
		const json = await dispatch(forumApi.listThreads({ forumPermalink, pageSize, p: page }));
		if (json.error) {
			console.error(forumPermalink + ': ' + api.getJsonErrorText(json));
			return { error: "Couldn't fetchForumThreads :" + api.getJsonErrorText(json) };
		}

		dispatch(
			forumActions.recieveForums({
				entries: Object.keys(json.__relatedObjects)
					.filter(
						entryKey =>
							json.__relatedObjects[entryKey].__type === 'net.josh.community.forum.impl.ForumImpl'
					)
					.reduce((obj, key) => obj.concat(json.__relatedObjects[key]), [])
			})
		);
		dispatch(
			receiveForumThreads({ entries: _.get(json, 'threadsPaginated.entries', []), forumPermalink })
		);
		return json;
	};
}

type FetchForumThreadEntries = {
	forumPermalink: string,
	forumThreadPermalink: string,
	entryId?: number,
	pageSize?: number,
	p?: number
};

/**
 * Requests and recieve forumThreads and store them in redux-state
 * if entryId is specified we fetch the page that this entry is located on
 */
export function fetchForumThreadEntries({
	forumPermalink,
	forumThreadPermalink,
	entryId,
	pageSize = 15,
	p
}: FetchForumThreadEntries): Thunk<*> {
	return async (dispatch: Dispatch /*, getState: GetState*/) => {
		try {
			const data = await dispatch(
				forumApi.listEntries({
					forumPermalink,
					forumThreadPermalink,
					entryId,
					pageSize,
					p,
					isQna: forumPermalink === 'question'
				})
			);
			if (!!data.error) {
				console.error("couldn't fetchForumThreadEntries :", api.getJsonErrorText(data));
				return { error: "couldn't fetchForumThreadEntries :" + api.getJsonErrorText(data) };
			}
			dispatch(
				forumActions.recieveForums({
					entries: Object.keys(data.__relatedObjects)
						.filter(
							entryKey =>
								data.__relatedObjects[entryKey].__type === 'net.josh.community.forum.impl.ForumImpl'
						)
						.reduce((obj, key) => obj.concat(data.__relatedObjects[key]), [])
				})
			);
			dispatch(
				receiveForumThreads({
					entries: data.entriesPaginated.entries.concat(data.thread),
					forumPermalink,
					pageSize
				})
			);
			return data.entriesPaginated;
		} catch (e) {
			console.error("couldn't fetchForumThreadEntries :", e);
			return { error: "couldn't fetchForumThreadEntries :" + e };
		}
	};
}

export function requestForumThreads(): reducer.Request {
	return { type: reducer.actionTypes.REQUEST_FORUM_THREADS };
}

export function receiveForumThreads({
	entries,
	forumPermalink
}: {
	entries: Array<forumApi.ForumThreadEntry>,
	forumPermalink: string
}): reducer.Recieve {
	return {
		type: reducer.actionTypes.RECIEVE_FORUM_THREADS,
		entries,
		forumPermalink
	};
}

export function updateForumThreadEntry({
	entry,
	forumPermalink
}: {
	entry: forumApi.ForumThreadEntry,
	forumPermalink: string
}) {
	return {
		type: reducer.actionTypes.UPDATE_FORUM_THREAD_ENTRY,
		entry,
		forumPermalink
	};
}

/**
 * Requests and recieve comments and store them in redux-state
 */
export function rateForumThreadEntry({
	forumThreadEntry,
	score
}: {
	/**1 for thumbs down, 2 for thumbs up*/
	score: number,

	/**Id of the forum thread entry to be liked, can also be a forumEntry*/
	forumThreadEntry: forumApi.ForumThreadEntry
}) {
	return async (dispatch: Dispatch, getState: GetState) => {
		const forumId = forumThreadEntry.forumRef.id;
		const voteJson = await dispatch(forumApi.vote({ forumThreadEntry, score }));
		const currentForum = getState().forums.entries.filter(
			forum => !!forum && forum.id === forumId
		)[0];
		if (score === 2) {
			dispatch(sendEventToGA(forumApi.gaLikeEventObject({ forumThreadEntry })));
		} else {
			dispatch(sendEventToGA(forumApi.gaDislikeEventObject({ forumThreadEntry })));
		}
		return dispatch(recieveVoteForumThread({ voteJson, forumPermalink: currentForum.permalink }));
	};
}

export function recieveVoteForumThread({
	voteJson,
	forumPermalink
}: {
	voteJson: forumApi.VoteReturn,
	forumPermalink: string
}): reducer.Rate {
	return {
		type: reducer.actionTypes.RECIEVE_VOTE_FORUM_THREAD,
		voteJson,
		forumPermalink
	};
}

type LikeForumThreadEntry = {
	referenceId: number,
	likedByCurrentUser: boolean,
	context: string
};

export function likeForumThreadEntry({
	referenceId,
	likedByCurrentUser,
	context
}: LikeForumThreadEntry) {
	return async (dispatch: Dispatch, getState: GetState) => {
		const forumThreadEntry = forumApi.getThreadEntryFromRedux({
			forumThreads: getState().forumThreads,
			id: referenceId
		});
		if (!forumThreadEntry) {
			throw "Can't find forumThreadEntry in redux Store";
		}
		const obfuscatedReference = _.get(forumThreadEntry, `.obfuscatedReference`);
		const forumPermalink = _.get(forumThreadEntry, `.forumRef.permalink`, undefined);
		let receivedLikes;
		if (!obfuscatedReference) {
			throw "can't get obfuscatedReference from forumThreadEntry in redux";
		}

		if (likedByCurrentUser) {
			receivedLikes = await dispatch(likeApi.removeLike({ obfuscatedReference, context }));
			dispatch(sendEventToGA(forumApi.gaUnlikeEventObject({ forumThreadEntry })));
		} else {
			receivedLikes = await dispatch(likeApi.like({ obfuscatedReference, context }));
			dispatch(sendEventToGA(forumApi.gaLikeEventObject({ forumThreadEntry })));
		}

		return dispatch(_receiveLikeForumThreadEntry({ receivedLikes, referenceId, forumPermalink }));
	};
}
type ReceiveLikeForumThreadEntry = {
	receivedLikes: any,
	referenceId: number,
	forumPermalink: string
};
function _receiveLikeForumThreadEntry({
	receivedLikes,
	forumPermalink,
	referenceId
}: ReceiveLikeForumThreadEntry) {
	return {
		type: reducer.actionTypes.RECIEVE_LIKE_FORUM_THREAD,
		receivedLikes,
		referenceId,
		forumPermalink
	};
}

type DeleteForumThreadEntry = {
	forumThreadEntryId: number,
	modalName: string
};

/**
 * Delete forum thread entries and update state
 */
export function deleteForumThreadEntry({
	forumThreadEntryId,
	modalName
}: DeleteForumThreadEntry): Thunk<*> {
	return async (dispatch: Dispatch /*, getState: GetState*/) => {
		dispatch(handleAccordionStatus({ name: modalName, isOpen: true }));
		const json = await removeForumThreadEntry({ entryId: forumThreadEntryId });
		!!json.entry && dispatch(_deleteForumThreadEntry({ entry: json.entry }));
	};
}

function _deleteForumThreadEntry({ entry }) {
	return {
		type: reducer.actionTypes.DELETE_FORUM_THREAD,
		entry
	};
}
