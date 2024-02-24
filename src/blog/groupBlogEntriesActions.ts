// @flow
import get from 'lodash/get';
import update from 'immutability-helper';
import { Category } from '../category';
import { fetchMyGroups, receiveGroups, receiveGroupsAuth } from '../group/groupActions';
import { receiveBlogs } from './blogActions';
import { Group, listMyGroups } from '../group';
import { getJsonErrorText, newXcapJsonErrorResult, Thunk } from '../api';
import * as commentActions from '../comments/commentAction';
import * as commentApi from '../comments';
import { GetCommentResult, GetMultipleCommentsResult } from '../comments';

import {
  getGroupBlogState,
  GroupBlogEntriesActions,
  GroupBlogEntriesState,
  GroupBlogState,
  hasBlogEntries,
  INVALIDATE_GROUP_BLOG_ENTRIES,
  RECEIVE_GROUP_BLOG_ENTRIES,
  REQUEST_GROUP_BLOG_ENTRIES,
  UPDATE_GROUP_BLOG_ENTRY,
  UpdateBlogEntry
} from './groupBlogEntriesReducer';

import {
  BlogEntry,
  GetBlogEntryResult,
  getCompositeBlogKey,
  getEntries,
  GetEntriesResult,
  getEntry,
  SaveBlogEntryInput,
  saveEntry,
  SaveEntryResult,
  SetEntryStatus,
  setEntryStatus
} from './index';
import { receiveLikes } from '../like/likeActions';
import { PaginatedCollection } from '../api/PaginatedCollection';
import { eventsReceived } from '../event/eventActions';
import { updatePoll, updatePolls } from '../poll/pollActions';
import { AuthObject } from '../user/privileges';
import { Poll } from '../poll';

//import { sendEventToGA } from '../analytics/analyticsFunctions.js';

/**
 * Load comments in a group and for a specific blogEntry
 *
 * @since 15 fen 2017
 * @author pelle
 */

/**
 * When loading comments receive is run when the server has responded
 * @param blogKey
 * @param json
 */
export function receiveBlogEntries(blogKey: string, json: GetEntriesResult): GroupBlogEntriesActions {
  return {
    type: RECEIVE_GROUP_BLOG_ENTRIES,
    blogKey,
    json,
    receivedAt: Date.now()
  };
}

/**
 * Discard cached blog entries
 * @param blogKey
 */
export function cleanCacheBlogEntries({ blogKey }: { blogKey: string }): GroupBlogEntriesActions {
  return {
    type: INVALIDATE_GROUP_BLOG_ENTRIES,
    blogKey
  };
}

/**
 * Request comments from the server
 * @param blogKey
 */
export function requestBlogEntries(blogKey: string): GroupBlogEntriesActions {
  return {
    type: REQUEST_GROUP_BLOG_ENTRIES,
    blogKey
  };
}

/**
 * Update already existing blog entry.
 * Only the last BlogEntry of json.resultPaginated.entries will be updated.
 */
export function updateBlogEntry(blogKey: string, json: UpdateBlogEntry): GroupBlogEntriesActions {
  return {
    type: UPDATE_GROUP_BLOG_ENTRY,
    blogKey,
    json,
    receivedAt: Date.now()
  };
}

export interface FetchBlogEntries {
  blogKey: string; //The id of the blogKey that you want to store the data in redux
  pageSize?: number;
  p?: number; //page number in paginated collection
  categories?: Array<Category>;
  invalidatePrevious?: boolean; //if true, invalidates previous blog-entries in this blog,
  goToBlogEntry?: string; // Start the pagination at the specified entry permalink
  tags?: string[]; // Limit the listing to entries with the supplied tags
}

/**
 * Requests and receive blog entries and store them in redux-state
 */
export function fetchBlogEntries({
  blogKey,
  pageSize = 15,
  p = 1,
  categories,
  invalidatePrevious = false,
  goToBlogEntry,
  tags
}: FetchBlogEntries): Thunk<Promise<GetEntriesResult | null>> {
  return async (dispatch: any, getState): Promise<GetEntriesResult | null> => {
    const categoryId = get(categories, '[0].id', undefined);
    const compositeBlogKey = getCompositeBlogKey({ blogKey, tags });

    try {
      const { currentUser, groups, groupBlogEntries } = getState();

      // FIXME: Really list groups here?
      const auth = get(groups, 'auth', {});
      try {
        if (get(currentUser, 'isLoggedIn', false) && (auth == null || Object.keys(auth).length === 0)) {
          await dispatch(fetchMyGroups());
        }
      } catch (e) {
        console.error("Couldn't receiveGroupsAuth in fetchBlogEntries for " + blogKey + ': ', e);
      }

      // Ignore if already present
      if (
        hasBlogEntries(groupBlogEntries, compositeBlogKey, pageSize, p, categoryId, goToBlogEntry) &&
        !invalidatePrevious
      ) {
        return null;
      }

      dispatch(requestBlogEntries(compositeBlogKey));

      // FIXME: Category id not used in key?
      const result: GetEntriesResult = await dispatch(
        getEntries({ blogKey, pageSize, p, categoryId, goToBlogEntry, tags })
      );
      if (result.error) {
        return result;
      }

      // FIXME: this should use the blog object returned by the above call, because this fails if there are no entries
      const group = result.blog?.groupRef;
      if (group) {
        dispatch(receiveGroups({ entries: [group] }));
      } else {
        console.error("Couldn't receiveGroups in fetchBlogEntries for " + blogKey + '. Entries: ', result);
      }
      const blog = result.blog;
      if (blog) {
        const authObjects: { [blogId: number]: AuthObject } = {};
        // FIXME: Workaround for different return types
        if (result.authBlog) {
          if (result.authBlog.auth) {
            authObjects[blog.id] = result.authBlog.auth;
          } else {
            authObjects[blog.id] = result.authBlog as any;
          }
        }

        await dispatch(
          receiveBlogs({
            entries: [blog],
            authBlogs: result.authBlog ? [result.authBlog] : undefined,
            authObjects
          })
        );
      } else {
        console.error("Couldn't receiveBlogs in fetchBlogEntries for " + blogKey + '. Entries: ', result);
      }

      if (invalidatePrevious) {
        dispatch(cleanCacheBlogEntries({ blogKey: compositeBlogKey }));
      }

      dispatch(receiveLikes(result.likes));

      dispatch(
        eventsReceived({
          relatedObjects: result.__relatedObjects,
          rsvpUserIds: result.rsvpUserIds,
          currentUserRsvpStatuses: result.userRsvpStatuses
        })
      );

      const polls: Array<Poll> = [];
      result.resultPaginated.entries.forEach((e: BlogEntry) => {
        if (e.pollRef) {
          polls.push(e.pollRef);
        }
      });
      dispatch(updatePolls(polls));

      dispatch(receiveBlogEntries(compositeBlogKey, result));

      return result;
    } catch (e) {
      console.error("Couldn't fetchBlogEntries for " + blogKey + ': ', e);
      return newXcapJsonErrorResult<GetEntriesResult>("Couldn't fetchBlogEntries for " + blogKey);
    }
  };
}

/**
 * Requests and receive entries and store them in redux-state
 */
export function fetchBlogEntry({
  id,
  permalink,
  blogKey
}: {
  id?: number;
  permalink?: string;
  blogKey: string;
}): Thunk<Promise<GetBlogEntryResult | null>> {
  return async (dispatch: any, getState): Promise<GetBlogEntryResult | null> => {
    // FIXME: error handling
    try {
      await dispatch(requestBlogEntries(blogKey));
      const { currentUser, groups } = getState();
      const auth = groups?.auth || null;
      if (currentUser?.isLoggedIn && (auth == null || Object.keys(auth).length === 0)) {
        const r = await dispatch(listMyGroups({}));
        await dispatch(receiveGroupsAuth({ entries: r.groupAuth }));
      }

      const response: GetBlogEntryResult = await dispatch(getEntry({ id, entryPermaLink: permalink, blogKey }));
      if (response.error) {
        return response;
      }

      dispatch(receiveLikes(response.likes));
      dispatch(
        eventsReceived({
          relatedObjects: response.__relatedObjects
        })
      );
      if (response.blogEntry) {
        dispatch(updatePoll(response.blogEntry.pollRef));
      }

      await dispatch(_fetchBlogEntry(blogKey, response));
      return response;
    } catch (e) {
      console.log('Error fetchBlogEntry ' + (id ? id : permalink ? permalink : '') + ' from ' + blogKey + ':', e);
      return null;
    }
  };
}

export interface FetchBlogEntriesWithComments {
  blogKey: string;
  page?: number;
  categories?: Array<Category>;
  goToBlogEntry?: string;
  invalidatePrevious?: boolean;
  tags?: string[];
}

export interface FetchBlogEntriesWithCommentsResult {
  fetchBlogEntries: GetEntriesResult | null;
  fetchMultipleComments: GetMultipleCommentsResult | null;
}

/**
 * Fetch blog entries and their comments
 * @param blogKey
 * @param page
 * @param categories
 * @param goToBlogEntry
 * @param invalidatePrevious
 */
export function fetchBlogEntriesWithComments({
  blogKey,
  page = 1,
  categories,
  goToBlogEntry,
  invalidatePrevious = false,
  tags
}: FetchBlogEntriesWithComments): Thunk<Promise<FetchBlogEntriesWithCommentsResult>> {
  return async (dispatch: any): Promise<FetchBlogEntriesWithCommentsResult> => {
    let blogResponse: GetEntriesResult | null = null;
    let commentResponse: GetMultipleCommentsResult | null = null;
    try {
      blogResponse = await dispatch(
        fetchBlogEntries({ blogKey, p: page, categories, goToBlogEntry, invalidatePrevious, tags })
      );
      if (blogResponse) {
        if (blogResponse.error) {
          console.error(
            'Could not get blog entries for ' + blogKey + ': ',
            blogResponse ? getJsonErrorText(blogResponse) : ''
          );
          return {
            fetchBlogEntries: blogResponse,
            fetchMultipleComments: null
          };
        }
        const referenceIds = blogResponse.resultPaginated.entries.map((entry: BlogEntry) => entry.id);

        commentResponse = dispatch(
          commentActions.fetchMultipleComments({
            module: commentApi.CommentModule.BLOG,
            referenceIds,
            referenceGroupId: blogResponse.blogId
          })
        );
      } else {
        // No result, probably not needed cause already in store
        return {
          fetchBlogEntries: null,
          fetchMultipleComments: null
        };
      }
    } catch (e) {
      //FIXME: Probably a private group but need fail-check
      console.error("Couldn't fetchBlogEntriesWithComments for " + blogKey + ': ', blogResponse, commentResponse, e);
    }

    return {
      fetchBlogEntries: blogResponse,
      fetchMultipleComments: commentResponse
    };
  };
}

export interface FetchBlogEntryWithCommentsResult {
  fetchBlogEntry: GetBlogEntryResult | null;
  fetchComments: GetCommentResult | null;
}

/**
 * Fetch a blog entry and its comments
 * @param id
 * @param permalink
 * @param blogKey
 */
export function fetchBlogEntryWithComments({
  id,
  permalink,
  blogKey
}: {
  id?: number;
  permalink?: string;
  blogKey: string;
}): Thunk<Promise<FetchBlogEntryWithCommentsResult>> {
  return async (dispatch: any): Promise<FetchBlogEntryWithCommentsResult> => {
    let blogResponse: GetBlogEntryResult | null = null;
    let commentsResponse: GetCommentResult | null = null;
    try {
      blogResponse = await dispatch(fetchBlogEntry({ id, permalink, blogKey }));
      if (!blogResponse) {
        return { fetchBlogEntry: null, fetchComments: null };
      }

      if (!blogResponse.error) {
        dispatch(
          eventsReceived({
            relatedObjects: blogResponse.__relatedObjects
          })
        );
        dispatch(updatePoll(blogResponse.blogEntry?.pollRef));
      }
      const blogEntry = blogResponse.blogEntry;
      if (blogEntry) {
        dispatch(receiveLikes(blogResponse.likes));
        commentsResponse = dispatch(
          commentActions.fetchComments({
            module: commentApi.CommentModule.BLOG,
            referenceId: blogEntry.id,
            referenceGroupId: blogEntry.blogId
          })
        );
      } else {
        console.warn(
          'No such blog entry. id=' +
            (id ? id : '?') +
            ', permalink=' +
            (permalink ? permalink : '?') +
            ', blogKey=' +
            blogKey
        );
      }
    } catch (e) {
      //FIXME: Probably a private group but need fail-check
      console.warn(e);
    }
    return {
      fetchBlogEntry: blogResponse,
      fetchComments: commentsResponse
    };
  };
}

function _fetchBlogEntry(blogKey: string, json: GetBlogEntryResult): Thunk<any> {
  return (dispatch: any): any => {
    const groupRef: Group | null = json.blog?.groupRef || json.blogEntry?.blogRef?.groupRef;
    if (groupRef) {
      dispatch(receiveGroups({ entries: [groupRef] }));
    }
    const blog = json.blog || json.blogEntry?.blogRef;
    if (blog) {
      dispatch(receiveBlogs({ entries: [blog], authBlogs: json.authBlog ? [json.authBlog] : undefined }));
    }

    const resultPaginated = { entries: [json.blogEntry] } as PaginatedCollection<BlogEntry>;

    return dispatch(
      receiveBlogEntries(blogKey, {
        resultPaginated,
        likes: json.likes
      } as GetEntriesResult)
    );
  };
}

/**
 * Edit or create a blog entry.
 *
 * @param blogEntryInput
 * @param type
 * @param draftId
 * @param blogKey
 */
export function postBlogEntry({
  blogEntryInput,
  type,
  draftId,
  blogKey
}: {
  blogEntryInput: SaveBlogEntryInput;
  type: 'PUBLISHED' | '';
  blogKey: string; //The id of the blogKey that you want to store the data in redux
  draftId?: number;
}): Thunk<Promise<SaveEntryResult>> {
  return async (dispatch: any, getState): Promise<SaveEntryResult> => {
    dispatch(requestBlogEntries(blogKey));

    const response: SaveEntryResult = await dispatch(
      saveEntry({
        blogEntryInput,
        type,
        draftId,
        blogKey
      })
    );

    if (response.error) {
      return response;
    }

    //In order to keep pagination-object we need to merge with current state
    const { groupBlogEntries }: { groupBlogEntries: GroupBlogEntriesState } = getState() as any;
    const groupBlogState: GroupBlogState | null = getGroupBlogState(groupBlogEntries, blogKey);
    const resultPaginated = update(get(groupBlogState, 'json.resultPaginated', {}), {
      entries: { $push: [response.entry] }
    });

    // FIXME: Fake some data. should not be needed
    const getEntriesResult: GetEntriesResult = {
      resultPaginated
    } as GetEntriesResult;

    dispatch(
      eventsReceived({
        relatedObjects: response.__relatedObjects
      })
    );

    dispatch(updatePoll(response.entry?.pollRef));

    if (!!blogEntryInput.id && blogEntryInput.id > 0) {
      //dispatch(sendEventToGA(gaEditPostEventObject({ blogEntry: response.entry })));

      dispatch(updateBlogEntry(blogKey, getEntriesResult));
    } else {
      //Add new blogEntry
      // FIXME: Re add ga
      //dispatch(sendEventToGA(gaPostEventObject({ blogEntry: response.entry })));
      dispatch(receiveBlogEntries(blogKey, getEntriesResult));
    }

    return response;
  };
}

/**
 * Set the  {@link BlogEntryStatus} of an entry.
 * @param blogKey
 * @param id
 * @param status
 */
export function changeBlogEntryStatus({ blogKey, id, status }: SetEntryStatus): Thunk<Promise<void>> {
  return async (dispatch: any): Promise<void> => {
    const response = await dispatch(setEntryStatus({ blogKey, id, status }));
    dispatch(updateBlogEntry(blogKey, { resultPaginated: { entries: [response.entry] } }));
  };
}
