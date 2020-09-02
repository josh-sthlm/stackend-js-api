// @flow
import {
  getJson as apiGetJson,
  post as apiPost,
  createCommunityUrl,
  XcapJsonResult,
  Thunk,
  XcapOptionalParameters,
} from '../api';
import * as searchApi from '../search';
import * as forumApi from '../forum';
import { Request } from '../request';
import { SearchAbleType } from '../search';

/**
 * Xcap QNA API constants and methods.
 *
 * @since 2 mar 2017
 */

/**
 * Community context used for QNA
 */
export const CONTEXT = 'question';

/**
 * Permalink of the question forum
 */
export const QUESTION_FORUM_PERMALINK = 'question';

export type ContentType = 'askQuestion' | 'tags' | 'searchSearchInput'; //which redux filter group should this effect?

export enum QnaSearchType {
  All = 'All',
  Trending = 'Trending',
  Solved = 'Solved',
  Answered = 'Answered',
  Recent = 'Recent',
  Posted = 'Posted',
  Search = 'search', // FIXME: Hack
}

export const COMPONENT_NAME = 'forum';

function getJson(args: any): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      apiGetJson({
        ...args,
        componentName: COMPONENT_NAME,
        context: CONTEXT,
      })
    );
  };
}

function post(args: any): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      apiPost({
        ...args,
        componentName: COMPONENT_NAME,
        context: CONTEXT,
      })
    );
  };
}

export function QnaTypeConverter(type: QnaSearchType): string {
  return type ? type.toLowerCase() : 'search';
}

export function getQnaSearchSortOrders(): Array<string> {
  return ['search', 'trending', 'solved', 'answered', 'recent'];
}

/**
 * returns the url to view the Qnas.
 */
export function getQnaUrl({
  request,
  section = '',
  article = '',
}: {
  request: Request;
  section?: string;
  article?: string;
}): string {
  if (!!section && !article) {
    return searchApi.getSearchUrl({
      request,
      type: SearchAbleType.QUESTION,
      // FIXME: What is this
      // @ts-ignore
      searchType: 'search',
      filter: section,
    });
  }

  return createCommunityUrl({
    request,
    path: '/support' + (article ? '/question/' + article : ''),
  });
}

/**
 * returns the url to Ask a question in the Qnas.
 */
export function getQnaAskUrl({ request }: { request: Request }): string {
  // FIXME: Why absolute?
  return createCommunityUrl({
    request,
    path: '/support/ask-a-question',
    absolute: true,
  });
}

/**
 * returns the url to view the Qnas.
 */
export function getQnaQuestionUrl({
  request,
  permalink,
  absolute,
}: {
  request: Request;
  permalink: string;
  absolute?: boolean;
}): string {
  // FIXME: Why absolute by default?
  return createCommunityUrl({
    request,
    absolute: absolute ? absolute : true,
    path: '/support/question/' + permalink,
  });
}

/**
 * List trending questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function listTrendingQuestions({
  p,
  pageSize,
}: { p: number; pageSize: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/question/trending', parameters: arguments });
}

/**
 * List solved questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function listSolvedQuestions({
  p,
  pageSize,
}: { p: number; pageSize: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/question/solved', parameters: arguments });
}

/**
 * List answered questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listAnsweredQuestions({
  p,
  pageSize,
}: { p: number; pageSize: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/question/answered', parameters: arguments });
}

/**
 * List posted questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listPostedQuestions({
  p,
  pageSize,
}: { p: number; pageSize: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/question/posted', parameters: arguments });
}

/**
 * Get a question
 */
export function getQuestion({
  id,
  forumThreadPermalink,
}: {
  id?: number;
  forumThreadPermalink?: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/question/view', parameters: arguments });
}

/**
 * Ask a question
 */
export function askQuestion({
  subject,
  text,
  categoryId = [],
  recaptchaSolved,
  recpatchaAnswer,
  gamePermalink,
  entryId,
  forumThreadPermalink,
  forumPermalink = 'question',
}: {
  subject: string;
  text: string;
  categoryId?: Array<number>; //Category Ids
  recaptchaSolved?: boolean; //is it solved?.
  recpatchaAnswer?: string; //The answer.
  gamePermalink?: string; //Game permalink
  entryId?: string; //Allows moderators to edit an existing question.
  forumThreadPermalink?: any; // Allows moderators to edit an existing question.
  forumPermalink?: string; // which forum should this post to?
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/question/ask-save', parameters: arguments });
}

/**
 * Submit an answer
 */
export function submitAnswer({
  subject,
  text,
  categoryId = [],
  gamePermalink,
  entryId,
  forumThreadPermalink = null,
  forumPermalink = 'question',
}: {
  text: string;
  subject?: string;
  categoryId?: Array<number>;
  gamePermalink?: string;
  entryId?: number; //Allows moderators to edit an existing question.
  forumThreadPermalink?: any; //Allows moderators to edit an existing question.
  forumPermalink?: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/question/answer-save', parameters: arguments });
}

/**
 * Solve question
 *
 * @param answerId {int} Id.
 */
export function solveQuestion({
  answerId,
}: { answerId: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/question/solve', parameters: arguments });
}

/**
 * Get question categories
 * @returns {Thunk.<*>}
 */
export function getCategories({}: XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/question/list-categories' });
}

/**
 * Search
 */
export function search({
  searchType,
  q,
  issue,
  p,
  pageSize,
  game,
}: {
  searchType: QnaSearchType;
  q: string; //Search term
  p?: number; //Page number
  pageSize?: number;
  issue?: string;
  platform?: number;
  game?: string; // qna-gamePermalink
  device?: string; // "ios" || "android"
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/question/' + searchType, parameters: arguments });
}

type GaTrackThread = {
  forumThreadEntry: forumApi.ForumThreadEntry;
};

export function gaQuestionEventObject({ forumThreadEntry }: GaTrackThread): any {
  return forumApi.getEventObject('question_post', forumThreadEntry);
}

export function gaAnswerEventObject({ forumThreadEntry }: GaTrackThread): any {
  return forumApi.getEventObject('answer_post', forumThreadEntry);
}
