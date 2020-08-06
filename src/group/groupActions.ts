// @flow
import _ from 'lodash';
import { AuthObject } from '../api';
import {
	Group,
	GroupMemberAuth,
	listMyGroups,
	subscribe as _subscribe,
	unsubscribe as _unsubscribe,
	applyForMembership as _applyForMembership,
	listMembers,
	getGroup
} from '../group';

import { Dispatch } from 'redux';
import { Thunk } from '../store';
import * as reducer from './groupReducer';

type Request = { type: 'REQUEST_GROUPS' };
type Recieve = { type: 'RECIEVE_GROUPS', entries: Array<Group> };
type RecieveGroup = { type: 'RECIEVE_GROUP', entries: Array<Group> };
type Invalidate = { type: 'INVALIDATE_GROUPS' };
type RecieveAuth = { type: 'RECIEVE_GROUPS_AUTH', entries: { [number]: AuthObject } };
type RecieveMembers = {
	type: 'RECIEVE_GROUP_MEMBERS',
	groupMembers: { [key: number]: Array<GroupMemberAuth> }
};

export type groupActionTypes =
	| 'REQUEST_GROUPS'
	| 'RECIEVE_GROUPS'
	| 'INVALIDATE_GROUPS'
	| 'RECIEVE_GROUPS_AUTH'
	| 'RECIEVE_GROUP_MEMBERS';
export type groupActions = Request | Recieve | Invalidate | RecieveAuth | RecieveMembers;

/**
 * Fetch my groups
 */
export function fetchMyGroups(): Thunk<any> {
	return async (dispatch: Dispatch /*, getState: GetState*/) => {
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
}): Thunk<any> {
	return async (dispatch: Dispatch /*, getState: GetState*/) => {
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
	return async (dispatch: Dispatch /*, getState: any*/) => {
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
}): Thunk<any> {
	return async (dispatch: Dispatch /*, getState: any*/) => {
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

interface ApplyForMembership {
	groupPermalink: string, // ex: 'group/pelles-group'
	groupId: number //ex: 1
}

export function applyForMembership({ groupPermalink, groupId }: ApplyForMembership): Thunk<*> {
	return async (dispatch: Dispatch /*, getState: any*/) => {
		let json = await _applyForMembership({ groupPermalink, groupId });
		let myGroups = await dispatch(listMyGroups());
		dispatch(recieveGroupsAuth({ entries: _.get(myGroups, 'groupAuth') }));
		return json;
	};
}

export function requestGroups(): Request {
	return { type: reducer.REQUEST_GROUPS };
}

interface RecieveGroups {
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
}): Thunk<any> {
	return async (dispatch: Dispatch /*, getState: any*/) => {
		let json = await dispatch(listMembers({ groupId, groupPermalink }));
		dispatch(recieveGroups({ entries: json.group, json }));
		dispatch(recieveGroupMembers({ groupMembers: { [json.groupId]: json.groupMembers }, json }));
		return json;
	};
}
