// @flow
import update from 'immutability-helper';
import * as xcapApi from '../xcap/api.js';
import * as groupApi from './group.js';
import { Action } from '../types/action.js';

export const REQUEST_GROUPS = 'REQUEST_GROUPS';
export const RECIEVE_GROUPS = 'RECIEVE_GROUPS';
export const INVALIDATE_GROUPS = 'INVALIDATE_GROUPS';
export const RECIEVE_GROUPS_AUTH = 'RECIEVE_GROUPS_AUTH';
export const RECIEVE_GROUP_MEMBERS = 'RECIEVE_GROUP_MEMBERS';

type State = {
	+isFetching: boolean,
	+didInvalidate: boolean,
	+lastUpdated: Date,
	+entries: { [key: number]: groupApi.Group }, //entries is an object with group id: group
	+auth: { [key: number]: xcapApi.AuthObject }, //object with group-ids maped to auth object
	+groupMembers: { [key: number]: Array<groupApi.GroupMemberAuth> }
};

const initialState = {
	isFetching: false,
	didInvalidate: false,
	lastUpdated: Date.now(),
	entries: {},
	auth: {},
	groupMembers: {}
};

export default function groups(state: State = initialState, action: Action): State {
	switch (action.type) {
		case REQUEST_GROUPS:
			return update(state, {
				isFetching: { $set: true },
				didInvalidate: { $set: false }
			});
		case RECIEVE_GROUPS:
			// FIXME: action.errors not passed on
			if (!!action.entries) {
				let uniqueGroupEntries = {};
				[].concat(action.entries).map(group => (uniqueGroupEntries[group.id] = group));

				return update(state, {
					isFetching: { $set: false },
					didInvalidate: { $set: false },
					lastUpdated: { $set: Date.now() },
					entries: { $merge: uniqueGroupEntries }
				});
			} else {
				return update(state, {
					isFetching: { $set: false },
					didInvalidate: { $set: false },
					lastUpdated: { $set: Date.now() },
					entries: { $merge: [] }
				});
			}

		case INVALIDATE_GROUPS:
			return update(state, {
				didInvalidate: { $set: true }
			});
		case RECIEVE_GROUPS_AUTH:
			return update(state, {
				isFetching: { $set: false },
				didInvalidate: { $set: false },
				lastUpdated: { $set: Date.now() },
				auth: { $set: action.entries }
			});
		case RECIEVE_GROUP_MEMBERS:
			return update(state, {
				isFetching: { $set: false },
				didInvalidate: { $set: false },
				lastUpdated: { $set: Date.now() },
				groupMembers: { $merge: action.groupMembers }
			});
		default:
			return state;
	}
}
