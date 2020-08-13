// @flow
import _ from 'lodash';
import * as forumApi from '../forum';
import * as likeApi from '../like';
import * as api from '../api';
import * as forumActions from './forumActions';
import * as reducer from './forumThreadReducer';
import { Forum, ForumThreadEntry, removeForumThreadEntry } from '../forum'
import { Thunk } from '../api'
//import { sendEventToGA } from '../analytics/analyticsFunctions';

export interface FetchForumThreads {
	forumPermalink: string,
	pageSize?: number,
	page?: number
}

/**
 * Requests and receive forumThreads and store them in redux-state
 */
export function fetchForumThreads({
	forumPermalink,
	page,
	pageSize = 25
}: FetchForumThreads): api.Thunk<any> {
	return async (dispatch: any /*, getState: GetState*/) => {
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
			receiveForumThreads({
        entries: _.get(json, 'threadsPaginated.entries', []),
        pageSize,
        forumPermalink
			})
		);
		return json;
	};
}

export interface FetchForumThreadEntries {
	forumPermalink: string,
	forumThreadPermalink: string,
	entryId?: number,
	pageSize?: number,
	p?: number
}

/**
 * Requests and receive forumThreads and store them in redux-state
 * if entryId is specified we fetch the page that this entry is located on
 */
export function fetchForumThreadEntries({
	forumPermalink,
	forumThreadPermalink,
	entryId,
	pageSize = 15,
	p
}: FetchForumThreadEntries): Thunk<any> {
	return async (dispatch: any /*, getState: GetState*/) => {
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
	// @ts-ignore
  return { type: reducer.actionTypes.REQUEST_FORUM_THREADS };
}

export function receiveForumThreads({
	entries,
	forumPermalink,
  pageSize
}: {
	entries: Array<forumApi.ForumThreadEntry>,
	forumPermalink: string,
  pageSize: number
}): reducer.Recieve {
	// @ts-ignore
  return {
		type: reducer.actionTypes.RECIEVE_FORUM_THREADS,
		entries,
		forumPermalink,
    pageSize
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
 * Requests and receive comments and store them in redux-state
 */
export function rateForumThreadEntry({
	forumThreadEntry,
	score
}: {
	/**1 for thumbs down, 2 for thumbs up*/
	score: number,

	/**Id of the forum thread entry to be liked, can also be a forumEntry*/
	forumThreadEntry: forumApi.ForumThreadEntry
}): Thunk<any> {
	return async (dispatch:any, getState) => {
		const forumId = forumThreadEntry.forumRef.id;
		const voteJson = await dispatch(forumApi.vote({ forumThreadEntry, score }));
		const currentForum = getState().forums.entries.filter(
      (forum:Forum) => !!forum && forum.id === forumId
		)[0];
		/* FIXME: re add this
		if (score === 2) {
			dispatch(sendEventToGA(forumApi.gaLikeEventObject({ forumThreadEntry })));
		} else {
			dispatch(sendEventToGA(forumApi.gaDislikeEventObject({ forumThreadEntry })));
		}
		 */
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
	// @ts-ignore
  return {
		type: reducer.actionTypes.RECIEVE_VOTE_FORUM_THREAD,
		voteJson,
		forumPermalink
	};
}

interface LikeForumThreadEntry {
	referenceId: number,
	likedByCurrentUser: boolean,
	context: string
}

export function likeForumThreadEntry({
	referenceId,
	likedByCurrentUser,
	context
}: LikeForumThreadEntry): Thunk<any> {
	return async (dispatch:any, getState) => {
		const forumThreadEntry = forumApi.getThreadEntryFromRedux({
			forumThreads: getState().forumThreads,
			id: referenceId
		});
		if (!forumThreadEntry) {
			throw Error("Can't find forumThreadEntry in redux Store");
		}
		const obfuscatedReference = _.get(forumThreadEntry, `.obfuscatedReference`);
		const forumPermalink = _.get(forumThreadEntry, `.forumRef.permalink`, undefined);
		let receivedLikes;
		if (!obfuscatedReference) {
			throw Error("can't get obfuscatedReference from forumThreadEntry in redux");
		}

		// FIXME: re add ga
		if (likedByCurrentUser) {
			receivedLikes = await dispatch(likeApi.removeLike({ obfuscatedReference, context }));
			//dispatch(sendEventToGA(forumApi.gaUnlikeEventObject({ forumThreadEntry })));
		} else {
			receivedLikes = await dispatch(likeApi.like({ obfuscatedReference, context }));
			//dispatch(sendEventToGA(forumApi.gaLikeEventObject({ forumThreadEntry })));
		}

		return dispatch(_receiveLikeForumThreadEntry({ receivedLikes, referenceId, forumPermalink }));
	};
}

interface ReceiveLikeForumThreadEntry  {
	receivedLikes: any,
	referenceId: number,
	forumPermalink: string
}

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

interface DeleteForumThreadEntry {
	forumThreadEntryId: number,
	modalName: string
}

/**
 * Delete forum thread entries and update state
 */
export function deleteForumThreadEntry({
	forumThreadEntryId,
	modalName
}: DeleteForumThreadEntry): api.Thunk<void> {
	return async (dispatch: any /*, getState: GetState*/) => {
		//dispatch(handleAccordionStatus({ name: modalName, isOpen: true }));
		const json = await dispatch(removeForumThreadEntry({ entryId: forumThreadEntryId }));
		!!json.entry && dispatch(_deleteForumThreadEntry({ entry: json.entry }));
	};
}

function _deleteForumThreadEntry({ entry }: { entry: ForumThreadEntry}) {
	return {
		type: reducer.actionTypes.DELETE_FORUM_THREAD,
		entry
	};
}
