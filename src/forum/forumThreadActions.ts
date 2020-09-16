// @flow
import get from 'lodash/get';
import * as forumApi from './index';
import { Forum, ForumThreadEntry, ListThreadsResult, removeForumThreadEntry } from './index';
import * as likeApi from '../like';
import * as api from '../api';
import { Thunk } from '../api';
import * as forumActions from './forumActions';
import {
  DELETE_FORUM_THREAD,
  ForumThreadActions,
  RECEIVE_FORUM_THREADS,
  RECEIVE_LIKE_FORUM_THREAD,
  RECEIVE_VOTE_FORUM_THREAD,
  REQUEST_FORUM_THREADS,
  UPDATE_FORUM_THREAD_ENTRY
} from './forumThreadReducer';
import { PaginatedCollection } from '../api/PaginatedCollection';

//import { sendEventToGA } from '../analytics/analyticsFunctions';

export interface FetchForumThreads {
  forumPermalink: string;
  pageSize?: number;
  page?: number;
}

/**
 * Requests and receive forumThreads and store them in redux-state
 */
export function fetchForumThreads({
  forumPermalink,
  page,
  pageSize = 25
}: FetchForumThreads): Thunk<Promise<ListThreadsResult | { error: string }>> {
  return async (dispatch: any): Promise<ListThreadsResult | { error: string }> => {
    dispatch(requestForumThreads());
    const json = await dispatch(forumApi.listThreads({ forumPermalink, pageSize, p: page }));
    if (json.error) {
      console.error(forumPermalink + ': ' + api.getJsonErrorText(json));
      return { error: "Couldn't fetchForumThreads :" + api.getJsonErrorText(json) };
    }

    dispatch(
      forumActions.receiveForums({
        entries: Object.keys(json.__relatedObjects)
          .filter(entryKey => json.__relatedObjects[entryKey].__type === 'net.josh.community.forum.impl.ForumImpl')
          .reduce((obj, key) => obj.concat(json.__relatedObjects[key]), [])
      })
    );
    dispatch(
      receiveForumThreads({
        entries: get(json, 'threadsPaginated.entries', []),
        pageSize,
        forumPermalink
      })
    );
    return json;
  };
}

export interface FetchForumThreadEntries {
  forumPermalink: string;
  forumThreadPermalink: string;
  entryId?: number;
  pageSize?: number;
  p?: number;
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
}: FetchForumThreadEntries): Thunk<Promise<PaginatedCollection<ForumThreadEntry> | { error: string }>> {
  return async (dispatch: any): Promise<PaginatedCollection<ForumThreadEntry> | { error: string }> => {
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
      if (data.error) {
        console.error("couldn't fetchForumThreadEntries :", api.getJsonErrorText(data));
        return { error: "couldn't fetchForumThreadEntries :" + api.getJsonErrorText(data) };
      }
      dispatch(
        forumActions.receiveForums({
          entries: Object.keys(data.__relatedObjects)
            .filter(entryKey => data.__relatedObjects[entryKey].__type === 'net.josh.community.forum.impl.ForumImpl')
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

export function requestForumThreads(): ForumThreadActions {
  return { type: REQUEST_FORUM_THREADS };
}

export function receiveForumThreads({
  entries,
  forumPermalink,
  pageSize
}: {
  entries: Array<forumApi.ForumThreadEntry>;
  forumPermalink: string;
  pageSize: number;
}): ForumThreadActions {
  return {
    type: RECEIVE_FORUM_THREADS,
    entries,
    forumPermalink,
    pageSize
  };
}

export function updateForumThreadEntry({
  entry,
  forumPermalink
}: {
  entry: forumApi.ForumThreadEntry;
  forumPermalink: string;
}): ForumThreadActions {
  return {
    type: UPDATE_FORUM_THREAD_ENTRY,
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
  score: number;

  /**Id of the forum thread entry to be liked, can also be a forumEntry*/
  forumThreadEntry: forumApi.ForumThreadEntry;
}): Thunk<any> {
  return async (dispatch: any, getState): Promise<any> => {
    const forumId = forumThreadEntry.forumRef.id;
    const voteJson = await dispatch(forumApi.vote({ forumThreadEntry, score }));
    const currentForum = getState().forums.entries.filter((forum: Forum) => !!forum && forum.id === forumId)[0];
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
  voteJson: forumApi.VoteReturn;
  forumPermalink: string;
}): ForumThreadActions {
  return {
    type: RECEIVE_VOTE_FORUM_THREAD,
    voteJson,
    forumPermalink
  };
}

export interface LikeForumThreadEntry {
  referenceId: number;
  likedByCurrentUser: boolean;
  context: string;
}

export function likeForumThreadEntry({ referenceId, likedByCurrentUser, context }: LikeForumThreadEntry): Thunk<any> {
  return async (dispatch: any, getState): Promise<any> => {
    const forumThreadEntry = forumApi.getThreadEntryFromRedux({
      forumThreads: getState().forumThreads,
      id: referenceId
    });
    if (!forumThreadEntry) {
      throw Error("Can't find forumThreadEntry in redux Store");
    }
    const obfuscatedReference = get(forumThreadEntry, `.obfuscatedReference`);
    const forumPermalink = get(forumThreadEntry, `.forumRef.permalink`, undefined);
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

export interface ReceiveLikeForumThreadEntry {
  receivedLikes: any;
  referenceId: number;
  forumPermalink: string;
}

function _receiveLikeForumThreadEntry({
  receivedLikes,
  forumPermalink,
  referenceId
}: ReceiveLikeForumThreadEntry): ForumThreadActions {
  return {
    type: RECEIVE_LIKE_FORUM_THREAD,
    receivedLikes,
    referenceId,
    forumPermalink
  };
}

export interface DeleteForumThreadEntry {
  forumThreadEntryId: number;
  modalName: string;
}

/**
 * Delete forum thread entries and update state
 */
export function deleteForumThreadEntry({ forumThreadEntryId, modalName }: DeleteForumThreadEntry): api.Thunk<void> {
  return async (dispatch: any /*, getState: GetState*/): Promise<void> => {
    //dispatch(handleAccordionStatus({ name: modalName, isOpen: true }));
    const json = await dispatch(removeForumThreadEntry({ entryId: forumThreadEntryId }));
    !!json.entry && dispatch(_deleteForumThreadEntry({ entry: json.entry }));
  };
}

function _deleteForumThreadEntry({ entry }: { entry: ForumThreadEntry }): ForumThreadActions {
  return {
    type: DELETE_FORUM_THREAD,
    entry
  };
}
