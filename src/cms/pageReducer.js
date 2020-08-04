//@flow

import { type Action } from '../types/action.js';
import { getJsonErrorText } from '../xcap/api.js';
import { type Page, type SubSite } from './cms.js';

export const RECIEVE_PAGES: string = 'RECIEVE_PAGES';
export const CLEAR_PAGE: string = 'CLEAR_PAGE';
export const CLEAR_PAGES: string = 'CLEAR_PAGES';
export const RECIEVE_SUB_SITES: string = 'RECIEVE_SUB_SITES';
export const CLEAR_SUB_SITES: string = 'CLEAR_SUB_SITES';

export type PagesState = {
	byId: { [id: string]: Page },
	idByPermalink: { [permalink: string]: number },
	subSiteById: { [id: string]: SubSite }
};

export default function(
	state: PagesState = {
		byId: {},
		idByPermalink: {},
		subSiteById: {}
	},
	action: Action
): PagesState {
	switch (action.type) {
		case RECIEVE_PAGES:
			if (action.json.error) {
				console.error('Could not get pages ' + getJsonErrorText(action.json));
				return state;
			}

			if (action.json.pages) {
				let s: PagesState = Object.assign({}, state);
				let now = new Date().getTime();
				Object.entries(action.json.pages).forEach(([id, page]) => {
					s.byId[id] = Object.assign(page, { loaded: now });
					s.idByPermalink[page.permalink] = page.id;
				});

				//console.log('Recieved pages', s);
				return s;
			}

			return state;

		case CLEAR_PAGES:
			return Object.assign({}, state, {
				byId: {},
				idByPermalink: {}
			});

		case CLEAR_PAGE: {
			if (state.byId[action.id]) {
				let s: PagesState = Object.assign({}, state);

				let p = s.byId[action.id];
				if (p) {
					delete s.idByPermalink[p.permalink];
				}
				delete s.byId[action.id];
				return s;
			}

			return state;
		}

		case RECIEVE_SUB_SITES: {
			if (action.json.error) {
				console.error('Could not get sub sites ' + getJsonErrorText(action.json));
				return state;
			}

			let s: PagesState = Object.assign({}, state);
			for (let [subSiteId, subSite] of Object.entries(action.json.subSites)) {
				s.subSiteById[subSiteId] = subSite;
			}

			return s;
		}

		case CLEAR_SUB_SITES: {
			return Object.assign({}, state, {
				subSiteByIdById: {}
			});
		}

		default:
			return state;
	}
}
