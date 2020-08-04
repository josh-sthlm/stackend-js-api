// @flow
import {
	getJson as apiGetJson,
	post as apiPost,
	getCurrentCommunityPermalink,
	getAbsoluteApiBaseUrl,
	createCommunityUrl
} from '../xcap/api.js';
import * as searchApi from '../search/search.js';
import * as forumApi from '../forum/forum.js';
import type { Thunk } from '../types/store.js';
import { type Request } from '../request.js';
import { Theme } from '../stackend/stackend';
import _ from 'lodash/object';
import { DeployProfile } from '../xcap/api';

/**
 * Xcap QNA API constants and methods.
 * @author jens
 * @since 2 mar 2017
 */

export type SearchType = 'search' | 'trending' | 'solved' | 'answered' | 'recent' | 'posted'; //Diferent searchTypes for qna
export type FilterTypes = 'game' | 'platform' | 'issue' | 'device'; //Qna filter types for questions
//export type IssueTypes = 'bugs-android' | 'bugs-ios' | 'game-feedback' | 'strategy' | 'tips-and-tricks' | 'general' | 'feature-suggestion'
export type IssueTypes = $Values<typeof issueTypes>;

/*export const issueTypes = {
	'paymentIssue': 'payment-issue',
	'techIssue': 'tech-issue',
	'facebookAndAccountIssues': 'facebook-and-account-issues',
	'goldBars': 'gold-bars',
	'magicBeans': 'magic-beans',
	'boosters': 'boosters',
	'levelProgress': 'level-progress',
	'offTopic': 'off-topic',
	'gamePlay': 'game-play',
	'sendingReceivingLives': 'sending-receiving-lives',
	'myProgress': 'my-progress',
	'newLevelsPassingLevels': 'new-levels-passing-levels',
	'howToPlay': 'how-to-play'
};*/

export const issueTypes = {
	technicalAndConnectionIssues: 'technical-connection-issues',
	purchasesAndGoldBars: 'purchases-gold-bars',
	newLevelsLevelHelp: 'new-levels-level-help',
	specialInGameEventsAndPromotions: 'events-promotions',
	howToPlay: 'how-to-play',
	livesMessages: 'lives-messages',
	facebookAndKingdomProfiles: 'facebook-kingdom-profiles',
	myGameProgress: 'game-progress'
};

/**
 * Community context used for QNA
 */
export const CONTEXT: string = 'question';

/**
 * Permalink of the question forum
 */
export const QUESTION_FORUM_PERMALINK: string = 'question';

export type ContentType = 'askQuestion' | 'tags' | 'searchSearchInput'; //which redux filter group should this effect?

export type QnaSearchType = 'All' | 'Trending' | 'Solved' | 'Answered' | 'Recent' | 'Posted';
export const qnaSearchType = {
	All: 'All',
	Trending: 'Trending',
	Solved: 'Solved',
	Answered: 'Answered',
	Recent: 'Recent',
	Posted: 'Posted'
};

export const COMPONENT_NAME: string = 'forum';

function getJson(args) {
	return (dispatch: any, getState: any) => {
		// Use the forum context on black
		const { communities, config } = getState();
		let context: string = CONTEXT;
		if (
			config.deployProfile === DeployProfile.CASTLE &&
			_.get(communities, 'community.theme', Theme.CASTLE_ORANGE) !== Theme.CASTLE_ORANGE
		) {
			context = 'forum';
		}

		return dispatch(
			apiGetJson({
				...args,
				componentName: COMPONENT_NAME,
				context
			})
		);
	};
}

function post(args) {
	return (dispatch: any, getState: any) => {
		// Use the forum context on black
		const { communities, config } = getState();
		let context: string = CONTEXT;
		if (
			config.deployProfile === DeployProfile.CASTLE &&
			_.get(communities, 'community.theme', Theme.CASTLE_ORANGE) !== Theme.CASTLE_ORANGE
		) {
			context = 'forum';
		}

		return dispatch(
			apiPost({
				...args,
				componentName: COMPONENT_NAME,
				context
			})
		);
	};
}

export function QnaTypeConverter(type: QnaSearchType) {
	const qnaTypes = {
		All: 'search',
		Trending: 'trending',
		Solved: 'solved',
		Answered: 'answered',
		Recent: 'recent',
		Posted: 'posted'
	};
	return qnaTypes[type] || 'search';
}

/**
 * Get server
 * @deprecated api.getJson/api.post handles this automatically
 * @param isQna
 */
export function getServer(isQna: boolean = true, community?: string): Thunk<*> {
	return async (dispatch: any) => {
		declare var xcapQNAJsonApiUrl: string;

		if (!!xcapQNAJsonApiUrl && !!isQna) {
			return xcapQNAJsonApiUrl;
		}

		let communityPermalink = await dispatch(getCurrentCommunityPermalink());
		return await dispatch(getAbsoluteApiBaseUrl(communityPermalink));
	};
}

export function getQnaSearchSortOrders() {
	return ['search', 'trending', 'solved', 'answered', 'recent'];
}

/**
 * returns the url to view the Qnas.
 */
export function getQnaUrl({
	request,
	section = '',
	article = ''
}: {
	request: Request,
	section?: string,
	article?: string
}): string {
	if (!!section && !article) {
		return searchApi.getSearchUrl({
			request,
			type: 'question',
			searchType: 'search',
			filter: section
		});
	}

	return createCommunityUrl({
		request,
		path: '/support' + (!!article ? '/question/' + article : '')
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
		absolute: true
	});
}

/**
 * returns the url to view the Qnas.
 */
export function getQnaQuestionUrl({
	request,
	permalink,
	absolute
}: {
	request: Request,
	permalink: string,
	absolute?: boolean
}): string {
	// FIXME: Why absolute by default?
	return createCommunityUrl({
		request,
		absolute: !!absolute ? absolute : true,
		path: '/support/question/' + permalink
	});
}

/**
 * List trending questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function listTrendingQuestions({ p, pageSize }: { p: number, pageSize: number }): Thunk<*> {
	return getJson({ url: '/question/trending', parameters: arguments });
}

/**
 * List solved questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 * @returns {Promise}
 */
export function listSolvedQuestions({ p, pageSize }: { p: number, pageSize: number } = {}): Thunk<
	*
> {
	return getJson({ url: '/question/solved', parameters: arguments });
}

/**
 * List answered questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listAnsweredQuestions({ p, pageSize }: { p: number, pageSize: number } = {}): Thunk<
	*
> {
	return getJson({ url: '/question/answered', parameters: arguments });
}

/**
 * List posted questions
 *
 * @param p Page number (optional)
 * @param pageSize Page size (optional)
 */
export function listPostedQuestions({ p, pageSize }: { p: number, pageSize: number } = {}): Thunk<
	*
> {
	return getJson({ url: '/question/posted', parameters: arguments });
}

/**
 * Get a question
 */
export function getQuestion({
	id,
	forumThreadPermalink
}: {
	id?: number,
	forumThreadPermalink?: string
}): Thunk<*> {
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
	forumPermalink = 'question'
}: {
	subject: string,
	text: string,
	categoryId?: Array<number>, //Category Ids
	recaptchaSolved?: boolean, //is it solved?.
	recpatchaAnswer?: string, //The answer.
	gamePermalink?: string, //Game permalink
	entryId?: string, //Allows moderators to edit an existing question.
	forumThreadPermalink?: any, // Allows moderators to edit an existing question.
	forumPermalink?: string // which forum should this post to?
}): Thunk<*> {
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
	forumPermalink = 'question'
}: {
	text: string,
	subject?: string,
	categoryId?: Array<number>,
	gamePermalink?: string,
	entryId?: number, //Allows moderators to edit an existing question.
	forumThreadPermalink?: any, //Allows moderators to edit an existing question.
	forumPermalink?: string
}): Thunk<*> {
	return post({ url: '/question/answer-save', parameters: arguments });
}

/**
 * Solve question
 *
 * @param answerId {int} Id.
 */
export function solveQuestion({ answerId }: { answerId: number } = {}): Thunk<*> {
	return post({ url: '/question/solve', parameters: arguments });
}

/**
 * Get question categories
 * @returns {Thunk.<*>}
 */
export function getCategories(): Thunk<*> {
	return getJson({ url: '/question/list-categories' });
}

/**
 * Search
 */
export function search({
	searchType = 'search',
	q,
	issue,
	p,
	pageSize,
	game
}: {
	searchType: SearchType, //type of search, ex: 'trending', 'solved' //searchType
	q: string, //Search term
	p?: number, //Page number
	pageSize?: number,
	issue?: IssueTypes, //"tips-and-tricks", 'bugs-android'..
	platform?: number,
	game?: string, // qna-gamePermalink
	device?: string // "ios" || "android"
}): Thunk<*> {
	return getJson({ url: '/question/' + searchType, parameters: arguments });
}

type GaTrackThread = {
	forumThreadEntry: forumApi.ForumThreadEntry
};

export function gaQuestionEventObject({ forumThreadEntry }: GaTrackThread) {
	return forumApi.getEventObject('question_post', forumThreadEntry);
}

export function gaAnswerEventObject({ forumThreadEntry }: GaTrackThread) {
	return forumApi.getEventObject('answer_post', forumThreadEntry);
}
