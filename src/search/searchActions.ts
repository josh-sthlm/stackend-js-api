// @flow
import _ from 'lodash';
import * as loadJsonActions from '../LoadJson';
import * as groupActions from '../group/groupActions';
import * as xcapApi from '../api';
import {
	SearchAbleType,
	Order,
	OrderBy,
	getActiveSearchTypes,
	search as _search, getSearchBaseUrl
} from '../search'
import * as qnaApi from '../qna';
import * as groupApi from '../group';
import { Dispatch} from 'redux';
import * as reducer from './searchReducer';
import { getRequest } from '../request'
import { Thunk } from '../api'

//Change Text
type UpdateSearchString = {
	q: string, // searchString/queryString
	p?: number //pageNumber
};

export function updateSearchString({ q, p = 1 }: UpdateSearchString): any {
	return {
		type: reducer.UPDATE_SEARCH_STRING,
		q,
		p
	};
}

type UpdateSelectedType = {
	request: any,
	type: SearchAbleType, // selected filter
	updateUrl?: boolean, //change the url or not
	p?: number //pageNumber
};

declare var browserHistory: { push: (log:string) => any };
declare var __xcapRunningServerSide: string;

//Change Filter
export function updateSelectedType({
	type,
	p = 1,
	updateUrl = true
}: UpdateSelectedType): Thunk<void> {

	return async (dispatch, getState) => {
		if (updateUrl) {
			const request = await dispatch(getRequest());
			browserHistory.push(getSearchBaseUrl({ request }) + '/' + type.toLocaleLowerCase());
		}
		dispatch(_updateSelectedType({ selectedType: type, p }));
	};
}

type _UpdateSelectedType = {
	selectedType: SearchAbleType, // selected filter
	p?: number //pageNumber
};
function _updateSelectedType({ selectedType, p = 1 }: _UpdateSelectedType): any {
	return {
		type: reducer.UPDATE_SELECTED_TYPE,
		selectedType,
		p
	};
}

type Search = {
	reduxStorageUrl: string,
	searchParams: {
		q: any, //string
		tag?: any,
		selectedFilters?: any,
		type?: Array<SearchAbleType>,
		gameId?: number,
		order?: Order,
		orderBy?: OrderBy,
		pageSize?: number,
		trendingBoost?: boolean,
		categoryId?: number,
		qnaParams?: any,
		p?: number //Page number,
	},
	singleTypeSearch?: boolean
};

// Convert qna style ordering to search ordering
function convertSearchTypeToOrderBy(params: { searchType?: string }) {
	let { searchType: orderBy } = params;
	const newParams = Object.assign({}, params);

	switch (orderBy) {
		case 'All':
			orderBy = 'SCORE';
			break;
		case 'Recent':
			orderBy = 'CREATED_DATE';
			break;
		default:
			return params;
	}

	newParams.orderBy = orderBy;
	return newParams;
}
//Search
export function search({ reduxStorageUrl, searchParams, singleTypeSearch }: Search) {

	let { q } = searchParams;
	if (q.indexOf('#') > -1) {
		const start = q.indexOf('#');
		const end = q.indexOf(' ', start) > -1 ? q.indexOf(' ', start) : q.length;
		searchParams.tag = q.substring(start + 1, end);
		q = q.substring(0, start) + q.substring(end, q.length);
	}

	const qnaSearchType =
		!!searchParams.selectedFilters && searchParams.selectedFilters.searchType
			? qnaApi.QnaTypeConverter(searchParams.selectedFilters.searchType)
			: 'search';
	//delete searchParams.selectedFilters.searchType;
	//delete searchParams.selectedFilters.updateUrl;
	searchParams = Object.assign({}, searchParams, { ...searchParams.selectedFilters });
	delete searchParams.selectedFilters;

	return (dispatch: Dispatch, getState: GetState) => {
		let { type } = searchParams;
		const filters =
			!!singleTypeSearch && !!type
				? type
				: getActiveSearchTypes(_.get(getState(), 'communities.community.settings'));

		return filters.map(filter => {
			return (async () => {
				let { type, ...parsedSearchParams } = searchParams;
				if (filter !== _.get(type, '[0]')) {
					parsedSearchParams.p = 1;
				}
				const storageName = reduxStorageUrl + '-' + filter;
				dispatch(loadJsonActions.requestJson(storageName));

				if (filter === 'question') {
					try {
						const game = await dispatch(xcapApi.getCurrentCommunityPermalink());
						const json = await dispatch(
							qnaApi.search({
								...parsedSearchParams,
								searchType: qnaSearchType,
								game
							})
						);
						dispatch(loadJsonActions.recieveJson(storageName, json));
						return json;
					} catch (e) {
						console.error('searchApi.search question caught an error: ', e);
					}
				} else if (filter === 'forumthreads') {
					// rename searchType variable
					try {
						const game = await dispatch(xcapApi.getCurrentCommunityPermalink());
						let json = await dispatch(
							_search({ ...convertSearchTypeToOrderBy(parsedSearchParams), type: 'forumthreads' })
						);
						return dispatch(loadJsonActions.recieveJson(storageName, json));
					} catch (e) {
						console.error('searchApi.search question caught an error: ', e);
					}
				/*
				} else if (filter === 'faq') {
					try {
						if (!parsedSearchParams.gameId) {
							throw 'No gameId selected';
						}
						const json = await dispatch(
							faqApi.search({
								gameId: parsedSearchParams.gameId,
								searchQuery: parsedSearchParams.q
							})
						);
						dispatch(loadJsonActions.recieveJson(storageName, json));
					} catch (e) {
						console.error('searchApi.search faq caught an error: ', e);
					}
				*/
				} else if (filter === 'blog-article') {
					const categoryId = _.get(getState(), 'categories.news.selected.search-input', []).map(
						category => category.id
					)[0];
					try {
						let json = await dispatch(
							_search({
								...convertSearchTypeToOrderBy(parsedSearchParams),
								type: 'blog-article',
								categoryId
							})
						);

						return dispatch(loadJsonActions.recieveJson(storageName, json));
					} catch (e) {
						console.error('searchApi.search blog-article caught an error: ', e);
					}
				} else {
					if (
						(filter === 'group' || filter[0] === 'group') &&
						_.get(getState(), 'currentUser.isLoggedIn', false) &&
						Object.keys(_.get(getState(), 'groups.auth')).length === 0
					) {
						try {
							let json = await dispatch(groupApi.listMyGroups());
							dispatch(groupActions.recieveGroupsAuth({ entries: _.get(json, 'groupAuth') }));
						} catch (e) {
							console.error('searchApi.search listMyGroups caught an error: ', e);
						}

						dispatch(groupActions.requestGroups());
					}

					try {
						let json = await dispatch(
							_search({
								...convertSearchTypeToOrderBy(parsedSearchParams),
								community: filter === 'user' ? '' : undefined,
								type: filter
							})
						);

						if (filter === 'group' || filter[0] === 'group') {
							dispatch(groupActions.recieveGroups({ entries: _.get(json, 'results.entries') }));
						}
						return dispatch(loadJsonActions.recieveJson(storageName, json));
					} catch (e) {
						console.error('searchApi.search search caught an error: ', e);
					}
				}
			})();
		});
	};
}

//Update URL

//Change PageNumber
