import {
  REQUEST_COMMUNITIES,
  RECEIVE_COMMUNITIES,
  UPDATE_COMMUNITY,
  SET_COMMUNITY_SETTINGS,
  REMOVE_COMMUNITIES,
  REMOVE_COMMUNITY,
  RECEIVE_RESOURCE_USAGE,
  CommunityActions,
} from './communityReducer';

import { Thunk } from '../api';
import { Community, CommunityStatus, getCommunity, searchCommunity, storeCommunity } from './index';

export interface ResourceUsage {
  maximumUseBeforeCharge: { [key: string]: number };
  resourceUsageLast30Days: { [key: string]: number };
  hasPaymentMethod: boolean;
  isUserExcludedFromBilling: boolean;
}

/**
 * Load communities
 *
 * @since 24 apr 2017
 *
 */

export type ReceiveCommunities = {
  results: {
    pageSize: number;
    page: number;
    entries: Array<any>;
  };
  statistics?: any;
};

export function receiveCommunities(json: ReceiveCommunities): CommunityActions {
  return {
    type: RECEIVE_COMMUNITIES,
    json,
    receivedAt: Date.now(),
  };
}

export function requestCommunities(status: string): CommunityActions {
  return {
    type: REQUEST_COMMUNITIES,
  };
}

export function loadCommunity(community: Community, objectsRequiringModeration?: number): CommunityActions {
  return {
    type: SET_COMMUNITY_SETTINGS,
    community: community,
    objectsRequiringModeration,
  };
}

export function removeCommunities(): CommunityActions {
  return {
    type: REMOVE_COMMUNITIES,
  };
}

export function removeCommunity(): CommunityActions {
  return {
    type: REMOVE_COMMUNITY,
  };
}

export function fetchCommunity({ id, permalink }: { id?: number; permalink?: string }): Thunk<any> {
  return async (dispatch: any /*, getState: any*/): Promise<any> => {
    const json = await dispatch(getCommunity({ id, permalink }));
    return dispatch(loadCommunity(json.stackendCommunity));
  };
}

export type FetchCommunities = {
  myCommunities?: boolean;
  creatorUserId?: number;
  status?: string; // Module See Comments.CommentModule
  p?: number; //page number in paginated collection
  pageSize?: number;
};

export function fetchCommunities({
  myCommunities = true,
  creatorUserId,
  status = '*',
  p = 1,
  pageSize = 10,
}: FetchCommunities): Thunk<any> {
  return async (dispatch: any /*, getState: any*/): Promise<any> => {
    dispatch(requestCommunities(status));
    const json = await dispatch(searchCommunity({ myCommunities, creatorUserId, status, pageSize, p }));
    return dispatch(receiveCommunities(json));
  };
}

function updateCommunity(community: Community): CommunityActions {
  return {
    type: UPDATE_COMMUNITY,
    receivedAt: Date.now(),
    community,
  };
}

export function editCommunity({
  id = 0,
  name = '',
  permalink = '',
  description = '',
  status = CommunityStatus.VISIBLE,
  locale = 'en_US',
  domains = [],
}: {
  id?: number; // Post id
  name: string;
  permalink: string;
  description: string;
  status: string;
  locale: string; //The body text
  domains: any;
}): Thunk<any> {
  return async (dispatch: any /*, getState: any*/): Promise<any> => {
    const response = await dispatch(storeCommunity({ id, name, permalink, description, status, locale, domains }));

    if (!!id && id !== 0) {
      dispatch(updateCommunity(response.storedCommunity));
    } else {
      //This is a new community
      dispatch(
        receiveCommunities({
          results: {
            pageSize: 1,
            page: 1,
            entries: [response.storedCommunity],
          },
        })
      );
    }
  };
}

export function loadCommunitySettings({
  id,
  permalink,
  domain,
}: {
  id?: number;
  permalink?: string;
  domain?: string;
}): Thunk<any> {
  return async function (dispatch: any): Promise<any> {
    try {
      const r = await dispatch(getCommunity({ id, permalink, domain }));
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

export function receiveResourceUsage(json: ResourceUsage): CommunityActions {
  return {
    type: RECEIVE_RESOURCE_USAGE,
    maximumUseBeforeCharge: json.maximumUseBeforeCharge,
    resourceUsageLast30Days: json.resourceUsageLast30Days,
    hasPaymentMethod: json.hasPaymentMethod,
    isUserExcludedFromBilling: json.isUserExcludedFromBilling,
  };
}
