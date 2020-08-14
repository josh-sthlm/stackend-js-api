// @flow

//Action Type

import { Module, ModuleStats } from '../stackend';

export const REQUEST_MODULES = 'REQUEST_MODULES';
export const RECIEVE_MODULES = 'RECIEVE_MODULES';
export const RESET_MODULES = 'RESET_MODULES';

export interface ModuleState {
  isFetching?: boolean;
  didInvalidate?: boolean;
  lastUpdated?: number;
  modules?: Array<Module>;
  stats?: Map<string, ModuleStats>;
  communityId?: number;
  supportedModuleContexts?: Array<{
    context: string;
    componentClass: string;
    supportsMultipleModules: boolean;
  }>;
}
//Reducer
export default function moduleReducer(
  state: ModuleState = {},
  action: {
    type: string;
    receievedAt?: number;
    json?: {
      result: [any];
    };
  }
): ModuleState {
  switch (action.type) {
    case REQUEST_MODULES:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });

    case RECIEVE_MODULES:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        lastUpdated: action.receievedAt,
        ...action.json,
      });

    case RESET_MODULES:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        modules: [],
        stats: {},
        communityId: 0,
        supportedModuleContexts: [],
        __relatedObjects: {},
      });

    default:
      return state;
  }
}
