// @flow
import update from 'immutability-helper';
import { GroupActions } from './groupActions'
import { Group, GroupMemberAuth } from '../group'
import { AuthObject } from '../privileges'
export const REQUEST_GROUPS = 'REQUEST_GROUPS';
export const RECIEVE_GROUPS = 'RECIEVE_GROUPS';
export const INVALIDATE_GROUPS = 'INVALIDATE_GROUPS';
export const RECIEVE_GROUPS_AUTH = 'RECIEVE_GROUPS_AUTH';
export const RECIEVE_GROUP_MEMBERS = 'RECIEVE_GROUP_MEMBERS';

interface State {
	isFetching: boolean,
	didInvalidate: boolean,
	lastUpdated: number,
	entries: { [key: number]: Group }, //entries is an object with group id: group
	auth: { [key: number]: AuthObject }, //object with group-ids maped to auth object
	groupMembers: { [key: number]: Array<GroupMemberAuth> }
}

const initialState:State = {
	isFetching: false,
	didInvalidate: false,
	lastUpdated: Date.now(),
	entries: {},
	auth: {},
	groupMembers: {}
};


export default function groups(state: State = initialState, action: GroupActions): State {
	switch (action.type) {
		case REQUEST_GROUPS:
			return update(state, {
				isFetching: { $set: true },
				didInvalidate: { $set: false }
			});
		case RECIEVE_GROUPS:
			// FIXME: action.errors not passed on
			if (!!action.entries) {
				let uniqueGroupEntries:{[groupId:number]: Group} = {};
				// @ts-ignore
        [].concat(action.entries).map((group:Group) => (uniqueGroupEntries[group.id] = group));

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
