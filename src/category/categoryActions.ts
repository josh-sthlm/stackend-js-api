// @flow
import * as searchApi from '../search';
import { Category, Context, Reference, list } from './index';
import * as searchActions from '../search/searchActions';
import * as reducer from './categoryReducer';
import { AnyAction } from 'redux';
import { Thunk } from '../api';

interface ContextObject {
  context: string;
}

export function fetchCategories({ context }: ContextObject): Thunk<any> {
  return async (dispatch: any /*, getState: any*/): Promise<any> => {
    dispatch(requestCategories({ context }));
    const json = await dispatch(list({ context }));
    dispatch(recieveCategories({ context, json }));
  };
}

function recieveCategories({ context, json }: ContextObject & { json: any }): AnyAction {
  return {
    type: reducer.RECEIVE_AVAILABLE_CATEGORIES,
    context,
    json
  };
}

function requestCategories({ context }: ContextObject): AnyAction {
  return {
    type: reducer.REQUEST_AVAILABLE_CATEGORIES,
    context
  };
}

export function invalidateCategories({ context }: ContextObject): AnyAction {
  return {
    type: reducer.INVALIDATE_AVAILABLE_CATEGORIES,
    context
  };
}

type ToggleSelected = {
  context: Context;
  reference: Reference;
  category: Category;
};
export function toggleSelected({ context, reference, category }: ToggleSelected): any {
  // FIXME: Return types differ!
  if (reference === 'search-input') {
    return (dispatch: any, getState: any): any => {
      dispatch(_toggleSelected({ context, reference, category }));

      //Also dispatch a new search
      dispatch(
        searchActions.search({
          reduxStorageUrl: searchApi.searchType,
          searchParams: {
            q: getState().search.q,
            selectedFilters: getState().qnaSelectedFilters.searchSearchInput,
            gameId: 16,
            p: 1
          }
        })
      );
    };
  } else {
    return _toggleSelected({ context, reference, category });
  }
}

function _toggleSelected({ context, reference, category }: ToggleSelected): AnyAction {
  return {
    type: reducer.CATEGORIES_TOGGLE_SELECTED,
    context,
    reference,
    category
  };
}

export type RemoveSelection = {
  context: string; //name of redux sub-store inside 'categories'
  reference: Reference;
};

// FIXME: Return types differ
export function removeSelection({ context, reference }: RemoveSelection): any {
  if (reference === 'search-input') {
    return (dispatch: any, getState: any): any => {
      dispatch(_removeSelection({ context, reference }));

      //Also dispatch a new search
      dispatch(
        searchActions.search({
          reduxStorageUrl: searchApi.searchType,
          searchParams: {
            q: getState().search.q,
            selectedFilters: getState().qnaSelectedFilters.searchSearchInput,
            gameId: 16,
            p: 1
          }
        })
      );
    };
  } else {
    return _removeSelection({ context, reference });
  }
}

function _removeSelection({ context, reference }: RemoveSelection): AnyAction {
  return {
    type: reducer.CATEGORIES_REMOVE_SELECTION,
    context,
    reference
  };
}
