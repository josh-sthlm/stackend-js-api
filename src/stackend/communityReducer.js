// @flow
import update from 'immutability-helper';
import { type Community } from './stackend.ts';

export const KEY: string = 'COMMUNITIES';

export const REQUEST_COMMUNITIES: string = 'REQUEST_COMMUNITIES';
export const RECIEVE_COMMUNITIES: string = 'RECIEVE_COMMUNITIES';
export const UPDATE_COMMUNITY: string = 'UPDATE_COMMUNITY';
export const SET_COMMUNITY_SETTINGS: string = 'SET_COMMUNITY_SETTINGS';
export const REMOVE_COMMUNITIES: string = 'REMOVE_COMMUNITIES';
export const REMOVE_COMMUNITY: string = 'REMOVE_COMMUNITY';
export const RECEIVE_RESOURCE_USAGE: string = 'RECEIVE_RESOURCE_USAGE';

export type CommunityState = {
	community?: any,
	communities?: Community & {
		objectsRequiringModeration?: number
	},
	resourceUsage?: {
		maximumUseBeforeCharge: ?any,
		resourceUsageLast30Days: ?any,
		hasPaymentMethod: boolean,
		isUserExcludedFromBilling: boolean
	},
	isFetching?: boolean,
	didInvalidate?: boolean,
	lastUpdated?: number
};

//Reducer
export default function communityReducer(
	state: CommunityState = {},
	action: {
		type: string,
		json: {
			result: [any]
		}
	}
) {
	switch (action.type) {
		case REQUEST_COMMUNITIES:
			return Object.assign({}, state, {
				isFetching: true,
				didInvalidate: false
			});

		case RECIEVE_COMMUNITIES:
			return Object.assign({}, state, {
				isFetching: false,
				didInvalidate: false,
				lastUpdated: action.receievedAt,
				communities: action.json.results,
				statistics: action.json.statistics
			});

		case UPDATE_COMMUNITY: {
			const u = action.json;

			if (!!state.json.result) {
				let entries = state.json.result.entries;
				let found = false;
				for (let i = 0; i < entries.length; i++) {
					let e = entries[i];
					if (e.id === update.id) {
						found = true;
						e.name = u.name;
						e.description = u.description;
						e.status = u.status;
						e.domains = u.domains;
						break;
					}
				}

				if (!found) {
					entries.push(action.json);
				}
			}

			return update(state, {
				isFetching: { $set: false },
				didInvalidate: { $set: false },
				lastUpdated: { $set: action.receievedAt },
				json: { $set: action.json }
			});
		}

		case SET_COMMUNITY_SETTINGS: {
			if (!!action.community) {
				// FIXME: Use of window still needed for xcap.js and old javascripts
				window.xcapCommunityName = action.community.name;
				window.xcapCommunityPermalink = action.community.permalink;
			}

			let x = {
				objectsRequiringModeration: action.objectsRequiringModeration,
				...action.community
			};

			return update(state, {
				community: { $set: x }
			});
		}

		case REMOVE_COMMUNITIES:
			//window.xcapCommunityName = '';
			//window.xcapCommunityPermalink = '';
			return {};

		case REMOVE_COMMUNITY:
			return update(state, {
				community: { $set: null }
			});

		case RECEIVE_RESOURCE_USAGE:
			return update(state, {
				resourceUsage: {
					$set: {
						maximumUseBeforeCharge: action.maximumUseBeforeCharge,
						resourceUsageLast30Days: action.resourceUsageLast30Days,
						hasPaymentMethod: action.hasPaymentMethod,
						isUserExcludedFromBilling: action.isUserExcludedFromBilling
					}
				}
			});

		default:
			return state;
	}
}
