// @flow
import update from 'immutability-helper';
import {
  GroupActions,
  INVALIDATE_GROUPS,
  RECEIVE_GROUP_MEMBERS,
  RECEIVE_GROUPS,
  RECEIVE_GROUPS_AUTH,
  REQUEST_GROUPS
} from './groupActions';
import { Group, GroupMemberAuth } from '../group';
import { AuthObject } from '../privileges';


export interface GroupState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number;
  entries: { [key: number]: Group }; //entries is an object with group id: group
  auth: { [key: number]: AuthObject }; //object with group-ids mapped to auth object
  groupMembers: { [key: number]: Array<GroupMemberAuth> };
}

const initialState: GroupState = {
  isFetching: false,
  didInvalidate: false,
  lastUpdated: Date.now(),
  entries: {},
  auth: {},
  groupMembers: {},
};

export default function groups(state: GroupState = initialState, action: GroupActions): GroupState {
  switch (action.type) {
    case REQUEST_GROUPS:
      return update(state, {
        isFetching: { $set: true },
        didInvalidate: { $set: false },
      });
    case RECEIVE_GROUPS:
      // FIXME: action.errors not passed on
      if (action.entries) {
        const uniqueGroupEntries: { [groupId: number]: Group } = {};
        // @ts-ignore
        [].concat(action.entries).map((group: Group) => (uniqueGroupEntries[group.id] = group));

        return update(state, {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: Date.now() },
          entries: { $merge: uniqueGroupEntries },
        });
      } else {
        return update(state, {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: Date.now() },
          entries: { $merge: [] },
        });
      }

    case INVALIDATE_GROUPS:
      return update(state, {
        didInvalidate: { $set: true },
      });

    case RECEIVE_GROUPS_AUTH:
      return update(state, {
        isFetching: { $set: false },
        didInvalidate: { $set: false },
        lastUpdated: { $set: Date.now() },
        auth: { $set: action.entries },
      });

    case RECEIVE_GROUP_MEMBERS:
      return update(state, {
        isFetching: { $set: false },
        didInvalidate: { $set: false },
        lastUpdated: { $set: Date.now() },
        groupMembers: { $merge: action.groupMembers },
      });
    default:
      return state;
  }
}
