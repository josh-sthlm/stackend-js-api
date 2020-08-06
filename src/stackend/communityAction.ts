//@flow
import {
	REQUEST_COMMUNITIES,
	RECIEVE_COMMUNITIES,
	UPDATE_COMMUNITY,
	SET_COMMUNITY_SETTINGS,
	REMOVE_COMMUNITIES,
	REMOVE_COMMUNITY,
	RECEIVE_RESOURCE_USAGE
} from './communityReducer';

import * as Stackend from '../stackend';
import { Thunk } from '../api';

/**
 * Load communities
 *
 * @since 24 apr 2017
 * @author jens
 */

type RecieveCommunities = {
	results: {
		pageSize: number,
		page: number,
		entries: [any]
	}
};

export function recieveCommunities(json: RecieveCommunities): any {
	return {
		type: RECIEVE_COMMUNITIES,
		json,
		receievedAt: Date.now()
	};
}

export function requestCommunities(status: string): any {
	return {
		type: REQUEST_COMMUNITIES
	};
}

export function loadCommunity(community: Stackend.Community, objectsRequiringModeration?: number) {
	return {
		type: SET_COMMUNITY_SETTINGS,
		community: community,
		objectsRequiringModeration
	};
}

export function removeCommunities() {
	return {
		type: REMOVE_COMMUNITIES
	};
}

export function removeCommunity() {
	return {
		type: REMOVE_COMMUNITY
	};
}

export function fetchCommunity({ id, permalink }: { id?: number, permalink?: string }): Thunk<any> {
	return async (dispatch: any /*, getState: any*/) => {
		const json = await dispatch(Stackend.getCommunity({ id, permalink }));
		return dispatch(loadCommunity(json.stackendCommunity));
	};
}

type FetchCommunities = {
	myCommunities?: boolean,
	creatorUserId?: number,
	status?: string, // Module See Comments.CommentModule
	p?: number, //page number in paginated collection
	pageSize?: number
};

export function fetchCommunities({
	myCommunities = true,
	creatorUserId,
	status = '*',
	p = 1,
	pageSize = 10
}: FetchCommunities): Thunk<any> {
	return async (dispatch: any /*, getState: any*/) => {
		dispatch(requestCommunities(status));
		const json = await dispatch(
			Stackend.searchCommunity({ myCommunities, creatorUserId, status, pageSize, p })
		);
		return dispatch(recieveCommunities(json));
	};
}

function updateCommunity(json: any): any {
	return {
		type: UPDATE_COMMUNITY,
		receievedAt: Date.now(),
		json
	};
}

export function editCommunity({
	id = 0,
	name = '',
	permalink = '',
	description = '',
	status = Stackend.CommunityStatus.VISIBLE,
	locale = 'en_US',
	domains = []
}: {
	id?: number, // Post id
	name: string,
	permalink: string,
	description: string,
	status: string,
	locale: string, //The body text
	domains: any
}): Thunk<any> {
	return async (dispatch: any /*, getState: any*/) => {
		let response = await dispatch(
			Stackend.storeCommunity({ id, name, permalink, description, status, locale, domains })
		);

		if (!!id && id !== 0) {
			dispatch(updateCommunity(response.storedCommunity));
		} else {
			//This is a new comment
			dispatch(
				recieveCommunities({
					results: {
						pageSize: 1,
						page: 1,
						entries: [response.storedCommunity]
					}
				})
			);
		}
	};
}

export function loadCommunitySettings({
	id,
	permalink,
	domain
}: {
	id?: number,
	permalink?: string,
	domain?: string
}): Thunk<any> {
	return async function(dispatch: any) {
		try {
			const r = await dispatch(Stackend.getCommunity({ id, permalink, domain }));
			if (r.stackendCommunity === null) {
				//console.log("couldn't find community: ",permalink)
				return;
			}
			return dispatch(loadCommunity(r.stackendCommunity, r.objectsRequiringModeration));
		} catch (e) {
			console.error("Couldn't loadCommunitySettings: ", e);
		}
	};
}

export function receiveResourceUsage(json: any) {
	return {
		type: RECEIVE_RESOURCE_USAGE,
		maximumUseBeforeCharge: json.maximumUseBeforeCharge,
		resourceUsageLast30Days: json.resourceUsageLast30Days,
		hasPaymentMethod: json.hasPaymentMethod,
		isUserExcludedFromBilling: json.isUserExcludedFromBilling
	};
}
