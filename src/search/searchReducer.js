// @flow
import update from 'immutability-helper';
import * as search from './search.js';
import { type Action } from '../types/action.js';

export const UPDATE_SEARCH_STRING = 'UPDATE_SEARCH_STRING';
export const UPDATE_SELECTED_TYPE = 'UPDATE_SELECTED_TYPE';

type UpdateSearchString = {
	type: UPDATE_SEARCH_STRING,
	q: string, // searchString/queryString
	p?: number //pageNumber
};

type UpdateSelectedType = {
	type: UPDATE_SEARCH_STRING,
	selectedType: search.SearchAbleType, // selected filter
	p?: number //pageNumber
};

type SearchReducer = {
	q: string, // searchString/queryString
	p: number //pageNumber
};

const initSearchReducer = {
	q: '',
	filter: 'all',
	p: 1
};

export default function searchReducer(state: SearchReducer = initSearchReducer, action: Action) {
	switch (action.type) {
		case UPDATE_SEARCH_STRING:
			return update(state, {
				q: { $set: action.q },
				p: { $set: action.p }
			});
		case UPDATE_SELECTED_TYPE:
			return update(state, {
				filter: { $set: action.selectedType },
				p: { $set: action.p }
			});
		default:
			return state;
	}
}
