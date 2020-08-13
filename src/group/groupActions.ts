// @flow
import _ from 'lodash';
import { AuthObject } from '../privileges';
import {
	Group,
	GroupMemberAuth,
	listMyGroups,
	subscribe as _subscribe,
	unsubscribe as _unsubscribe,
	applyForMembership as _applyForMembership,
	listMembers,
	getGroup, ListMembersResult
} from '../group'

import { Thunk, XcapJsonResult } from '../api'
import * as reducer from './groupReducer';

export type Request = { type: 'REQUEST_GROUPS' };
export type Recieve = { type: 'RECIEVE_GROUPS', entries: Array<Group> };
export type RecieveGroup = { type: 'RECIEVE_GROUP', entries: Array<Group> };
export type Invalidate = { type: 'INVALIDATE_GROUPS' };
export type RecieveAuth = { type: 'RECIEVE_GROUPS_AUTH', entries: { [id:number]: AuthObject } };
export type RecieveMembers = {
	type: 'RECIEVE_GROUP_MEMBERS',
	groupMembers: { [key: number]: Array<GroupMemberAuth> }
};

export type GroupActions = Request | Recieve | RecieveGroup | Invalidate | RecieveAuth | RecieveMembers;

/**
 * Fetch my groups
 */
export function fetchMyGroups(): Thunk<void> {
	return async (dispatch: any /*, getState: GetState*/) => {
		dispatch(requestGroups());
		let json = await dispatch(listMyGroups());
		dispatch(recieveGroups({ entries: json }));
	};
}

/**
 * Add group
 */
export function addGroup({
	groupPermalink,
	groupId
}: {
	groupPermalink?: string,
	groupId?: number
}): Thunk<void> {
	return async (dispatch: any /*, getState: GetState*/) => {
		dispatch(requestGroups());
		let json = await dispatch(getGroup({ groupPermalink, groupId }));
		dispatch(recieveGroups({ entries: [json.group] }));
	};
}

/**
 * Subscribe to a group
 * @param groupPermalink
 * @param groupId
 * @returns {function(Dispatch)}
 */
export function subscribe({
	groupPermalink,
	groupId
}: {
	groupPermalink?: string,
	groupId?: number
}): Thunk<any> {
	return async (dispatch: any /*, getState: any*/) => {
		let json = await dispatch(_subscribe({ groupPermalink, groupId }));
		console.log('subscribe', json);

		try {
			dispatch(fetchGroupMembers({ groupId: json.groupId }));
		} catch (e) {
			console.error("Error: couldn't find groupId in subscribe response:", e);
		}

		let myGroups = await dispatch(listMyGroups());
		dispatch(recieveGroupsAuth({ entries: _.get(myGroups, 'groupAuth') }));

		return json;
	};
}

/**
 * Unsubscribe from a group
 * @param groupPermalink
 * @param groupId
 * @returns {function(Dispatch)}
 */
export function unsubscribe({
	groupPermalink,
	groupId
}: {
	groupPermalink?: string,
	groupId?: number
}): Thunk<XcapJsonResult> {
	return async (dispatch:any) => {
		let json = await dispatch(_unsubscribe({ groupPermalink, groupId }));
		try {
			dispatch(fetchGroupMembers({ groupId: json.groupId }));
		} catch (e) {
			console.error("Error: couldn't find groupId in unsubscribe response:", e);
		}

		let myGroups = await dispatch(listMyGroups());
		dispatch(recieveGroupsAuth({ entries: _.get(myGroups, 'groupAuth') }));
		return json;
	};
}

export interface ApplyForMembership {
	groupPermalink: string, // ex: 'group/pelles-group'
	groupId: number //ex: 1
}

export function applyForMembership({ groupPermalink, groupId }: ApplyForMembership): Thunk<XcapJsonResult> {
	return async (dispatch: any /*, getState: any*/) => {
		let json = await _applyForMembership({ groupPermalink, groupId });
		let myGroups = await dispatch(listMyGroups());
		dispatch(recieveGroupsAuth({ entries: _.get(myGroups, 'groupAuth') }));
		return json;
	};
}

export function requestGroups(): Request {
	return { type: reducer.REQUEST_GROUPS };
}

export interface RecieveGroups {
	entries: Array<Group>
}

export function recieveGroups({ entries }: RecieveGroups): Recieve {
	return {
		type: reducer.RECIEVE_GROUPS,
		entries
	};
}

export function invalidateGroups(): Invalidate {
	return { type: reducer.INVALIDATE_GROUPS };
}

type RecieveGroupsAuth = {
	entries: {
		[key: number]: AuthObject
	}
};
//Receives a list of the current users auth-status for all groups the user is part of.
export function recieveGroupsAuth({ entries }: RecieveGroupsAuth): RecieveAuth {
	return {
		type: reducer.RECIEVE_GROUPS_AUTH,
		entries
	};
}
type RecieveGroupMembers = {
	groupMembers: { [key: number]: Array<GroupMemberAuth> }
};
export function recieveGroupMembers({ groupMembers }: RecieveGroupMembers): RecieveMembers {
	return {
		type: reducer.RECIEVE_GROUP_MEMBERS,
		groupMembers
	};
}

//Requests and recieve comments and store them in redux-state
export function fetchGroupMembers({
	groupId,
	groupPermalink
}: {
	groupId?: number,
	groupPermalink?: string
}): Thunk<ListMembersResult> {
	return async (dispatch:any) => {
		let json = await dispatch(listMembers({ groupId, groupPermalink }));
		dispatch(recieveGroups({ entries: json.group }));
		dispatch(recieveGroupMembers({ groupMembers: { [json.groupId]: json.groupMembers } }));
		return json;
	};
}
