//@flow
import update from 'immutability-helper';
import { Request } from './index';
import { isCommunityUrlBlocked } from '../stackend';
import { AnyAction } from "redux";

export const SET_REQUEST_INFO = 'SET_REQUEST_INFO';

// Hack to access this action
export const REACT_ROUTER_REDUX_LOCATION_CHANGE = '@@router/LOCATION_CHANGE';

/**
 * Sets up an implementation neutral object that keeps track of the current url
 */
export const requestReducer = (
  state: Request = {
    location: {
      hash: '',
      host: '',
      hostName: '',
      href: '',
      origin: '',
      pathname: '/',
      port: 80,
      protocol: 'http:',
      search: '',
      query: {},
    },
    cookie: null,
    absoluteUrl: '',
    communityUrl: '',
    absoluteCommunityUrl: '',
    communityFromDomain: false,
    contextPath: '',
    anchor: null,
    referenceUrlId: 0,
  },
  action: AnyAction
): Request => {
  let location = undefined;
  let communityUrl = undefined;
  let absoluteUrl = undefined;
  let absoluteCommunityUrl = undefined;

  switch (action.type) {
    /*
		case CALL_HISTORY_METHOD:
			console.log("CALL_HISTORY_METHOD", action);
			break;
		*/

    case REACT_ROUTER_REDUX_LOCATION_CHANGE:
      /* In response to a navigation event. Will only update the
       * location and possibly the community urls
       */

      // Show the content when the css is loaded
      if (document) {
        const p = document.getElementById('xcapPage');
        if (p && p.style.display === 'none') {
          p.style.display = 'block';
        }
      }

      // NOTE: action.payload is NOT compatible with request.location. Does not update all props
      action.request = !action.request && !!action.payload ? { location: action.payload } : action.request;
      location = action.request.location || state.location;
      absoluteUrl = action.request.absoluteUrl || state.absoluteUrl;
      communityUrl = action.request.communityUrl || state.communityUrl;
      absoluteUrl = state.absoluteUrl;
      absoluteCommunityUrl = state.absoluteCommunityUrl;

      if (state.communityFromDomain) {
        // Will update absoluteUrl
        if (action.request.location && action.request.location.host) {
          absoluteUrl = action.request.location.protocol + '//' + action.request.location.host;
          communityUrl = '/';
          absoluteCommunityUrl = absoluteUrl;
        }
      } else {
        // Extract community url
        if (action.request.location.pathname) {
          const pathname = action.request.location.pathname;
          if (pathname !== state.location.pathname) {
            // Skip context path
            let pfx = pathname;
            if (pfx.startsWith(state.contextPath)) {
              pfx = pfx.substr(state.contextPath.length);
            }

            // Skip extra path info
            const i = pfx.indexOf('/', 1);
            if (i !== -1) {
              pfx = pfx.substr(0, i);
            }

            if (isCommunityUrlBlocked(pfx)) {
              communityUrl = state.contextPath;
            } else {
              communityUrl = state.contextPath + pfx;
            }

            absoluteCommunityUrl = absoluteUrl + communityUrl;
          }
        }
      }

      return update(state, {
        location: { $merge: { ...location, href: state.absoluteUrl + location.pathname } },
        absoluteUrl: { $set: absoluteUrl },
        communityUrl: { $set: communityUrl },
        absoluteCommunityUrl: { $set: absoluteCommunityUrl },
      });

    case SET_REQUEST_INFO: {
      /*
       * Set by SSR
       */
      location = action.request.location || state.location;
      absoluteUrl = action.request.absoluteUrl || state.absoluteUrl;
      absoluteCommunityUrl = action.request.absoluteCommunityUrl || state.absoluteCommunityUrl;
      const cookie = action.request.cookie || state.cookie;
      const communityFromDomain = action.request.communityFromDomain || state.communityFromDomain;
      const contextPath = action.request.contextPath || state.contextPath;
      communityUrl = action.request.communityUrl || state.communityUrl;
      const anchor = action.request.anchor || state.anchor;

      return update(state, {
        location: { $merge: location },
        cookie: { $set: cookie },
        absoluteUrl: { $set: absoluteUrl },
        communityUrl: { $set: communityUrl },
        absoluteCommunityUrl: { $set: absoluteCommunityUrl },
        communityFromDomain: { $set: communityFromDomain },
        contextPath: { $set: contextPath },
        referenceUrlId: { $set: action.request.referenceUrlId || state.referenceUrlId || 0 },
        anchor: { $set: anchor },
      });
    }

    default:
      return state;
  }
};

export default requestReducer;
