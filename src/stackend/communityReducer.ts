// @flow
import update from 'immutability-helper';
import { Community } from '../stackend';
import { isRunningInBrowser } from '../api';
import { AnyAction } from 'redux';
import { PaginatedCollection } from '../PaginatedCollection';

export const KEY = 'COMMUNITIES';

export const REQUEST_COMMUNITIES = 'REQUEST_COMMUNITIES';
export const RECIEVE_COMMUNITIES = 'RECIEVE_COMMUNITIES';
export const UPDATE_COMMUNITY = 'UPDATE_COMMUNITY';
export const SET_COMMUNITY_SETTINGS = 'SET_COMMUNITY_SETTINGS';
export const REMOVE_COMMUNITIES = 'REMOVE_COMMUNITIES';
export const REMOVE_COMMUNITY = 'REMOVE_COMMUNITY';
export const RECEIVE_RESOURCE_USAGE = 'RECEIVE_RESOURCE_USAGE';

declare let window: any;

export interface CommunityState {
  community?:
    | (Community & {
        objectsRequiringModeration?: number;
      })
    | null;
  communities?: PaginatedCollection<Community>;
  resourceUsage?: {
    maximumUseBeforeCharge: any | null;
    resourceUsageLast30Days: any | null;
    hasPaymentMethod: boolean;
    isUserExcludedFromBilling: boolean;
  };
  isFetching?: boolean;
  didInvalidate?: boolean;
  lastUpdated?: number;
}

//Reducer
export default function communityReducer(state: CommunityState = {}, action: AnyAction): CommunityState {
  switch (action.type) {
    case REQUEST_COMMUNITIES:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });

    case RECIEVE_COMMUNITIES:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        lastUpdated: action.receievedAt,
        communities: action.json.results,
        statistics: action.json.statistics,
      });

    case UPDATE_COMMUNITY: {
      const u = action.community;

      if (state.communities) {
        const entries = state.communities.entries;
        let found = false;
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i];
          if (e.id === u.id) {
            found = true;
            e.name = u.name;
            e.description = u.description;
            e.status = u.status;
            e.domains = u.domains;
            break;
          }
        }

        if (!found) {
          entries.push(action.community);
        }

        const newCommunities = Object.assign({}, state.communities);

        return update(state, {
          isFetching: { $set: false },
          didInvalidate: { $set: false },
          lastUpdated: { $set: action.receievedAt },
          communities: { $set: newCommunities },
        });
      }

      return state;
    }

    case SET_COMMUNITY_SETTINGS: {
      if (action.community) {
        // FIXME: Use of window still needed for xcap.js and old javascripts
        if (isRunningInBrowser()) {
          window.xcapCommunityName = action.community.name;
          window.xcapCommunityPermalink = action.community.permalink;
        }
      }

      const x = {
        objectsRequiringModeration: action.objectsRequiringModeration,
        ...action.community,
      };

      return update(state, {
        community: { $set: x },
      });
    }

    case REMOVE_COMMUNITIES:
      //window.xcapCommunityName = '';
      //window.xcapCommunityPermalink = '';
      return {};

    case REMOVE_COMMUNITY:
      return update(state, {
        community: { $set: null },
      });

    case RECEIVE_RESOURCE_USAGE:
      return update(state, {
        resourceUsage: {
          $set: {
            maximumUseBeforeCharge: action.maximumUseBeforeCharge,
            resourceUsageLast30Days: action.resourceUsageLast30Days,
            hasPaymentMethod: action.hasPaymentMethod,
            isUserExcludedFromBilling: action.isUserExcludedFromBilling,
          },
        },
      });

    default:
      return state;
  }
}
