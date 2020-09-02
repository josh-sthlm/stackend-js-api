// @flow
import { REQUEST_MODULES, RECEIVE_MODULES, RESET_MODULES, ModuleActions } from './moduleReducer';
import { Thunk } from '../api';

import * as Stackend from './index';
import { GetModulesResult, Module, ModuleStats } from './index';

/**
 * Load communities
 *
 * @since 24 apr 2017
 *
 */

export function receiveModules(json: {
  modules: Array<Module>;
  supportedModuleContexts?: Array<{
    context: string;
    componentClass: string;
    supportsMultipleModules: boolean;
  }>;
  stats?: {[id: string]: ModuleStats};
}): ModuleActions {
    return {
      type: RECEIVE_MODULES,
      json,
      receivedAt: Date.now()
    };
}

export function requestModules(communityId: number): ModuleActions {
	return {
		type: REQUEST_MODULES
	};
}

export function resetModules(): ModuleActions {
	return {
		type: RESET_MODULES
	};
}

export function fetchModules({ communityId }: { communityId: number }): Thunk<Promise<GetModulesResult>> {
	return async (dispatch: any /*, getState: any*/): Promise<GetModulesResult> => {
		dispatch(requestModules(communityId));
		const json = await dispatch(Stackend.getModules({ communityId }));
		dispatch(receiveModules(json));
		return json;
	};
}
