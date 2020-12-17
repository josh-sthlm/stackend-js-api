// @flow

//Action Type

import { Module, ModuleStats, SupportedModuleContext } from './index';

export const REQUEST_MODULES = 'REQUEST_MODULES';
export const RECEIVE_MODULES = 'RECEIVE_MODULES';
export const RESET_MODULES = 'RESET_MODULES';

export type ReceiveModulesData = {
  modules: { [id: string]: Module };
  supportedModuleContexts?: Array<SupportedModuleContext>;
  stats?: { [id: string]: ModuleStats };
};

export type RequestModulesAction = {
  type: typeof REQUEST_MODULES;
};

export type ReceiveModulesAction = {
  type: typeof RECEIVE_MODULES;
  receivedAt: number;
  data: ReceiveModulesData;
};

export type ResetModulesAction = {
  type: typeof RESET_MODULES;
};

export type ModuleActions = RequestModulesAction | ReceiveModulesAction | ResetModulesAction;

export interface ModuleState {
  isFetching?: boolean;
  didInvalidate?: boolean;
  lastUpdated?: number;
  /**
   * Modules by id
   */
  modulesById: { [id: string]: Module };

  /**
   * Module listing
   */
  moduleIds: Array<number>;

  stats?: { [id: string]: ModuleStats };

  communityId?: number;

  supportedModuleContexts?: Array<SupportedModuleContext>;
}

//Reducer
export default function moduleReducer(
  state: ModuleState = {
    moduleIds: [],
    modulesById: {}
  },
  action: ModuleActions
): ModuleState {
  switch (action.type) {
    case REQUEST_MODULES:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      });

    case RECEIVE_MODULES: {
      const moduleIds: Array<string> = [];
      for (const key of Object.keys(action.data.modules)) {
        moduleIds.push(key);
      }

      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        lastUpdated: action.receivedAt,
        modulesById: action.data.modules,
        moduleIds,
        stats: action.data.stats || state.supportedModuleContexts,
        supportedModuleContexts: action.data.supportedModuleContexts || state.supportedModuleContexts
      });
    }

    case RESET_MODULES:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        modulesById: {},
        moduleIds: [],
        stats: undefined,
        communityId: 0,
        supportedModuleContexts: undefined,
        __relatedObjects: {}
      });

    default:
      return state;
  }
}
