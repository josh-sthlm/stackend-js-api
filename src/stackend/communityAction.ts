import {
  REQUEST_COMMUNITIES,
  RECEIVE_COMMUNITIES,
  UPDATE_COMMUNITY,
  SET_COMMUNITY_SETTINGS,
  REMOVE_COMMUNITIES,
  REMOVE_COMMUNITY,
  RECEIVE_RESOURCE_USAGE,
  CommunityActions,
  CommunityState
} from './communityReducer';

import { Thunk } from '../api';
import {
  Community,
  CommunityStatus,
  getCommunity,
  GetCommunityResult,
  searchCommunity,
  SearchCommunityResult,
  storeCommunity,
  StoreCommunityResult
} from './index';

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
    receivedAt: Date.now()
  };
}

export function requestCommunities(status: string): CommunityActions {
  return {
    type: REQUEST_COMMUNITIES
  };
}

/**
 * Set the current community
 * @param community
 * @param objectsRequiringModeration
 * @deprecated, use setCurrentCommunity instead
 */
export const loadCommunity = setCurrentCommunity;

/**
 * Set the current community
 * @param community
 * @param objectsRequiringModeration
 */
export function setCurrentCommunity(community: Community, objectsRequiringModeration?: number): CommunityActions {
  return {
    type: SET_COMMUNITY_SETTINGS,
    community: community,
    objectsRequiringModeration
  };
}

export function clearCommunities(): CommunityActions {
  return {
    type: REMOVE_COMMUNITIES
  };
}

/**
 * Remove all communities from the redux state
 * @deprecated use clearCommunities instead
 */
export const removeCommunities = clearCommunities;

/**
 * Remove the current community from the redux state
 * @deprecated use clearCurrentCommunity instead
 */
export const removeCommunity = clearCurrentCommunity;

/**
 * Remove the current community from the redux state
 */
export function clearCurrentCommunity(): CommunityActions {
  return {
    type: REMOVE_COMMUNITY
  };
}

/**
 * Fetch a single community and set it to be the current community
 * @param id
 * @param permalink
 */
export function fetchCommunity({
  id,
  permalink
}: {
  id?: number;
  permalink?: string;
}): Thunk<Promise<GetCommunityResult>> {
  return async (dispatch: any /*, getState: any*/): Promise<GetCommunityResult> => {
    const json = await dispatch(getCommunity({ id, permalink }));
    dispatch(setCurrentCommunity(json.stackendCommunity, json.objectsRequiringModeration));
    return json;
  };
}

export type FetchCommunities = {
  myCommunities?: boolean;
  creatorUserId?: number;
  status?: string; // Module See Comments.CommentModule
  p?: number; //page number in paginated collection
  pageSize?: number;
};

/**
 * Fetch a list of communities
 * @param myCommunities
 * @param creatorUserId
 * @param status
 * @param p
 * @param pageSize
 */
export function fetchCommunities({
  myCommunities = true,
  creatorUserId,
  status = '*',
  p = 1,
  pageSize = 10
}: FetchCommunities): Thunk<Promise<SearchCommunityResult>> {
  return async (dispatch: any /*, getState: any*/): Promise<SearchCommunityResult> => {
    dispatch(requestCommunities(status));
    const json = await dispatch(searchCommunity({ myCommunities, creatorUserId, status, pageSize, p }));
    dispatch(receiveCommunities(json));
    return json;
  };
}

/**
 * Update the current community
 * @param community
 */
function updateCommunity(community: Community): CommunityActions {
  return {
    type: UPDATE_COMMUNITY,
    receivedAt: Date.now(),
    community
  };
}

/**
 * Store a community and update the redux store
 * @param id
 * @param name
 * @param permalink
 * @param description
 * @param status
 * @param locale
 * @param domains
 */
export function editCommunity({
  id = 0,
  name = '',
  permalink = '',
  description = '',
  status = CommunityStatus.VISIBLE,
  locale = 'en_US',
  domains = []
}: {
  id?: number; // Post id
  name: string;
  permalink: string;
  description: string;
  status: string;
  locale: string; //The body text
  domains: any;
}): Thunk<any> {
  return async (dispatch: any /*, getState: any*/): Promise<StoreCommunityResult> => {
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
            entries: [response.storedCommunity]
          }
        })
      );
    }
    return response;
  };
}

export function loadCommunitySettings({
  id,
  permalink,
  domain
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
      return dispatch(setCurrentCommunity(r.stackendCommunity, r.objectsRequiringModeration));
    } catch (e) {
      console.error("Stackend: Couldn't loadCommunitySettings: ", e);
    }
  };
}

export function receiveResourceUsage(json: ResourceUsage): CommunityActions {
  return {
    type: RECEIVE_RESOURCE_USAGE,
    maximumUseBeforeCharge: json.maximumUseBeforeCharge,
    resourceUsageLast30Days: json.resourceUsageLast30Days,
    hasPaymentMethod: json.hasPaymentMethod,
    isUserExcludedFromBilling: json.isUserExcludedFromBilling
  };
}

/**
 * Get the number of objets requiring moderation for a given community
 * @param communityState
 * @param communityId
 * @return a number, never null
 */
export function getObjectsRequiringModeration(communityState: CommunityState, communityId: number): number {
  return communityState.objectsRequiringModeration[communityId] || 0;
}
