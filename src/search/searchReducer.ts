// @flow
import update from 'immutability-helper';
import * as search from './index';

export const UPDATE_SEARCH_STRING = 'UPDATE_SEARCH_STRING';
export const UPDATE_SELECTED_TYPE = 'UPDATE_SELECTED_TYPE';

type UpdateSearchString = {
  type: typeof UPDATE_SEARCH_STRING;
  q: string; // searchString/queryString
  p?: number; //pageNumber
};

type UpdateSelectedType = {
  type: typeof UPDATE_SELECTED_TYPE;
  selectedType: search.SearchAbleType; // selected filter
  p?: number; //pageNumber
};

export type SearchActions = UpdateSearchString | UpdateSelectedType;

export type SearchState = {
  q: string; // searchString/queryString
  p: number; //pageNumber,
  filter: string;
};

const initSearchReducer = {
  q: '',
  filter: 'all',
  p: 1
};

export default function searchReducer(state: SearchState = initSearchReducer, action: SearchActions): SearchState {
  switch (action.type) {
    case UPDATE_SEARCH_STRING:
      return update(state, {
        q: { $set: action.q },
        p: { $set: action.p || state.p }
      });

    case UPDATE_SELECTED_TYPE:
      return update(state, {
        filter: { $set: action.selectedType },
        p: { $set: action.p || state.p }
      });

    default:
      return state;
  }
}
