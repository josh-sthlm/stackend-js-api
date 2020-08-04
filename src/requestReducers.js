//@flow
import update from 'immutability-helper';
import { type Request } from './request.js';
export const SET_REQUEST_INFO = 'SET_REQUEST_INFO';
import { LOCATION_CHANGE } from 'react-router-redux';
import { isCommunityUrlBlocked } from './stackend/stackend.js';

/**
 * Sets up an implementaion neutral object that keeps track of the current url
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
			query: {}
		},
		cookie: null,
		absoluteUrl: '',
		communityUrl: '',
		absoluteCommunityUrl: '',
		communityFromDomain: false,
		contextPath: '',
		anchor: null
	},
	action: any
) => {
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

		case LOCATION_CHANGE:
			/* In response to a navigation event. Will only update the
			 * location and possibly the community urls
			 */

			// Show the content when the css is loaded
			if (document) {
				let p = document.getElementById('xcapPage');
				if (p && p.style.display === 'none') {
					p.style.display = 'block';
				}
			}

			// NOTE: action.payload is NOT compatible with request.location. Does not update all props
			action.request =
				!action.request && !!action.payload ? { location: action.payload } : action.request;
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
					let pathname = action.request.location.pathname;
					if (pathname !== state.location.pathname) {
						// Skip context path
						let pfx = pathname;
						if (pfx.startsWith(state.contextPath)) {
							pfx = pfx.substr(state.contextPath.length);
						}

						// Skip extra path info
						let i = pfx.indexOf('/', 1);
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
				absoluteCommunityUrl: { $set: absoluteCommunityUrl }
			});

		case SET_REQUEST_INFO: {
			/*
			 * Set by SSR
			 */
			location = action.request.location || state.location;
			absoluteUrl = action.request.absoluteUrl || state.absoluteUrl;
			absoluteCommunityUrl = action.request.absoluteCommunityUrl || state.absoluteCommunityUrl;
			let cookie = action.request.cookie || state.cookie;
			let communityFromDomain = action.request.communityFromDomain || state.communityFromDomain;
			let contextPath = action.request.contextPath || state.contextPath;
			communityUrl = action.request.communityUrl || state.communityUrl;
			let anchor = action.request.anchor || state.anchor;

			return update(state, {
				location: { $merge: location },
				cookie: { $set: cookie },
				absoluteUrl: { $set: absoluteUrl },
				communityUrl: { $set: communityUrl },
				absoluteCommunityUrl: { $set: absoluteCommunityUrl },
				communityFromDomain: { $set: communityFromDomain },
				contextPath: { $set: contextPath },
				referenceUrlId: { $set: action.request.referenceUrlId || state.referenceUrlId || 0 },
				anchor: { $set: anchor }
			});
		}

		default:
			return state;
	}
};
