// @flow
import _ from 'lodash';
import {
  getJson,
  post,
  createCommunityUrl,
  XcapJsonResult,
  XcapObject,
  Thunk,
  XcapOptionalParameters,
  ModerationStatus
} from '../api';
import * as categoryApi from '../category';
import * as userApi from '../user';
//import * as gaFunctions from '../functions/gaFunctions';
import { PaginatedCollection } from '../api/PaginatedCollection';
import { Request } from '../request';
import { VoteSummary } from '../vote';
import { LikeDataMap } from '../like';

/**
 * Xcap Forum API constants and methods.
 *
 * @since 22 jun 2017
 */

export interface Forum extends XcapObject {
  __type: 'net.josh.community.forum.impl.ForumImpl';
  name: string; //"Questions",
  description: string;
  permalink: string;
  createdDate: number; //Date
  ruleTypeId: number;
  obfuscatedReference: string; //"124739006d3950b54b3f976ba55ec788ac4f44ea77620764f7ca36a5fcf7dd7d8751dc6a2bef39a257c524010518a81e",
  anonymityLevel: string; //"NOT_ANONYMOUS",
  lastThreadEntryCreatedDate: any; //null,
  lastThreadEntryId: number;
  totalNrOfEntries: number;
  totalThreads: number;
}

export interface ForumThreadEntry extends XcapObject {
  __type: 'net.josh.community.forum.impl.ForumThreadImpl';
  categoriesRef: Array<categoryApi.Category>;
  createdDate: Date;
  creatorName: string;
  creatorUserId: number;
  creatorUserRef: userApi.User;
  expiresDate: Date;
  forumId: number;
  forumRef: Forum;
  lastEntryDate: Date;
  lastEntryId: number;
  modStatus: ModerationStatus;
  modifiedByUserId: number;
  modifiedByUserRef: userApi.User | null;
  modifiedDate: Date;
  name: string;
  nrOfEntries: number;
  nrOfNeedHelp: number;
  nrOfReplies: number;
  numberOfLikes: number;
  obfuscatedReference: string;
  open: boolean;
  permalink: string;
  plainText: string;
  ruleTypeId: number;
  solved: boolean;
  sticky: boolean;
  text: string;
  threadRef: ForumThreadEntry;
  ttl: number;
  url: string;
  voteSummary: VoteSummary;
}

/**
 * Forum Context
 * @type {string}
 */
const CONTEXT = 'forum';

/**
 * Forum Component name
 * @type {string}
 */
const COMPONENT_NAME = 'forum';

/**
 * Get the url to a forum or forum thread
 * @param request
 * @param forumPermalink
 * @param threadPermalink
 * @param absolute
 * @param community
 * @return {string}
 * @deprecated Implement in frontend code
 */
export function getForumUrl({
  request,
  forumPermalink,
  threadPermalink,
  community,
  absolute
}: {
  request: Request;
  forumPermalink?: string;
  threadPermalink?: string;
  absolute?: boolean;
  community?: string;
}): string {
  //TODO: Set support for castle orange, set Forum for Black
  /* FIXME: bad merge?
	if(!!community){
		return xcapApi.getServerWithContextPath() + '/'+community + (!!forumPermalink ? '/' + forumPermalink : '') + (!!threadPermalink ? '/' + threadPermalink : '');
	}
	*/

  if (!!forumPermalink && QNA_FORUM_PERMALINK === forumPermalink) {
    return createCommunityUrl({
      request,
      path: '/support' + (forumPermalink ? '/' + forumPermalink : '') + (threadPermalink ? '/' + threadPermalink : ''),
      absolute
    });
  } else {
    return createCommunityUrl({
      request,
      path: '/forum' + (forumPermalink ? '/' + forumPermalink : '') + (threadPermalink ? '/' + threadPermalink : ''),
      absolute
    });
  }
}

export const FORUM_CLASS = 'net.josh.community.forum.impl.ForumImpl';

export const FORUM_THREAD_CLASS = 'net.josh.community.forum.impl.ForumThreadImpl';

export const FORUM_THREAD_ENTRY_CLASS = 'net.josh.community.forum.impl.ForumThreadEntryImpl';

/**
 * Component class (used to look up privileges, etc)
 */
export const COMPONENT_CLASS = 'net.josh.community.forum.ForumManager';

/**
 * Permalink for the QNA forum
 */
export const QNA_FORUM_PERMALINK = 'question';

/**
 * returns the url to Ask a question in the Qnas.
 * @deprecated Implement in frontend code instead
 */
export function getCreateThreadUrl({
  request,
  forumPermalink = ''
}: {
  request: Request;
  forumPermalink?: string;
}): string {
  return createCommunityUrl({
    request,
    path: `/forum${forumPermalink ? `/${forumPermalink}` : ''}/create-a-thread`
  });
}

export interface ListForumsResult extends XcapJsonResult {
  forumsPaginated: PaginatedCollection<Forum>;
  forumCount: {
    numberOfForums: number;
    numberOfThreads: number;
    numberOfEntries: number;
  };
  pageSize: number;
  p: number;
}

/**
 * List forums
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function listForums({
  p,
  pageSize
}: { p?: number; pageSize?: number } & XcapOptionalParameters): Thunk<Promise<ListForumsResult>> {
  return getJson({ url: '/forum/list', parameters: arguments });
}

export interface ListThreadsResult extends XcapJsonResult {
  threadsPaginated: PaginatedCollection<ForumThreadEntry>;
  forumId: number;
  forumPermalink: string | null;
  forumThreadPermalink: string | null;
  likes: LikeDataMap;
  votes: { [referenceId: string]: any };
  pageSize: number;
  p: number;
}

/**
 * List threads of a forum.
 *
 * @param forumPermalink permalink of forum
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function listThreads({
  forumPermalink,
  p,
  pageSize
}: {
  forumPermalink: string;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<ListThreadsResult>> {
  return getJson({ url: '/forum/threads/list', parameters: arguments });
}

interface ListEntries extends XcapOptionalParameters {
  forumPermalink: string; //permalink of forum
  forumThreadPermalink: string; //permalink of forum thread
  p?: number;
  pageSize?: number;
  entryId?: number; //Jump to the page of this entry
  isQna?: boolean;
}

export interface ListEntriesResult extends XcapJsonResult {
  likes: LikeDataMap;
  entriesPaginated: PaginatedCollection<ForumThreadEntry>;
  thread: any;
}

/**
 * List entries of a thread.
 *
 * @param forumPermalink permalink of forum
 * @param forumThreadPermalink permalink of forum thread
 * @param entryId {number} Jump to the page of this entry (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @param isQna
 */
export function listEntries({
  forumPermalink,
  forumThreadPermalink,
  entryId,
  p,
  pageSize,
  isQna
}: ListEntries): Thunk<Promise<ListEntriesResult>> {
  return getJson({
    url: '/forum/entries/list',
    parameters: arguments,
    context: CONTEXT,
    componentName: COMPONENT_NAME
  });
}

/**
 * List threads the user is watching.
 * @param watchesHavingNewEntriesOnly {boolean} Set to true to only list threads with new entries.
 */
export function listWatchedThreads({
  watchesHavingNewEntriesOnly
}: {
  watchesHavingNewEntriesOnly?: boolean;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/forum/threads/list/watched', parameters: arguments });
}

/**
 * Watch/unwatch a thread for new activity.
 *
 * @param threadId {number} Thread id.
 * @param watch {boolean} If set to true, the thread is watched, if false, the watch is removed
 */
export function setThreadWatch({
  threadId,
  watch = true
}: {
  threadId: number;
  watch: boolean;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/forum/thread/watch', parameters: arguments });
}

/**
 * Pin a forum thread to the top of the listing.
 * Works as a toggle.
 * Requires admin access.
 * @param threadId {number} Thread id.
 */
export function pinForumThread({
  threadId
}: { threadId: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/forum/thread/pin', parameters: arguments });
}

/**
 * Close a forum thread.
 * Requires admin access.
 * @param threadId {number} Thread id.
 */
export function closeForumThread({
  threadId
}: { threadId: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/forum/thread/close', parameters: arguments });
}

export interface RemoveForumThreadEntryResult extends XcapJsonResult {
  entry: ForumThreadEntry | null;
}
/**
 * Remove a forum thread entry using moderation.
 * Requires admin access or that user is owner of entry.
 * @param v {number} Forum thread entry id.
 */
export function removeForumThreadEntry({
  entryId
}: { entryId: number } & XcapOptionalParameters): Thunk<Promise<RemoveForumThreadEntryResult>> {
  return post({ url: '/forum/thread/remove', parameters: arguments });
}

/**
 * Move a forum thread to a different forum.
 * Requires admin access.
 * @param threadId {number} Thread id.
 * @param forumId {number} New forum id
 */
export function moveForumThread({
  threadId,
  forumId
}: { threadId: number; forumId: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/forum/thread/move', parameters: arguments });
}

/**
 * Pin a forum entry to the top of the listing.
 * Works as a toggle.
 * Requires admin access.
 * @param entryId {number} Entry id.
 */
export function pinForumEntry({
  entryId
}: { entryId: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/forum/thread/pin', parameters: arguments });
}

/**
 * Move an entry to a different thread.
 * Requires admin access.
 * @param entryId {number} Entry id.
 * @param threadId {number} New thread id
 * @param includeReplies {boolean} Should replies also be moved?
 */
export function moveForumEntry({
  entryId,
  threadId,
  includeReplies = true
}: {
  entryId: number;
  threadId: number;
  includeReplies: boolean;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/forum/entry/move', parameters: arguments });
}

/**
 * List the last active threads.
 *
 * @param categoryIds {number[]} Category ids (optional)
 * @param categoryPermalinks {string[]} Category permalinks (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listLastActiveThreads({
  categoryIds,
  categoryPermalinks,
  p = 1,
  pageSize
}: {
  categoryIds?: Array<number>;
  categoryPermalinks?: Array<string>;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/forum/threads/list/last-active', parameters: arguments });
}

/**
 * List the last created threads.
 *
 * @param categoryIds {number[]} Category ids (optional)
 * @param categoryPermalinks {string[]} Category permalinks (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listLastCreatedThreads({
  categoryIds,
  categoryPermalinks,
  p = 1,
  pageSize
}: {
  categoryIds?: Array<number>;
  categoryPermalinks?: Array<string>;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/forum/threads/list/last-created', parameters: arguments });
}

/**
 * List the most active threads.
 *
 * @param daysBack {number} Number of days back. (optional)
 * @param categoryIds {number[]} Category ids (optional)
 * @param categoryPermalinks {string[]} Category permalinks (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listMostActiveThreds({
  daysBack,
  categoryIds,
  categoryPermalinks,
  p = 1,
  pageSize
}: {
  daysBack?: number;
  categoryIds?: Array<number>;
  categoryPermalinks?: Array<string>;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/forum/threads/list/most-active', parameters: arguments });
}

/**
 * List the most viewed threads.
 *
 * @param daysBack {number} Number of days back. (optional)
 * @param categoryIds {number[]} Category ids (optional)
 * @param categoryPermalinks {string[]} Category permalinks (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listMostViewedThreds({
  daysBack,
  categoryIds,
  categoryPermalinks,
  p = 1,
  pageSize
}: {
  daysBack?: number;
  categoryIds?: Array<number>;
  categoryPermalinks?: Array<string>;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/forum/threads/list/most-viewed', parameters: arguments });
}

/**
 * List the the forums with most new entries during the specified period.
 *
 * @param daysBack {number} Number of days back. (optional)
 * @param categoryIds {number[]} Category ids (optional)
 * @param categoryPermalinks {string[]} Category permalinks (optional)
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listMostActiveForums({
  daysBack,
  categoryIds,
  categoryPermalinks,
  p = 1,
  pageSize
}: {
  daysBack?: number;
  categoryIds?: Array<number>;
  categoryPermalinks?: Array<string>;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/forum/list/most-active', parameters: arguments });
}

/**
 * Assign additional categories to a forum thread.
 *
 * Will not affect previously assigned categories.
 * Requires moderator access.
 *
 * @param threadId {number} Entry id.
 * @param categoryIds {number[]} Additional categories
 */
export function addThreadCategories({
  threadId,
  categoryIds
}: {
  threadId: number;
  categoryIds: Array<number>;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/forum/thread/add-categories', parameters: arguments });
}

/**
 * Remove categories from a forum thread.
 *
 * Requires moderator access.
 *
 * @param threadId {number} Entry id.
 * @param categoryIds {number[]} Remove these categories
 */
export function removeThreadCategories({
  threadId,
  categoryIds
}: {
  threadId: number;
  categoryIds: Array<number>;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/forum/thread/remove-categories', parameters: arguments });
}

export interface VoteReturn {
  allowAnonymousVotes: boolean;
  availableScores: Array<number>;
  average: number;
  averageAsInt: number;
  hasEnoughVotes: boolean;
  hasVoted: boolean;
  maxScore: number;
  mayVote: boolean;
  minScore: number;
  minimumRequiredVotes: number;
  referenceGroupId: number;
  referenceId: number;
  score: number;
  vote: {
    ip: string; //"127.0.0.1"
    refId: number;
    referenceGroupId: number;
    score: number;
    voteDate: number; //1499858756671
    voterId: number;
  };
  voteSummary: VoteSummary;
  __relatedObjects: any;
}

/**
 * Vote thumbs up/down for a forum entry.
 *
 */
export function vote({
  forumThreadEntry,
  score
}: {
  /** 1 for thumbs down, 2 for thumbs up */
  score: number;
  forumThreadEntry: ForumThreadEntry;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  const forumThreadEntryId = forumThreadEntry.id;
  const forumId = forumThreadEntry.forumRef.id;

  return post({
    url: '/forum/entry/vote',
    parameters: {
      referenceId: forumThreadEntryId,
      score,
      referenceGroupId: forumId
    }
  });
}

/**
 * Get vote summary (number of votes per score and total) for an entry.
 * @param entryId
 */
export function getVoteSummary({
  entryId
}: { entryId: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({
    url: '/forum/entry/get-vote-summary',
    parameters: {
      referenceId: entryId
    }
  });
}

/**
 * Search the store for a ForumThreadEntry matching the id or permalink
 * @param forumThreads
 * @param id
 * @param forumPermalink
 * @param forumThreadPermalink
 */
export function getThreadEntryFromRedux({
  forumThreads,
  id,
  forumPermalink,
  forumThreadPermalink
}: {
  forumThreads: any;
  id?: number;
  forumPermalink?: string;
  forumThreadPermalink?: string;
} & XcapOptionalParameters): ForumThreadEntry | null {
  if (id) {
    // FIXME: What is this? Fix
    // @ts-ignore
    return _.find(_.flatten(Object.values(forumThreads.forums)), {
      id /*, __type:FTE_COMPONENT_CLASS*/
    });
  }

  return _.get(
    _.get(forumThreads, `forums[${forumPermalink ? forumPermalink : ''}]`, []).filter(
      (thread: ForumThreadEntry) =>
        _.get(thread, 'threadRef.permalink') === forumThreadPermalink &&
        // @ts-ignore
        // FIXME: Type definition
        thread.threadId === thread.id
    ),
    '[0]'
  );
}

/**
 * Search the store for a ForumThread matching the id or permalink
 * @param forumThreads
 * @param id
 * @param forumPermalink
 * @param forumThreadPermalink
 */
export function getThreadFromRedux({
  forumThreads,
  id,
  forumPermalink,
  forumThreadPermalink
}: {
  forumThreads: any;
  id?: number;
  forumPermalink: string;
  forumThreadPermalink?: string;
} & XcapOptionalParameters): ForumThreadEntry | null {
  if (id) {
    // @ts-ignore
    return _.find(_.flatten(Object.values(forumThreads.forums)), {
      id /*, __type:FT_COMPONENT_CLASS*/
    });
  }
  const forumThread = _.get(forumThreads, `forums[${forumPermalink}]`, []).filter(
    (thread: ForumThreadEntry) =>
      (_.get(thread, 'threadRef.permalink') === forumThreadPermalink &&
        // @ts-ignore
        thread.threadId === thread.id) ||
      _.get(thread, 'permalink') === forumThreadPermalink
  );

  if (forumThread.threadRef) {
    return _.get(forumThread, '[0].threadRef');
  } else {
    return _.get(forumThread, '[0]');
  }
}
