// @flow
import get from 'lodash/get';
import { AuthObject } from '../user/privileges';
import {
  applyForMembership as _applyForMembership,
  getGroup,
  GetGroupResult,
  Group,
  GroupMemberAuth,
  listMembers,
  ListMembersResult,
  listMyGroups,
  ListMyGroupsResult,
  subscribe as _subscribe,
  SubscribeResult,
  unsubscribe as _unsubscribe
} from './index';

import { Thunk, XcapJsonResult } from '../api';
import { GroupState } from './groupReducer';
import LoadingState from '../api/LoadingState';

export const REQUEST_GROUPS = 'REQUEST_GROUPS';
export const RECEIVE_GROUPS = 'RECEIVE_GROUPS';
export const INVALIDATE_GROUPS = 'INVALIDATE_GROUPS';
export const RECEIVE_GROUPS_AUTH = 'RECEIVE_GROUPS_AUTH';
export const RECEIVE_GROUP_MEMBERS = 'RECEIVE_GROUP_MEMBERS';

export type Request = { type: typeof REQUEST_GROUPS; mine?: boolean };
export type Receive = { type: typeof RECEIVE_GROUPS; entries: Array<Group>; mine?: boolean };
export type ReceiveGroup = { type: typeof RECEIVE_GROUPS; entries: Array<Group>; mine?: boolean };
export type Invalidate = { type: typeof INVALIDATE_GROUPS };
export type ReceiveAuth = { type: typeof RECEIVE_GROUPS_AUTH; entries: { [id: number]: AuthObject } };

export type ReceiveMembers = {
  type: typeof RECEIVE_GROUP_MEMBERS;
  groupMembers: { [key: number]: Array<GroupMemberAuth> };
};

export type GroupActions = Request | Receive | ReceiveGroup | Invalidate | ReceiveAuth | ReceiveMembers;

/**
 * Fetch my groups
 * @param refresh
 */
export function fetchMyGroups(refresh = false): Thunk<Promise<void>> {
  return async (dispatch: any, getState: any): Promise<void> => {
    const groups: GroupState = getState().groups;
    if (
      groups.myGroups.loadingState === LoadingState.NOT_STARTED ||
      (refresh && groups.myGroups.loadingState === LoadingState.READY)
    ) {
      dispatch(requestGroups(true));
      const json: ListMyGroupsResult = await dispatch(listMyGroups({}));
      dispatch(receiveGroups({ entries: json.groups.entries, mine: true }));
      dispatch(receiveGroupsAuth({ entries: json.groupAuth }));
    }
  };
}

/**
 * Get my groups from
 * @param groups
 */
export function getMyGroups(groups: GroupState): Array<Group> {
  if (groups.myGroups.loadingState !== LoadingState.READY) {
    return [];
  }

  const r: Array<Group> = [];
  groups.myGroups.ids.forEach(id => {
    const g = groups.entries[id];
    if (g) {
      r.push(g);
    }
  });
  return r;
}

/**
 * Get a group by id from the store
 * @param groups
 * @param id
 */
export function getGroupById(groups: GroupState, id: number): Group | null {
  return groups.entries[id] || null;
}

/**
 * Get a group by permalink from the store
 * @param groups
 * @param permalink
 */
export function getGroupByPermalink(groups: GroupState, permalink: string): Group | null {
  const id = groups.idByPermalink[permalink];
  if (!id) {
    return null;
  }
  return getGroupById(groups, id);
}

/**
 * Request a group
 */
export function fetchGroup({
  groupPermalink,
  groupId,
  refresh = false
}: {
  groupPermalink?: string;
  groupId?: number;
  refresh?: boolean;
}): Thunk<Promise<Group | null>> {
  return async (dispatch: any, getState: any): Promise<Group | null> => {
    if (!refresh) {
      const groups: GroupState = getState().groups;
      let group: Group | null = null;
      if (groupId) {
        group = groups.entries[groupId];
      } else {
        const id: any = Object.keys(groups.entries).find((id: any) => groups.entries[id]?.permalink === groupPermalink);
        group = groups.entries[id];
      }
      if (group) {
        return group;
      }
    }
    dispatch(requestGroups());
    const json: GetGroupResult = await dispatch(getGroup({ groupPermalink, groupId }));
    dispatch(receiveGroups({ entries: json.group ? [json.group] : [] }));
    return json.group;
  };
}

/**
 * Request a group
 * @deprecated use fetchGroup instead
 */
export const addGroup = fetchGroup;

/**
 * Subscribe to a group
 * @param groupPermalink
 * @param groupId
 */
export function subscribe({
  groupPermalink,
  groupId
}: {
  groupPermalink?: string;
  groupId?: number;
}): Thunk<Promise<SubscribeResult>> {
  return async (dispatch: any /*, getState: any*/): Promise<SubscribeResult> => {
    const json = await dispatch(_subscribe({ groupPermalink, groupId }));
    console.log('subscribe', json);

    try {
      dispatch(fetchGroupMembers({ groupId: json.groupId }));
    } catch (e) {
      console.error("Error: couldn't find groupId in subscribe response:", e);
    }

    const myGroups = await dispatch(listMyGroups({}));
    dispatch(receiveGroupsAuth({ entries: get(myGroups, 'groupAuth') }));

    return json;
  };
}

/**
 * Unsubscribe from a group
 * @param groupPermalink
 * @param groupId
 */
export function unsubscribe({
  groupPermalink,
  groupId
}: {
  groupPermalink?: string;
  groupId?: number;
}): Thunk<Promise<XcapJsonResult>> {
  return async (dispatch: any): Promise<XcapJsonResult> => {
    const json = await dispatch(_unsubscribe({ groupPermalink, groupId }));
    try {
      dispatch(fetchGroupMembers({ groupId: json.groupId }));
    } catch (e) {
      console.error("Error: couldn't find groupId in unsubscribe response:", e);
    }

    const myGroups = await dispatch(listMyGroups({}));
    dispatch(receiveGroupsAuth({ entries: get(myGroups, 'groupAuth') }));
    return json;
  };
}

export interface ApplyForMembership {
  groupPermalink: string; // ex: 'group/pelles-group'
  groupId: number; //ex: 1
}

export function applyForMembership({ groupPermalink, groupId }: ApplyForMembership): Thunk<Promise<XcapJsonResult>> {
  return async (dispatch: any /*, getState: any*/): Promise<XcapJsonResult> => {
    const json = await dispatch(_applyForMembership({ groupPermalink, groupId }));
    const myGroups = await dispatch(listMyGroups({}));
    dispatch(receiveGroupsAuth({ entries: get(myGroups, 'groupAuth') }));
    return json;
  };
}

export function requestGroups(mine?: boolean): Request {
  return { type: REQUEST_GROUPS, mine };
}

export interface ReceiveGroups {
  entries: Array<Group>;
  mine?: boolean;
}

export function receiveGroups({ entries, mine }: ReceiveGroups): Receive {
  return {
    type: RECEIVE_GROUPS,
    entries,
    mine
  };
}

export function invalidateGroups(): Invalidate {
  return { type: INVALIDATE_GROUPS };
}

type ReceiveGroupsAuth = {
  entries: {
    [key: number]: AuthObject;
  };
};

/**
 * Receives a list of the current users auth-status for all groups the user is part of.
 */
export function receiveGroupsAuth({ entries }: ReceiveGroupsAuth): ReceiveAuth {
  return {
    type: RECEIVE_GROUPS_AUTH,
    entries
  };
}

type ReceiveGroupMembers = {
  groupMembers: { [key: number]: Array<GroupMemberAuth> };
};

export function receiveGroupMembers({ groupMembers }: ReceiveGroupMembers): ReceiveMembers {
  return {
    type: RECEIVE_GROUP_MEMBERS,
    groupMembers
  };
}

/**
 * Requests and receive comments and store them in redux-state
 */
export function fetchGroupMembers({
  groupId,
  groupPermalink
}: {
  groupId?: number;
  groupPermalink?: string;
}): Thunk<Promise<ListMembersResult>> {
  return async (dispatch: any): Promise<ListMembersResult> => {
    const json = await dispatch(listMembers({ groupId, groupPermalink }));
    dispatch(receiveGroups({ entries: json.group }));
    dispatch(receiveGroupMembers({ groupMembers: { [json.groupId]: json.groupMembers } }));
    return json;
  };
}
