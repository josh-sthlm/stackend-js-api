// @flow

//Action Type

import { Module, ModuleStats } from '../stackend';

export const REQUEST_MODULES = 'REQUEST_MODULES';
export const RECEIVE_MODULES = 'RECEIVE_MODULES';
export const RESET_MODULES = 'RESET_MODULES';

export type ModuleActions = {
  type: typeof REQUEST_MODULES;
} | {
  type: typeof RECEIVE_MODULES;
  receivedAt: number;
  json: any;
} | {
  type: typeof RESET_MODULES;
}

export interface ModuleState {
  isFetching?: boolean;
  didInvalidate?: boolean;
  lastUpdated?: number;
  modules?: Array<Module>;
  stats?: {[id: string]: ModuleStats};
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
  action: ModuleActions
): ModuleState {
  switch (action.type) {
    case REQUEST_MODULES:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });

    case RECEIVE_MODULES:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        lastUpdated: action.receivedAt,
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
