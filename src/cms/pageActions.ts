import { getJsonErrorText, newXcapJsonResult, Thunk } from '../api';

import {
  CLEAR_PAGE,
  CLEAR_PAGES,
  RECEIVE_PAGES,
  PagesState,
  RECEIVE_SUB_SITES,
  PageAndLoadedState,
  PageActions
} from './pageReducer';

import { getPages, GetPagesResult, getSubSite, GetSubSiteResult, Page, SubSiteNode, SubSite } from './index';
import { getPermalink } from '../api/tree';

/**
 * Request multiple pages
 */
export function requestPages({
  pageIds,
  permalinks,
  communityPermalink
}: {
  pageIds?: Array<number>;
  permalinks?: Array<string>;
  communityPermalink?: string | null;
}): Thunk<Promise<GetPagesResult>> {
  return async (dispatch: any): Promise<GetPagesResult> => {
    const r = await dispatch(getPages({ pageIds, permalinks, communityPermalink }));
    await dispatch({
      type: RECEIVE_PAGES,
      json: r,
      pageIds,
      permalinks
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
  communityPermalink
}: {
  pageIds?: Array<number>;
  permalinks?: Array<string>;
  communityPermalink?: string | null;
}): Thunk<Promise<GetPagesResult>> {
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
      return newXcapJsonResult('success', { pages: {} }) as GetPagesResult;
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

export function shouldFetchPage(p: Page | PageAndLoadedState | null | undefined, now: number): boolean {
  if (typeof p === 'undefined') {
    return true;
  }

  if (p === null) {
    return false; // Has cached the fact that p does not exists
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
export function requestPage(pageId: number): Thunk<Promise<GetPagesResult>> {
  return requestPages({ pageIds: [pageId] });
}

/**
 * Request a single page
 * @param permalink
 * @returns {Thunk<GetPagesResult>}
 */
export function requestPageByPermalink(permalink: string): Thunk<Promise<GetPagesResult>> {
  return requestPages({ permalinks: [permalink] });
}

/**
 * Clear all pages
 * @returns {Function}
 */
export function clearPages(): Thunk<PageActions> {
  return (dispatch /*, getState: any*/): PageActions => {
    return dispatch({
      type: CLEAR_PAGES
    });
  };
}

/**
 * Clear a single page
 * @param pageId
 * @returns {Function}
 */
export function clearPage(pageId: number): Thunk<PageActions> {
  return (dispatch /*, getState: any*/): PageActions => {
    return dispatch({
      type: CLEAR_PAGE,
      id: pageId
    });
  };
}

export function receivePages(json: GetPagesResult): Thunk<any> {
  return (dispatch /*, getState: any*/): PageActions => {
    return dispatch({
      type: RECEIVE_PAGES,
      json
    });
  };
}

export function requestSubSite(id: number): Thunk<Promise<GetSubSiteResult>> {
  return async (dispatch: any): Promise<GetSubSiteResult> => {
    const r = await dispatch(getSubSite({ id }));
    if (r.error) {
      console.error('Could not get sub sites ' + getJsonErrorText(r));
      return r;
    }

    if (!r.error && r.tree) {
      const pages: { [id: number]: Page } = {};
      Object.keys(r.referencedObjects).forEach(k => {
        const p = r.referencedObjects[k];
        if (p) {
          pages[p.id] = p;
        }
      });

      await dispatch(
        receivePages(
          newXcapJsonResult('success', {
            pages
          })
        )
      );
      await dispatch(receiveSubSites({ subSites: { [r.tree.id]: r.tree } }));
    }
    return r;
  };
}

export function receiveSubSites({ subSites }: { subSites: { [id: number]: SubSite } }): Thunk<PageActions> {
  return (dispatch /*, getState: any*/): PageActions => {
    return dispatch({
      type: RECEIVE_SUB_SITES,
      subSites
    });
  };
}

/**
 * Get a page from the store given a permalink
 * @param pages
 * @param permalink
 * @returns {null|Page}
 */
export function getPageByPermalink(pages: PagesState, permalink: string | null): Page | undefined | null {
  if (!pages || !permalink) {
    return null; // For cache
  }
  const id = pages.idByPermalink[permalink];
  if (id === null) {
    return null;
  }

  if (id) {
    return pages.byId[id];
  }
  return undefined;
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
  permalink
}: {
  treePath?: Array<SubSiteNode> | null;
  permalink?: string | null;
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
