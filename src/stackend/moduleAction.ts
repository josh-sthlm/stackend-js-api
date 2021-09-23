// @flow
import {
  REQUEST_MODULES,
  RECEIVE_MODULES,
  RESET_MODULES,
  ReceiveModulesAction,
  RequestModulesAction,
  ResetModulesAction,
  ModuleState,
  ReceiveModulesData
} from './moduleReducer';
import { Thunk } from '../api';

import * as Stackend from './index';
import { GetModulesResult, Module } from './index';

export function receiveModules(data: ReceiveModulesData): ReceiveModulesAction {
  return {
    type: RECEIVE_MODULES,
    data,
    receivedAt: Date.now()
  };
}

export function requestModules(communityId: number): RequestModulesAction {
  return {
    type: REQUEST_MODULES
  };
}

export function resetModules(): ResetModulesAction {
  return {
    type: RESET_MODULES
  };
}

/**
 * Load modules
 *
 * @since 24 apr 2017
 *
 */
export function fetchModules({ communityId }: { communityId: number }): Thunk<Promise<GetModulesResult>> {
  return async (dispatch: any /*, getState: any*/): Promise<GetModulesResult> => {
    dispatch(requestModules(communityId));
    const json: GetModulesResult = await dispatch(Stackend.getModules({ communityId }));

    if (!json.error) {
      const modules: { [id: string]: Module } = {};
      json.modules.forEach(m => {
        modules[String(m.id)] = m;
      });

      dispatch(
        receiveModules({
          modules,
          stats: json.stats,
          supportedModuleContexts: json.supportedModuleContexts
        })
      );
    }

    return json;
  };
}

/**
 * Get the modules as an array
 * @param moduleState
 */
export function getModules(moduleState: ModuleState): Array<Module> {
  return filterModules(moduleState);
}

/**
 * Get the modules as an array
 * @param moduleState
 * @param filter Optional filter method
 */
export function filterModules(moduleState: ModuleState, filter?: (m: Module) => boolean): Array<Module> {
  const modules: Array<Module> = [];
  moduleState.moduleIds.forEach(id => {
    const m = moduleState.modulesById[id];
    if (m && (!filter || filter(m))) {
      modules.push(m);
    }
  });

  return modules;
}

/**
 * Find the first module matching the expression
 * @param moduleState
 * @param find
 * @returns {null|*}
 */
export function findModule(moduleState: ModuleState, find: (m: Module) => boolean): Module | null {
  for (const id of moduleState.moduleIds) {
    const m = moduleState.modulesById[id];
    if (m && find(m)) {
      return m;
    }
  }
  return null;
}
