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
import { Group, GroupMemberAuth } from './index';
import { AuthObject } from '../user/privileges';

import LoadingState from '../api/LoadingState';

export interface MyGroupsState {
  loadingState: LoadingState;
  /**
   * Id's of my groups
   */
  ids: Array<number>;
}

export interface GroupState {
  isFetching: boolean;
  didInvalidate: boolean;
  lastUpdated: number;

  /**
   * All loaded groups by id
   */
  entries: { [key: number]: Group };

  /**
   * My groups
   */
  myGroups: MyGroupsState;

  /**
   * Auth arranged by group id
   */
  auth: { [key: number]: AuthObject };

  /**
   * Group members by group id
   */
  groupMembers: { [key: number]: Array<GroupMemberAuth> };
}

const initialState: GroupState = {
  isFetching: false,
  didInvalidate: false,
  lastUpdated: Date.now(),
  entries: {},
  myGroups: {
    loadingState: LoadingState.NOT_STARTED,
    ids: []
  },
  auth: {},
  groupMembers: {}
};

export default function groups(state: GroupState = initialState, action: GroupActions): GroupState {
  switch (action.type) {
    case REQUEST_GROUPS:
      return update(state, {
        isFetching: { $set: true },
        didInvalidate: { $set: false }
      });
    case RECEIVE_GROUPS:
      // FIXME: action.errors not passed on
      if (action.entries) {
        const uniqueGroupEntries: { [groupId: number]: Group } = {};
        const newGroupIds: Array<number> = [];
        action.entries.forEach((group: Group) => {
          uniqueGroupEntries[group.id] = group;
          newGroupIds.push(group.id);
        });

        let myGroups = state.myGroups;
        if (action.mine) {
          myGroups = Object.assign({}, myGroups, {
            loadingState: LoadingState.READY,
            ids: myGroups.ids.concat(newGroupIds)
          });
        }

        return update(state, {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: Date.now() },
          entries: { $merge: uniqueGroupEntries },
          myGroups: { $set: myGroups }
        });
      } else {
        let myGroups = state.myGroups;
        if (action.mine) {
          myGroups = Object.assign({}, myGroups, {
            loadingState: LoadingState.READY
          });
        }
        return update(state, {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: Date.now() },
          entries: { $merge: [] },
          myGroups: { $set: myGroups }
        });
      }

    case INVALIDATE_GROUPS:
      return update(state, {
        didInvalidate: { $set: true }
      });

    case RECEIVE_GROUPS_AUTH:
      return update(state, {
        isFetching: { $set: false },
        didInvalidate: { $set: false },
        lastUpdated: { $set: Date.now() },
        auth: { $set: action.entries }
      });

    case RECEIVE_GROUP_MEMBERS:
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
