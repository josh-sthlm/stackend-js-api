//@flow

import { newXcapJsonResult, Thunk } from '../api';

import {
  CLEAR_PAGE,
  CLEAR_PAGES,
  RECIEVE_PAGES,
  PagesState,
  RECIEVE_SUB_SITES,
  PageAndLoadedState,
} from './pageReducer';

import { getPages, GetPagesResult, getSubSite, GetSubSiteResult, Page, SubSiteNode } from '../cms';
import { getPermalink } from '../tree';
import { AnyAction } from 'redux';

/**
 * Request multiple pages
 */
export function requestPages({
  pageIds,
  permalinks,
  communityPermalink,
}: {
  pageIds?: Array<number>;
  permalinks?: Array<string>;
  communityPermalink?: string | null;
}): Thunk<GetPagesResult> {
  return async (dispatch: any): Promise<GetPagesResult> => {
    const r = await dispatch(getPages({ pageIds, permalinks, communityPermalink }));
    await dispatch({
      type: RECIEVE_PAGES,
      json: r,
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
 */
export function requestMissingPages({
  pageIds,
  permalinks,
  communityPermalink,
}: {
  pageIds?: Array<number>;
  permalinks?: Array<string>;
  communityPermalink?: string | null;
}): Thunk<GetPagesResult> {
  return async (dispatch: any, getState): Promise<GetPagesResult> => {
    const fetchPageIds: Array<number> = [];
    const fetchPermalinks: Array<string> = [];
    const { pages } = getState();

    //console.log('Pages: ', pages);

    const now = new Date().getTime();
    if (pageIds) {
      pageIds.forEach(id => {
        const p = pages.byId[id];
        if (shouldFetchPage(p, now)) {
          fetchPageIds.push(id);
        }
      });
    }

    if (permalinks) {
      permalinks.forEach(permalink => {
        const p = getPageByPermalink(pages, permalink);
        if (shouldFetchPage(p, now)) {
          fetchPermalinks.push(permalink);
        }
      });
    }

    if (fetchPageIds.length === 0 && fetchPermalinks.length === 0) {
      return newXcapJsonResult('success', { pages: ''}) as GetPagesResult;
      //return { pages: {} };
    }

    return await dispatch(
      requestPages({
        pageIds: fetchPageIds,
        permalinks: fetchPermalinks,
        communityPermalink,
      })
    );
  };
}

export function shouldFetchPage(p: Page | PageAndLoadedState | null, now: number): boolean {
  if (!p) {
    return true;
  }

  const s = p as PageAndLoadedState;
  if (!s.loaded) {
    return true;
  }

  const age = now - s.loaded;
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
export function clearPages(): Thunk<void> {
  return (dispatch /*, getState: any*/): void => {
    dispatch({
      type: CLEAR_PAGES,
    });
  };
}

/**
 * Clear a single page
 * @param pageId
 * @returns {Function}
 */
export function clearPage(pageId: number): Thunk<void> {
  return (dispatch /*, getState: any*/): void => {
    dispatch({
      type: CLEAR_PAGE,
      id: pageId,
    });
  };
}

export function recievePages(json: any): Thunk<any> {
  return (dispatch /*, getState: any*/): AnyAction => {
    return dispatch({
      type: RECIEVE_PAGES,
      json,
    });
  };
}

export function requestSubSite(id: number): Thunk<GetSubSiteResult> {
  return async (dispatch: any): Promise<GetSubSiteResult> => {
    const r = await dispatch(getSubSite({ id }));
    if (!r.error && r.tree) {
      const pages: { [id: number]: Page } = {};
      Object.keys(r.referencedObjects).forEach(k => {
        const p = r.referencedObjects[k];
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

export function recieveSubSites(json: any): Thunk<AnyAction> {
  return (dispatch /*, getState: any*/): AnyAction => {
    return dispatch({
      type: RECIEVE_SUB_SITES,
      json,
    });
  };
}

/**
 * Get a page from the store given a permalink
 * @param pages
 * @param permalink
 * @returns {null|Page}
 */
export function getPageByPermalink(pages: PagesState, permalink: string): Page | null {
  if (!pages) {
    return null;
  }
  const id = pages.idByPermalink[permalink];
  if (id) {
    return pages.byId[id];
  }
  return null;
}

export const SITE_HASH_PREFIX = '#/site';

/**
 * Get a hash permalink to a subsite page. Specify treePath or permalink
 * @param treePath
 * @param permalink
 * @returns {string|null}
 */
export function getSubSitePageHashPermalink({
  treePath,
  permalink,
}: {
  treePath: Array<SubSiteNode> | null;
  permalink: string | null;
}): string | null {
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
export function getSubSiteNodePermalink(hashPermalink: string | null): string | null {
  if (!hashPermalink) {
    return null;
  }

  const i = hashPermalink.indexOf('#');
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
