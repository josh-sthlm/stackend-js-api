//@flow
import { getJsonErrorText } from '../api';
import { GetPagesResult, Page, SubSite } from './index';

export const RECEIVE_PAGES = 'RECEIVE_PAGES';
export const CLEAR_PAGE = 'CLEAR_PAGE';
export const CLEAR_PAGES = 'CLEAR_PAGES';
export const RECEIVE_SUB_SITES = 'RECEIVE_SUB_SITES';
export const CLEAR_SUB_SITES = 'CLEAR_SUB_SITES';

export interface PagesState {
  byId: { [id: string]: PageAndLoadedState };
  idByPermalink: { [permalink: string]: number };
  subSiteById: { [id: string]: SubSite };
}

export interface PageAndLoadedState extends Page {
  loaded: number; // Time when loaded
}

export type PageActions = {
  type: typeof RECEIVE_PAGES;
  json: GetPagesResult;
} | {
  type: typeof CLEAR_PAGE;
  id: number;
} | {
  type: typeof CLEAR_PAGES;
} | {
  type: typeof RECEIVE_SUB_SITES;
  subSites: { [id: string]: SubSite };
} | {
  type: typeof CLEAR_SUB_SITES;
};

export default function (
  state: PagesState = {
    byId: {},
    idByPermalink: {},
    subSiteById: {},
  },
  action: PageActions
): PagesState {
  switch (action.type) {
    case RECEIVE_PAGES:
      if (action.json.error) {
        console.error('Could not get pages ' + getJsonErrorText(action.json));
        return state;
      }

      if (action.json.pages) {
        const s: PagesState = Object.assign({}, state);
        const now = new Date().getTime();
        Object.entries(action.json.pages).forEach(([id, page]) => {
          const p = page as Page;
          s.byId[id] = Object.assign(p, { loaded: now });
          s.idByPermalink[p.permalink] = p.id;
        });

        //console.log('Received pages', s);
        return s;
      }

      return state;

    case CLEAR_PAGES:
      return Object.assign({}, state, {
        byId: {},
        idByPermalink: {},
      });

    case CLEAR_PAGE: {
      if (state.byId[action.id]) {
        const s: PagesState = Object.assign({}, state);

        const p = s.byId[action.id];
        if (p) {
          delete s.idByPermalink[p.permalink];
        }
        delete s.byId[action.id];
        return s;
      }

      return state;
    }

    case RECEIVE_SUB_SITES: {

      const s: PagesState = Object.assign({}, state);
      for (const [subSiteId, subSite] of Object.entries(action.subSites)) {
        s.subSiteById[subSiteId] = subSite as SubSite;
      }

      return s;
    }

    case CLEAR_SUB_SITES: {
      return Object.assign({}, state, {
        subSiteByIdById: {},
      });
    }

    default:
      return state;
  }
}
