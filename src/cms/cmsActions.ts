//@flow

import { Dispatch} from 'redux';
import { Thunk } from '../store';
import { REQUEST_CONTENT, RECIEVE_CONTENT, RECIEVE_CONTENTS, SET_CONTENT } from './cmsReducer';
import { getContent, Content } from '../cms';

/**
 * Fetch CMS content
 * @param id
 * @param permalink
 * @returns {Function}
 */
export function fetchContent({ id, permalink }: { id: number, permalink?: string }): Thunk<any> {
	return async (dispatch: Dispatch /*, getState: any*/) => {
		dispatch({
			type: REQUEST_CONTENT,
			id,
			permalink
		});

		try {
			let r = await dispatch(getContent({ id, permalink }));

			return dispatch({
				type: RECIEVE_CONTENT,
				id,
				permalink,
				json: r
			});
		} catch (e) {
			console.error("Couldn't fetch cms content " + id, e);
		}
	};
}

export function setContent(content: Content) {
	return (dispatch: Dispatch /*, getState: any*/) => {
		return dispatch({
			type: SET_CONTENT,
			content
		});
	};
}

/**
 * Recieve multiple content objects
 * @param contents
 */
export function recieveContents(contents: Map<number, Content>): Thunk<any> {
	return async (dispatch: Dispatch /*, getState: any*/) => {
		return await dispatch({
			type: RECIEVE_CONTENTS,
			contents
		});
	};
}
