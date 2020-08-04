// @flow

//Action Type

export const REQUEST_MODULES: string = 'REQUEST_MODULES';
export const RECIEVE_MODULES: string = 'RECIEVE_MODULES';
export const RESET_MODULES: string = 'RESET_MODULES';

//Reducer
export default function moduleReducer(
	state: any = {},
	action: {
		type: string,
		receievedAt?: number,
		json?: {
			result: [any]
		}
	}
) {
	switch (action.type) {
		case REQUEST_MODULES:
			return Object.assign({}, state, {
				isFetching: true,
				didInvalidate: false
			});

		case RECIEVE_MODULES:
			return Object.assign({}, state, {
				isFetching: false,
				didInvalidate: false,
				lastUpdated: action.receievedAt,
				...action.json
			});

		case RESET_MODULES:
			return Object.assign({}, state, {
				isFetching: false,
				didInvalidate: false,
				modules: [],
				stats: {},
				communityId: 0,
				supportedModuleContexts: [],
				__relatedObjects: {}
			});

		default:
			return state;
	}
}
