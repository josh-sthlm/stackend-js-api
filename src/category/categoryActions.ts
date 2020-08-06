// @flow
import * as searchApi from '../search';
import { Category, Context, Reference, list } from '../category';
import * as searchActions from '../search/searchActions';
import * as reducer from './categoryReducer';

interface ContextObject {
	context: Category
}

export function fetchCategories({ context }: ContextObject) {
	return async (dispatch: any /*, getState: any*/) => {
		dispatch(requestCategories({ context }));
		let json = await dispatch(list({ context }));
		dispatch(recieveCategories({ context, json }));
	};
}

function recieveCategories({ context, json }: ContextObject & { json: any }): any {
	return {
		type: reducer.RECIEVE_AVAILABLE_CATEGORIES,
		context,
		json
	};
}

function requestCategories({ context }: ContextObject): any {
	return {
		type: reducer.REQUEST_AVAILABLE_CATEGORIES,
		context
	};
}

export function invalidateCategories({ context }: ContextObject): any {
	return {
		type: reducer.INVALIDATE_AVAILABLE_CATEGORIES,
		context
	};
}

type ToggleSelected = {
	context: Context,
	reference: Reference,
	category: Category
};
export function toggleSelected({ context, reference, category }: ToggleSelected) {
	if (reference === 'search-input') {
		return (dispatch: any, getState: any) => {
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

function _toggleSelected({ context, reference, category }: ToggleSelected) {
	return {
		type: reducer.CATEGORIES_TOGGLE_SELECTED,
		context,
		reference,
		category
	};
}

type RemoveSelection = {
	context: string, //name of redux sub-store inside 'categories'
	reference: Reference
};

export function removeSelection({ context, reference }: RemoveSelection) {
	if (reference === 'search-input') {
		return (dispatch: any, getState: any) => {
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

function _removeSelection({ context, reference }: RemoveSelection) {
	return {
		type: reducer.CATEGORIES_REMOVE_SELECTION,
		context,
		reference
	};
}
