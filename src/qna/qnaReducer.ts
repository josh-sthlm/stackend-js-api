// @flow
import * as QNA from './qna';
import update from 'immutability-helper';

////Action Type
export const CHANGE_QNA_PAGE = 'CHANGE_QNA_PAGE';
export const SET_QNA_SERVER = 'SET_QNA_SERVER';
export const SET_QNA_GAME = 'SET_QNA_GAME';
export const SET_QNA_STYLE = 'SET_QNA_STYLE';
export const CHANGE_FILTER = 'CHANGE_FILTER';
export const SET_QNA_AVAILABLE_FILTERS = 'SET_QNA_AVAILABLE_FILTERS';
export const RECIEVE_SEARCH_RESULT = 'RECIEVE_SEARCH_RESULT';

//Reducer
const qnaReducer = (
	state: any = { pageType: 'Search' },
	action: {
		type: string,
		pageType: string,
		forumThreadPermalink: string
	}
) => {
	switch (action.type) {
		case CHANGE_QNA_PAGE:
			return (state = {
				pageType: action.pageType,
				forumThreadPermalink: action.forumThreadPermalink
			});
		default:
			return state;
	}
};

// FIXME: Remove this
type XcapModuleSettings = {
	qna: {
		server: string,
		game: { id: number, name: string }
	}
};

const xcapModuleSettings: XcapModuleSettings = {
	qna: {
		server: '',
			game: { id: 0, name: '' }
	}
};


//Reducer
const qnaServer = (
	state: any = xcapModuleSettings && xcapModuleSettings.qna && xcapModuleSettings.qna.server
		? xcapModuleSettings.qna.server
		: '',
	action: { type: string, server: string }
) => {
	switch (action.type) {
		case SET_QNA_SERVER:
			return (state = action.server);
		default:
			return state;
	}
};

export function qnaAvailableFilters(
	state: {
		filterGames: [any],
		filterPlatforms: [any],
		filterIssues: [any],
		filterDevices: [any],
		filterError: any
	} = {
		filterGames: [],
		filterPlatforms: [],
		filterIssues: [],
		filterDevices: [],
		filterError: false
	},
	action: { type: string, filters: any }
) {
	switch (action.type) {
		case SET_QNA_AVAILABLE_FILTERS:
			return (state = action.filters);
		default:
			return state;
	}
}

const defaultQnaSelectedFiltersState = {
	askQuestion: {
		game:
			xcapModuleSettings &&
			xcapModuleSettings.qna &&
			xcapModuleSettings.qna.game &&
			xcapModuleSettings.qna.game.id,
		searchType: 'All'
	},
	tags: {
		game:
			xcapModuleSettings &&
			xcapModuleSettings.qna &&
			xcapModuleSettings.qna.game &&
			xcapModuleSettings.qna.game.name,
		searchType: 'Trending'
	},
	searchSearchInput: {
		game:
			xcapModuleSettings &&
			xcapModuleSettings.qna &&
			xcapModuleSettings.qna.game &&
			xcapModuleSettings.qna.game.name,
		searchType: 'All'
	}
};
type QnaSelectedFiltersChangeFilter = {
	type: 'CHANGE_FILTER',
	contentType: QNA.ContentType,
	filter: {
		(filterName: QNA.FilterTypes): QNA.IssueTypes,
		updateUrl?: boolean //if true, reducer will use browserHistory to push url of new filter
	}
};

const qnaSelectedFilters = (
	state: any = defaultQnaSelectedFiltersState,
	action: QnaSelectedFiltersChangeFilter
) => {
	switch (action.type) {
		case CHANGE_FILTER:
			if (typeof state[action.contentType] === 'undefined') {
				//this is the first request of a specfic contentType, store it in a separate place
				state[action.contentType] = {};
			}

			//TODO: Is this realy working? what if action.filter[1] is clicked?
			if (
				!!Object.values(action.filter)[0] &&
				state[action.contentType][Object.keys(action.filter)[0]] ===
					Object.values(action.filter)[0] &&
				Object.keys(action.filter)[0] !== 'searchType'
			) {
				// the current clicked filter is selected, Un-check current filter selection
				return update(state, {
					[action.contentType]: { $merge: { [Object.keys(action.filter)[0]]: '' } }
				});
			}

			//Check new filter selection
			return update(state, {
				[action.contentType]: { $merge: action.filter }
			});
		default:
			return state;
	}
};

export function qnaSearchResult(
	state: {
		entries: [any],
		relatedObjects: [any],
		categoryCounts: [any],
		error: boolean
	} = {
		entries: [],
		relatedObjects: [],
		categoryCounts: [],
		error: false
	},
	action: { type: string, result: any }
) {
	switch (action.type) {
		case RECIEVE_SEARCH_RESULT:
			return (state = action.result);
		default:
			return state;
	}
}

const qnaGame = (
	state: any = xcapModuleSettings && xcapModuleSettings.qna && xcapModuleSettings.qna.game
		? xcapModuleSettings.qna.game
		: '',
	action: { type: string, game: string }
) => {
	switch (action.type) {
		case SET_QNA_GAME:
			return (state = action.game);
		default:
			return state;
	}
};

const defaultStyle = {
	mainColor: '',
	accentColor: '',
	iconColor: '',

	titleFont: '',
	titleFontColor: '',

	bodyFont: '',
	bodyFontColor: '',

	buttonColor: '',
	buttonFontColor: '',

	linkColor: '',
	textDetailColor: ''
};


const qnaStyling = (
	state: any = xcapModuleSettings && xcapModuleSettings.qna && xcapModuleSettings.qna.styling
		? xcapModuleSettings.qna.styling
		: defaultStyle,
	action: { type: string, style: string }
) => {
	switch (action.type) {
		case SET_QNA_STYLE:
			return (state = action.style);
		default:
			return state;
	}
};

export { qnaReducer, qnaServer, qnaSelectedFilters, qnaGame, qnaStyling };

export default qnaReducer;