//@flow

import { type Dispatch, type Thunk } from '../store.ts';

import {
	CLEAR_PAGE,
	CLEAR_PAGES,
	RECIEVE_PAGES,
	PagesState,
	RECIEVE_SUB_SITES
} from './pageReducer.js';

import { getPages, type GetPagesResult, getSubSite, type Page, type SubSiteNode } from './cms.js';
import { getPermalink } from '../tree/tree.js';

/**
 * Request multiple pages
 */
export function requestPages({
	pageIds,
	permalinks,
	communityPermalink
}: {
	pageIds?: Array<number>,
	permalinks: Array<string>,
	communityPermalink?: ?string
}): Thunk<GetPagesResult> {
	return async (dispatch: Dispatch /*, getState: any*/) => {
		let r = await dispatch(getPages({ pageIds, permalinks, communityPermalink }));
		await dispatch({
			type: RECIEVE_PAGES,
			json: r
		});
		return r;
	};
}

/**
 * Request the missing pages. Works as requestPages, but does only fetch if the page is not present.
 * @param pageIds
 * @param permalinks
 * @param communityPermalink
 * @param getMenuForIds
 * @returns {function(Dispatch, *): *}
 */
export function requestMissingPages({
	pageIds,
	permalinks,
	communityPermalink
}: {
	pageIds?: Array<number>,
	permalinks?: Array<string>,
	communityPermalink?: ?string
}): Thunk<GetPagesResult> {
	return async (dispatch: Dispatch, getState) => {
		let fetchPageIds = [];
		let fetchPermalinks = [];
		let { pages } = getState();

		//console.log('Pages: ', pages);

		let now = new Date().getTime();
		if (pageIds) {
			pageIds.forEach(id => {
				let p = pages.byId[id];
				if (shouldFetchPage(p, now)) {
					fetchPageIds.push(id);
				}
			});
		}

		if (permalinks) {
			permalinks.forEach(permalink => {
				let p = getPageByPermalink(pages, permalink);
				if (shouldFetchPage(p, now)) {
					fetchPermalinks.push(permalink);
				}
			});
		}

		if (fetchPageIds.length === 0 && fetchPermalinks.length === 0) {
			return { pages: {} };
		}

		return await dispatch(
			requestPages({
				pageIds: fetchPageIds,
				permalinks: fetchPermalinks,
				communityPermalink
			})
		);
	};
}

export function shouldFetchPage(p: Page, now: number): boolean {
	if (!p) {
		return true;
	}

	if (!p.loaded) {
		return true;
	}

	let age = now - p.loaded;
	return age > 60000;
}

/**
 * Request a single page
 * @param pageId
 * @returns {Thunk<GetPagesResult>}
 */
export function requestPage(pageId: number): Thunk<GetPagesResult> {
	return requestPages({ pageIds: [pageId] });
}

/**
 * Request a single page
 * @param permalink
 * @returns {Thunk<GetPagesResult>}
 */
export function requestPageByPermalink(permalink: string): Thunk<GetPagesResult> {
	return requestPages({ permalinks: [permalink] });
}

/**
 * Clear all pages
 * @returns {Function}
 */
export function clearPages(): Thunk<*> {
	return (dispatch: Dispatch /*, getState: any*/) => {
		dispatch({
			type: CLEAR_PAGES
		});
	};
}

/**
 * Clear a single page
 * @param pageId
 * @returns {Function}
 */
export function clearPage(pageId: number): Thunk<*> {
	return (dispatch: Dispatch /*, getState: any*/) => {
		dispatch({
			type: CLEAR_PAGE,
			id: pageId
		});
	};
}

export function recievePages(json: any): Thunk<*> {
	return (dispatch: Dispatch /*, getState: any*/) => {
		return dispatch({
			type: RECIEVE_PAGES,
			json
		});
	};
}

export function requestSubSite(id: number): Thunk<*> {
	return async (dispatch: Dispatch) => {
		let r = await dispatch(getSubSite({ id }));
		if (!r.error && r.tree) {
			let pages = {};
			Object.keys(r.referencedObjects).forEach(k => {
				let p = r.referencedObjects[k];
				if (p) {
					pages[p.id] = p;
				}
			});

			await dispatch(recievePages({ pages }));
			await dispatch(recieveSubSites({ subSites: { [r.tree.id]: r.tree } }));
		}
		return r;
	};
}

export function recieveSubSites(json: any): Thunk<*> {
	return (dispatch: Dispatch /*, getState: any*/) => {
		return dispatch({
			type: RECIEVE_SUB_SITES,
			json
		});
	};
}

/**
 * Get a page from the store given a permalink
 * @param pages
 * @param permalink
 * @returns {null|Page}
 */
export function getPageByPermalink(pages: PagesState, permalink: string): ?Page {
	if (!pages) {
		return null;
	}
	let id = pages.idByPermalink[permalink];
	if (id) {
		return pages.byId[id];
	}
	return null;
}

export const SITE_HASH_PREFIX: string = '#/site';

/**
 * Get a hash permalink to a subsite page. Specify treePath or permalink
 * @param treePath
 * @param permalink
 * @returns {string|null}
 */
export function getSubSitePageHashPermalink({
	treePath,
	permalink
}: {
	treePath: ?Array<SubSiteNode>,
	permalink: ?string
}): ?string {
	if (treePath) {
		return SITE_HASH_PREFIX + getPermalink(treePath);
	}

	if (permalink) {
		return SITE_HASH_PREFIX + permalink;
	}

	return null;
}

/**
 * Given a sub site node hash permalink, extract the real permalink
 * @param hashPermalink
 * @returns {null}
 */
export function getSubSiteNodePermalink(hashPermalink: ?string): ?string {
	if (!hashPermalink) {
		return null;
	}

	let i = hashPermalink.indexOf('#');
	if (i === -1) {
		return null;
	} else if (i > 0) {
		hashPermalink = hashPermalink.substring(i);
	}

	if (!hashPermalink.startsWith(SITE_HASH_PREFIX + '/')) {
		return null;
	}

	return hashPermalink.substr(SITE_HASH_PREFIX.length);
}
