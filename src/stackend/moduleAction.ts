// @flow
import { REQUEST_MODULES, RECIEVE_MODULES, RESET_MODULES } from './moduleReducer';
import { Thunk } from '../api';

import * as Stackend from '../stackend';
import { GetModulesResult, Module, ModuleStats } from '../stackend';
import { AnyAction } from 'redux';

/**
 * Load communities
 *
 * @since 24 apr 2017
 * @author jens
 */

export function recieveModules(json: {
  modules: Array<Module>;
  supportedModuleContexts?: Array<{
    context: string;
    componentClass: string;
    supportsMultipleModules: boolean;
  }>;
  stats?: Map<string, ModuleStats>;
}): AnyAction {
    return {
      type: RECIEVE_MODULES,
      json,
      receievedAt: Date.now()
    };
}

export function requestModules(communityId: number): AnyAction {
	return {
		type: REQUEST_MODULES
	};
}

export function resetModules(): AnyAction {
	return {
		type: RESET_MODULES
	};
}

export function fetchModules({ communityId }: { communityId: number }): Thunk<GetModulesResult> {
	return async (dispatch: any /*, getState: any*/): Promise<GetModulesResult> => {
		dispatch(requestModules(communityId));
		const json = await dispatch(Stackend.getModules({ communityId }));
		dispatch(recieveModules(json));
		return json;
	};
}
