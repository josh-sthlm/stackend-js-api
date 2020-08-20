// @flow
import { find } from 'lodash';
import {
	QnaSearchType,
	ContentType,
	getCategories,
	search as _search,
	QnaTypeConverter
} from './index';
import * as Search from '../search';
import * as searchActions from '../search/searchActions';
import {
  CHANGE_QNA_PAGE,
  CHANGE_FILTER,
  SET_QNA_AVAILABLE_FILTERS,
  RECEIVE_SEARCH_RESULT, QnaActions
} from './qnaReducer';
import { isRunningInBrowser, Thunk, XcapJsonResult } from '../api';
import { Request, getRequest } from '../request';
import { AnyAction } from 'redux';


//Action Creator to change qnaPage using pageType, eg. "ViewForumThread" and permalink to question
export function changeQnaPage(pageType: string, forumThreadPermalink: string): QnaActions {
	return {
		type: CHANGE_QNA_PAGE,
		pageType,
		forumThreadPermalink
	};
}

//Action Creator to set qna backend server
/*export function setServer(server: string) {
 return {
 type: SET_QNA_SERVER,
 server
 }
 }*/
export interface ChangeFilter {
	filter: {
		(filterName: string): string; //filterName is the filter group (currently only issue), and the value is selected filter
		searchType?: QnaSearchType;
		updateUrl?: 'qna' | 'search'; //if qna or search, reducer will use browserHistory to push url of new filter

		issue?: string; //not-really needed,
	};
	contentType: ContentType;
	triggerSearch?: boolean; //option to disable search trigger
}

//Action Creator to change selected filter in reduxStoreName
export function changeFilter({
	filter,
	contentType,
	triggerSearch = true
}: ChangeFilter): Thunk<void> {
	return (dispatch: any, getState: any): void => {
		dispatch(_changeFilter({ filter, contentType }));

		const request: Request = dispatch(getRequest());

		if (filter.updateUrl === 'qna') {
			//const filterUrlString = !!filter.searchType ? filter.searchType.toLocaleLowerCase() : '';
			//browserHistory.push(getQnaUrl({ request }) + '/' + filterUrlString);
		} else if (filter.updateUrl === 'search') {
			const { search, qnaSelectedFilters } = getState();

			//On SearchPage when changing qnaSortOrder get the full url and update it with the new filter
			const type = search.filter ? '/' + search.filter : '';

			let sortOrder = '';
			if (
				!!filter.searchType &&
				!!qnaSelectedFilters.searchSearchInput.searchType &&
				filter.searchType !== qnaSelectedFilters.searchSearchInput.searchType
			) {
				//set using new searchType
				sortOrder = '/' + filter.searchType.toLocaleLowerCase();
			} else if (qnaSelectedFilters.searchSearchInput.searchType) {
				//set using previous state
				sortOrder = '/' + qnaSelectedFilters.searchSearchInput.searchType.toLocaleLowerCase();
			} else if (filter.searchType) {
				sortOrder = '/' + filter.searchType.toLocaleLowerCase();
			}

			let _filter = '';
			if (!!filter.issue && filter.issue !== qnaSelectedFilters.searchSearchInput.issue) {
				//set using new issue
				_filter = '/' + filter.issue;
			} else if (qnaSelectedFilters.searchSearchInput.issue) {
				//set using previous state
				_filter = '/' + qnaSelectedFilters.searchSearchInput.issue.toLocaleLowerCase();
			}

			const newPath = Search.getSearchBaseUrl({ request }) + type + sortOrder + _filter;

			if (!!filter.updateUrl && isRunningInBrowser() && newPath !== request.location.pathname) {
			  // FIXME: browserHistory
				//browserHistory.push(newPath);
			}

			//Also dispatch a new search
			if (triggerSearch) {
				dispatch(
					searchActions.search({
						reduxStorageUrl: search.searchType,
						searchParams: {
							q: search.q,
							selectedFilters: qnaSelectedFilters.searchSearchInput,
							p: 1,
							gameId: 16 /* FIXME: hardcoded id */
						}
					})
				);
			}
		}
	};
}

function _changeFilter({ filter, contentType }: ChangeFilter): AnyAction {
	return {
		type: CHANGE_FILTER,
		filter,
		contentType
	};
}

export function getAvailableFilters() {
	return async (dispatch: any, getState: any): Promise<XcapJsonResult> => {
		const categoryInfo = await dispatch(getCategories({}));

		if (typeof categoryInfo.error !== 'undefined') {
			dispatch(
				setAvailableFilters({
					filterGames: [],
					filterPlatforms: [],
					filterIssues: [],
					filterDevices: [],
					filterError: categoryInfo.error
				})
			);
		} else {
			dispatch(
				setAvailableFilters({
					filterGames: categoryInfo.gameTagCategories,
					filterPlatforms: categoryInfo.gamePlatformCategories,
					filterIssues: categoryInfo.gameIssueCategories,
					filterDevices: categoryInfo.gameDeviceCategories,
					filterError: false
				})
			);
		}

		return categoryInfo;
	};
}

//Action Creator to change selected filter in reduxStoreName
function setAvailableFilters(filters: {
	filterGames: Array<any>;
	filterPlatforms: Array<any>;
	filterIssues: Array<any>;
	filterDevices: Array<any>;
	filterError: any;
}): AnyAction {
	return {
		type: SET_QNA_AVAILABLE_FILTERS,
		filters
	};
}

function receiveSearchResult(result: {
	entries: Array<any>;
	relatedObjects: Array<any>;
	categoryCounts: { [key: number]: any };
	error: boolean;
}): AnyAction {
	return {
		type: RECEIVE_SEARCH_RESULT,
		result
	};
}

export function searchQna({ searchString, selectedFilters, game }: any) {
	//Load questions using search and filters from King Care
  return async (dispatch: any, getState: any): Promise<any> => {
    const qo = generateQueryObject(searchString, selectedFilters, getState().qnaAvailableFilters);
    const searchResult = await dispatch(_search({ ...qo, game }));
    if (typeof searchResult.error !== 'undefined') {
      return dispatch(
        receiveSearchResult({
          entries: [],
          relatedObjects: [],
          categoryCounts: {},
          error: searchResult.error
        })
      );
    } else {
      return dispatch(
        receiveSearchResult({
          entries: searchResult.results.entries,
          relatedObjects: searchResult.__relatedObjects,
          categoryCounts: searchResult.categoryCounts,
          error: false
        })
      );
    }
  };

}

function generateQueryObject(searchString = '', selectedFilters: any, availableFilters: any): any {
	const qo = {};
	const searchType = selectedFilters.searchType
		? QnaTypeConverter(
				selectedFilters.searchType.substring(selectedFilters.searchType.lastIndexOf('/') + 1)
		  )
		: undefined;

	// FIXME: Fix this
  const platform = selectedFilters.platform
    // @ts-ignore
		? find(
				availableFilters.filterPlatforms,
				{ id: selectedFilters.platform },
      // @ts-ignore
				{ partOfPermalink: undefined }
		  ).partOfPermalink
		: undefined;
	const issue = selectedFilters.issue
    // @ts-ignore
		? find(
				availableFilters.filterIssues,
				{ id: selectedFilters.issue },
      // @ts-ignore
				{ partOfPermalink: undefined }
		  ).partOfPermalink
		: undefined;
	const device = selectedFilters.device
    // @ts-ignore
		? find(
				availableFilters.filterDevices,
				{ id: selectedFilters.device },
      // @ts-ignore
				{ partOfPermalink: undefined }
		  ).partOfPermalink
		: undefined;

	// FIXME:
  // @ts-ignore
	qo.q = searchString;

	return { ...qo, ...selectedFilters, searchType, platform, issue, device };
}

//Action Creator to lock selected game to a specific game eg. {id: 4, name: "papa-pear-saga"}
/*export function setGame(game: {id: number, name: string}) {
 return {
 type: SET_QNA_GAME,
 game
 }
 }*/
