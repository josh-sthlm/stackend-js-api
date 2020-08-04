//@flow

import { type Content } from './cms.js';
import { type Action } from '../store.js';
import { getJsonErrorText } from '../api.js';

export const REQUEST_CONTENT: string = 'REQUEST_CONTENT';
export const RECIEVE_CONTENT: string = 'RECIEVE_CONTENT';
export const RECIEVE_CONTENTS: string = 'RECIEVE_CONTENTS';
export const SET_CONTENT: string = 'SET_CONTENT';

export type State = {
	/** Cms content by id */
	[id: string]: Content
};

export default function(state: State = {}, action: Action) {
	switch (action.type) {
		case RECIEVE_CONTENT:
			if (action.json.error) {
				console.error(
					'Could not get content ' +
						(action.id ? action.id : '') +
						(action.permalink ? action.permalink : '') +
						': ' +
						getJsonErrorText(action.json)
				);
				return state;
			}

			if (action.json.content) {
				return Object.assign({}, state, { [action.json.content.id + '']: action.json.content });
			}

			console.warn(
				'No such content: ' +
					(action.id ? action.id : '') +
					(action.permalink ? action.permalink : '')
			);

			return state;

		// Recieve multiple contents
		case RECIEVE_CONTENTS:
			if (!action.contents) {
				return state;
			}

			return Object.assign({}, state, action.contents);

		case SET_CONTENT:
			if (action.content) {
				return Object.assign({}, state, { [action.content.id + '']: action.content });
			}

			return state;

		default:
			return state;
	}
}
