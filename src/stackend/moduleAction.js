// @flow
import { REQUEST_MODULES, RECIEVE_MODULES, RESET_MODULES } from './moduleReducer.js';
import { type Thunk } from '../types/store.js';

import * as Stackend from './stackend.js';

/**
 * Load communities
 *
 * @since 24 apr 2017
 * @author jens
 */

export function recieveModules(json: string): any {
	return {
		type: RECIEVE_MODULES,
		json,
		receievedAt: Date.now()
	};
}

export function requestModules(communityId: number): any {
	return {
		type: REQUEST_MODULES
	};
}

export function resetModules(): any {
	return {
		type: RESET_MODULES
	};
}

export function fetchModules({ communityId }: { communityId: number }): Thunk<*> {
	return async (dispatch: any /*, getState: any*/) => {
		dispatch(requestModules(communityId));
		let json = await dispatch(Stackend.getModules({ communityId }));
		dispatch(recieveModules(json));
		return json;
	};
}
