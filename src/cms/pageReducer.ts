//@flow
import { AnyAction } from 'redux';
import { getJsonErrorText } from '../api';
import { Page, SubSite } from '../cms';

export const RECIEVE_PAGES = 'RECIEVE_PAGES';
export const CLEAR_PAGE = 'CLEAR_PAGE';
export const CLEAR_PAGES = 'CLEAR_PAGES';
export const RECIEVE_SUB_SITES = 'RECIEVE_SUB_SITES';
export const CLEAR_SUB_SITES = 'CLEAR_SUB_SITES';

export interface PagesState {
  byId: { [id: string]: PageAndLoadedState };
  idByPermalink: { [permalink: string]: number };
  subSiteById: { [id: string]: SubSite };
}

export interface PageAndLoadedState extends Page {
  loaded: number; // Time when loaded
}

export default function (
  state: PagesState = {
    byId: {},
    idByPermalink: {},
    subSiteById: {},
  },
  action: AnyAction
): PagesState {
  switch (action.type) {
    case RECIEVE_PAGES:
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

        //console.log('Recieved pages', s);
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

    case RECIEVE_SUB_SITES: {
      if (action.json.error) {
        console.error('Could not get sub sites ' + getJsonErrorText(action.json));
        return state;
      }

      const s: PagesState = Object.assign({}, state);
      for (const [subSiteId, subSite] of Object.entries(action.json.subSites)) {
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
