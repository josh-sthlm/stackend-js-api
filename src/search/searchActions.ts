// @flow
import _ from 'lodash';
import * as groupActions from '../group/groupActions';
import { getCurrentCommunityPermalink, Thunk } from '../api';
import { getActiveSearchTypes, Order, OrderBy, search as _search, SearchAbleType } from '../search';
import * as qnaApi from '../qna';
import * as groupApi from '../group';
import * as reducer from './searchReducer';
import { Category } from '../category';
import { SearchActions } from './searchReducer';

//Change Text
export interface UpdateSearchString {
  q: string; // searchString/queryString
  p?: number; //pageNumber
}

export function updateSearchString({ q, p = 1 }: UpdateSearchString): SearchActions {
  return {
    type: reducer.UPDATE_SEARCH_STRING,
    q,
    p,
  };
}

export interface UpdateSelectedType {
  request: any;
  type: SearchAbleType; // selected filter
  updateUrl?: boolean; //change the url or not
  p?: number; //pageNumber
}

type _UpdateSelectedType = {
  selectedType: SearchAbleType; // selected filter
  p?: number; //pageNumber
};
function _updateSelectedType({ selectedType, p = 1 }: _UpdateSelectedType): SearchActions {
  return {
    type: reducer.UPDATE_SELECTED_TYPE,
    selectedType,
    p,
  };
}

//Change Filter
export function updateSelectedType({ type, p = 1, updateUrl = true }: UpdateSelectedType): Thunk<void> {
  return async (dispatch, getState): Promise<void> => {
    if (updateUrl) {
      //const request = await dispatch(getRequest());
      //browserHistory.push(getSearchBaseUrl({ request }) + '/' + type.toLocaleLowerCase());
    }
    dispatch(_updateSelectedType({ selectedType: type, p }));
  };
}



export interface Search {
  reduxStorageUrl: string;
  searchParams: {
    q: any; //string
    tag?: any;
    selectedFilters?: any;
    type?: Array<SearchAbleType>;
    gameId?: number;
    order?: Order;
    orderBy?: OrderBy;
    pageSize?: number;
    trendingBoost?: boolean;
    categoryId?: number;
    qnaParams?: any;
    p?: number; //Page number,
  };
  singleTypeSearch?: boolean;
}

// Convert qna style ordering to search ordering
function convertSearchTypeToOrderBy(params: { searchType?: string; orderBy?: string }): any {
  let { searchType, orderBy } = params;
  const newParams = Object.assign({}, params);

  switch (searchType) {
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
export function search({ reduxStorageUrl, searchParams, singleTypeSearch }: Search): Thunk<void> {
  let { q } = searchParams;
  if (q.indexOf('#') > -1) {
    const start = q.indexOf('#');
    const end = q.indexOf(' ', start) > -1 ? q.indexOf(' ', start) : q.length;
    searchParams.tag = q.substring(start + 1, end);
    q = q.substring(0, start) + q.substring(end, q.length);
  }

  const qnaSearchType: string =
    !!searchParams.selectedFilters && searchParams.selectedFilters.searchType
      ? qnaApi.QnaTypeConverter(searchParams.selectedFilters.searchType)
      : 'search';
  //delete searchParams.selectedFilters.searchType;
  //delete searchParams.selectedFilters.updateUrl;
  searchParams = Object.assign({}, searchParams, { ...searchParams.selectedFilters });
  delete searchParams.selectedFilters;

  return (dispatch: any, getState: any): any => {
    const { type } = searchParams;
    const filters =
      !!singleTypeSearch && !!type ? type : getActiveSearchTypes(_.get(getState(), 'communities.community.settings'));

    return filters.map(filter => {
      return (async (): Promise<any> => {
        const { type, ...parsedSearchParams } = searchParams;
        if (filter !== _.get(type, '[0]')) {
          parsedSearchParams.p = 1;
        }
        //const storageName = reduxStorageUrl + '-' + filter;

        if (filter === 'question') {
          try {
            const game = await dispatch(getCurrentCommunityPermalink());

            const json = await dispatch(
              qnaApi.search({
                ...parsedSearchParams,
                // @ts-ignore
                // FIXME: Clean up this mess
                searchType: qnaSearchType,
                game,
              })
            );
            return json;
          } catch (e) {
            console.error('searchApi.search question caught an error: ', e);
          }
        } else if (filter === 'forumthreads') {
          // rename searchType variable
          try {
            await dispatch(getCurrentCommunityPermalink());
            await dispatch(
              // @ts-ignore
              _search({ ...convertSearchTypeToOrderBy(parsedSearchParams), type: SearchAbleType.FORUM_THREADS })
            );
          } catch (e) {
            console.error('searchApi.search question caught an error: ', e);
          }
          /*
				} else if (filter === 'faq') {
					try {
						if (!parsedSearchParams.gameId) {
							throw Error('No gameId selected');
						}
						const json = await dispatch(
							faqApi.search({
								gameId: parsedSearchParams.gameId,
								searchQuery: parsedSearchParams.q
							})
						);
					} catch (e) {
						console.error('searchApi.search faq caught an error: ', e);
					}
				*/
        } else if (filter === 'blog-article') {
          const categoryId = _.get(getState(), 'categories.news.selected.search-input', []).map(
            (category: Category) => category.id
          )[0];
          try {
            await dispatch(
              // @ts-ignore
              _search({
                ...convertSearchTypeToOrderBy(parsedSearchParams),
                type: SearchAbleType.BLOG_ARTICLE,
                categoryId,
              })
            );
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
              const json = await dispatch(groupApi.listMyGroups());
              dispatch(groupActions.receiveGroupsAuth({ entries: _.get(json, 'groupAuth') }));
            } catch (e) {
              console.error('searchApi.search listMyGroups caught an error: ', e);
            }

            dispatch(groupActions.requestGroups());
          }

          try {
            const json = await dispatch(
              // @ts-ignore
              _search({
                ...convertSearchTypeToOrderBy(parsedSearchParams),
                community: filter === 'user' ? '' : undefined,
                type: filter,
              })
            );

            if (filter === 'group' || filter[0] === 'group') {
              dispatch(groupActions.receiveGroups({ entries: _.get(json, 'results.entries') }));
            }
            //return dispatch(loadJsonActions.recieveJson(storageName, json));
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
