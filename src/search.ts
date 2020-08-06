// @flow
import {
	createCommunityUrl,
	_getApiUrl,
	getJson,
	post,
	Config,
	XcapJsonResult,
	XcapObject
} from './api';
import * as qnaApi from './qna';
import { Thunk } from './store';
import _ from 'lodash';
import { Request } from './request';
import { PaginatedCollection } from './PaginatedCollection';
import { LikeDataMap } from './like';

/**
 * Search functionality
 * @author jens
 * @since 13 mar 2017
 */

//order search by the folowing parameter
export enum OrderBy {
	SCORE = 'SCORE', //order by score
	CREATED_DATE = 'CREATED_DATE', //order by the created date
	VOTE_AVERAGE = 'VOTE_AVERAGE', //order by vote average
	VIEWS = 'VIEWS', //Number of views - only applies to question/forum thread
	SOLVED_DATE = 'SOLVED_DATE', //Solved date - only applies to question/forum thread
	ANSWERS = 'ANSWERS', //Number of answers - only applies to question/forum thread
	DUPLICATES = 'DUPLICATES', //Number of duplicates - only applies to question/forum thread
	HAVE_QUESTION_TOO = 'HAVE_QUESTION_TOO' //Have this question too
}

export enum Order {
	UNORDERED = 'UNORDERED', //No particular order
	ASCENDING = 'ASCENDING', //Ascending: lowest first
	DESCENDING = 'DESCENDING' //Descending: highest first
}

/**
 * Searchable types
 */
// Updating these will require updates to SearchPage.less
export const searchAbleTypes = [
	'all',
	'user',
	'article',
	'group',
	'comment'
	/*'abuse',*/
	/*'question',
	'answer',*/
	/*"cms",*/
	/*'faq',
	'blog-article',
	'forumthreads'*/
];

/**
 * Search context-type
 * @type {string}
 */
const CONTEXT = 'search';

/**
 * Search Component name
 * @type {string}
 */
const COMPONENT_NAME = 'search';

export enum SearchAbleType {
	ALL = 'all',
	USER =  'user',
	ARTICLE = 'article',
	GROUP = 'group',
	COMMENT = 'comment',
	ABUSE = 'abuse',
	QUESTION = 'question', //Qna-questions
	ANSWER = 'answer', //Qna-answers
	CMS = 'cms', //Cms-object
	BLOG_group = 'blog-group',
	BLOG_ARTICLE = 'blog-article',
	FORUM_THREADS = 'forumthreads'
}


interface GetActiveSearchTypes {
	qna?: boolean,
	group?: boolean,
	forum?: boolean,
	blog?: boolean
};

export function getActiveSearchTypes({
	qna,
	blog,
	group,
	forum
}: GetActiveSearchTypes): Array<SearchAbleType> {
	const arr = [SearchAbleType.USER, SearchAbleType.ARTICLE];
	if (qna) {
		arr.push(SearchAbleType.QUESTION);
	}
	if (blog) {
		arr.push(SearchAbleType.BLOG_ARTICLE);
	}
	if (group) {
		arr.push(SearchAbleType.GROUP);
	}
	if (forum) {
		arr.push(SearchAbleType.FORUM_THREADS);
	}
	return arr;
}

export const searchableTypeNameConverter = {
	all: 'All',
	group: 'Groups',
	user: 'Users',
	article: 'Posts',
	faq: 'FAQ',
	question: 'Questions',
	'blog-article': 'Blog',
	forumthreads: 'Forum'
	/*{key:'discussion', text:'Discussions'}*/
};

export const searchType = '/search/search';

export function getSearchBaseUrl({ request }: { request: Request }): string {
	return createCommunityUrl({ request, path: '/search' });
}

type GetSearchUrl = {
	request: Request,
	type?: SearchAbleType,
	searchType?: qnaApi.QnaSearchType,
	filter?: string,
	urlArguments?: string
};

export function getSearchUrl({
	request,
	type,
	searchType,
	filter,
	urlArguments
}: GetSearchUrl): string {
	let searchUrl = '/search';
	if (!!type) {
		searchUrl += '/' + type;
	}
	if (type === 'question') {
		if (!!searchType) {
			searchUrl += '/' + searchType;
		} else {
			searchUrl += '/all';
		}
	}
	if (!!filter) {
		searchUrl += '/' + filter;
	}
	if (!!urlArguments) {
		searchUrl += urlArguments;
	}

	return createCommunityUrl({
		request,
		path: searchUrl
	});
}

type Search = {
	q?: string,
	order?: Order,
	orderBy?: OrderBy,
	pageSize?: number,
	trendingBoost?: boolean,
	type?: SearchAbleType,
	categoryId?: number,
	community?: string,
	excludeCurrentUser?: boolean //applicable for user-search
};

export interface SearchResult extends XcapJsonResult {
	results: PaginatedCollection<XcapObject>,
	likes: LikeDataMap
}

/**
 * Search
 * @param community
 * @param urlArguments
 * @returns {Thunk.<*>}
 */
export function search({ community, ...urlArguments }: Search): Thunk<SearchResult> {
	return getJson({
		url: searchType,
		parameters: urlArguments,
		community: community,
		context: CONTEXT,
		componentName: COMPONENT_NAME
	});
}

/**
 * Get the url to the search api
 * @param xcap
 * @param type
 * @param urlArguments
 * @returns {string}
 */
export function getSearchApiUrl({
	config,
	community,
	type,
	urlArguments
}: {
	config: Config,
	community: any,
	type: string,
	urlArguments: any
}): string {
	const communityPermalink = _.get(community, 'permalink', null);
	let url = `/search${!!type ? `/${type}` : ''}`;

	let componentName, context;
	if (urlArguments.type === 'answer' || urlArguments.type === 'question') {
		componentName = COMPONENT_NAME;
		context = qnaApi.CONTEXT;
		url = '/question/search';
		/* 19 feb 2018: Backend support in place
		//FIXME: Need to add backend-support for type=answer on care backend
		if(urlArguments.type === 'answer'){
			urlArguments.type='net.josh.community.forum.ForumThreadEntry'
		}
		*/
	}
	return _getApiUrl({
		state: { communities: { community }, config },
		url,
		parameters: urlArguments,
		community: communityPermalink,
		componentName,
		context
	});
}

/**
 * Get statistics.
 *
 * @param types {String} Comma separated string of xcap object class names.
 * @param facetCount {String}
 * @param createdStartDate {Date} Iso date format (yyyy-MM-dd)
 * @param createdEndDate {Date} Iso date format (yyyy-MM-dd)
 * @param aggregateToDays {boolean}
 * @param moderationVisibility {boolean}
 * @param pageSize {Number}
 * @param page {Number}
 * @return {Promise}
 */
export function getStatistics({
	facetCount,
	createdStartDate,
	createdEndDate,
	aggregateToDays,
	moderationVisibility,
	pageSize,
	page = 1
}: {
	facetCount?: string,
	createdStartDate?: string,
	createdEndDate?: string,
	aggregateToDays?: boolean,
	moderationVisibility?: boolean,
	pageSize?: number,
	page?: number
}): Thunk<XcapJsonResult> {
	return getJson({ url: '/search/statistics', parameters: arguments });
}

/**
 * The available search index populators
 * {@see populateSearchIndex}
 */
export const SEARCH_INDEX_POPULATORS: Array<{ name: string, className: string }> = [
	{
		name: 'Blogs and blog entries',
		className: 'se.josh.xcap.search.populate.BlogEntrySearchIndexPopulator'
	},
	{
		name: 'Comments',
		className: 'se.josh.xcap.search.populate.CommentSearchIndexPopulator'
	},
	{
		name: 'Events (ignores the date setting)',
		className: 'se.josh.xcap.search.populate.EventSearchIndexPopulator'
	},
	{
		name: 'Forum',
		className: 'se.josh.xcap.search.populate.ForumThreadEntrySearchIndexPopulator'
	},
	{
		name: 'Users',
		className: 'se.josh.xcap.search.populate.UserSearchIndexPopulator'
	},
	{
		name: 'Media',
		className: 'se.josh.xcap.search.populate.MediaSearchIndexPopulator'
	},
	{
		name: 'Group',
		className: 'se.josh.xcap.search.populate.GroupSearchIndexPopulator'
	},
	{
		name: 'Abuse reports',
		className: 'se.josh.xcap.search.populate.ReferencedAbuseSearchIndexPopulator'
	}
];

export interface PopulateSearchIndexResult extends XcapJsonResult {
	/** Number of objects added/updated to the index */
	nIndexed: number,

	/** Execution time in ms */
	executeTime: number
}

/**
 * Populate the search index
 *
 * Requires admin privs.
 *
 * @param modifiedSince Update only objects modified since this date. Otherwise all. ISO Date format (2006-04-07)
 * @param populator String array of populator class names to run. {@see SEARCH_INDEX_POPULATORS}.
 * @returns {Thunk<PopulateSearchIndexResult>}
 */
export function populateSearchIndex({
	modifiedSince,
	populator
}: {
	modifiedSince: string | null,
	populator: Array<string> | null
}): Thunk<PopulateSearchIndexResult> {
	return post({
		url: '/search/admin/populate-index',
		parameters: arguments
	});
}
