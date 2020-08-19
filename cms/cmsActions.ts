//@flow

import { Thunk } from '../api';
import { REQUEST_CONTENT, RECEIVE_CONTENT, RECEIVE_CONTENTS, SET_CONTENT } from './cmsReducer';
import { getContent, Content } from '../cms';

/**
 * Fetch CMS content
 * @param id
 * @param permalink
 * @returns {Function}
 */
export function fetchContent({ id, permalink }: { id: number; permalink?: string }): Thunk<any> {
	return async (dispatch: any): Promise<any> => {
		dispatch({
			type: REQUEST_CONTENT,
			id,
			permalink
		});

		try {
			const r = await dispatch(getContent({ id, permalink }));

			return dispatch({
				type: RECEIVE_CONTENT,
				id,
				permalink,
				json: r
			});
		} catch (e) {
			console.error("Couldn't fetch cms content " + id, e);
		}
	};
}

export function setContent(content: Content): Thunk<any> {
	return (dispatch /*, getState: any*/): any => {
		return dispatch({
			type: SET_CONTENT,
			content
		});
	};
}

/**
 * Receive multiple content objects
 * @param contents
 */
export function receiveContents(contents: {[id: number]: Content}): Thunk<any> {
	return async (dispatch: any): Promise<any> => {
		return await dispatch({
			type: RECEIVE_CONTENTS,
			contents
		});
	};
}
