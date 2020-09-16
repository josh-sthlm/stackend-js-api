// @flow
import get from 'lodash/get';
import { AuthObject } from '../user/privileges';
import {
  Group,
  GroupMemberAuth,
  listMyGroups,
  subscribe as _subscribe,
  unsubscribe as _unsubscribe,
  applyForMembership as _applyForMembership,
  listMembers,
  getGroup,
  ListMembersResult,
  SubscribeResult
} from './index';

import { Thunk, XcapJsonResult } from '../api';

export const REQUEST_GROUPS = 'REQUEST_GROUPS';
export const RECEIVE_GROUPS = 'RECEIVE_GROUPS';
export const INVALIDATE_GROUPS = 'INVALIDATE_GROUPS';
export const RECEIVE_GROUPS_AUTH = 'RECEIVE_GROUPS_AUTH';
export const RECEIVE_GROUP_MEMBERS = 'RECEIVE_GROUP_MEMBERS';

export type Request = { type: typeof REQUEST_GROUPS };
export type Receive = { type: typeof RECEIVE_GROUPS; entries: Array<Group> };
export type ReceiveGroup = { type: typeof RECEIVE_GROUPS; entries: Array<Group> };
export type Invalidate = { type: typeof INVALIDATE_GROUPS };
export type ReceiveAuth = { type: typeof RECEIVE_GROUPS_AUTH; entries: { [id: number]: AuthObject } };

export type ReceiveMembers = {
  type: typeof RECEIVE_GROUP_MEMBERS;
  groupMembers: { [key: number]: Array<GroupMemberAuth> };
};

export type GroupActions = Request | Receive | ReceiveGroup | Invalidate | ReceiveAuth | ReceiveMembers;

/**
 * Fetch my groups
 */
export function fetchMyGroups(): Thunk<void> {
  return async (dispatch: any /*, getState: GetState*/): Promise<void> => {
    dispatch(requestGroups());
    const json = await dispatch(listMyGroups({}));
    dispatch(receiveGroups({ entries: json }));
  };
}

/**
 * Add group
 */
export function addGroup({ groupPermalink, groupId }: { groupPermalink?: string; groupId?: number }): Thunk<void> {
  return async (dispatch: any /*, getState: GetState*/): Promise<void> => {
    dispatch(requestGroups());
    const json = await dispatch(getGroup({ groupPermalink, groupId }));
    dispatch(receiveGroups({ entries: [json.group] }));
  };
}

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

export function requestGroups(): Request {
  return { type: REQUEST_GROUPS };
}

export interface ReceiveGroups {
  entries: Array<Group>;
}

export function receiveGroups({ entries }: ReceiveGroups): Receive {
  return {
    type: RECEIVE_GROUPS,
    entries
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
