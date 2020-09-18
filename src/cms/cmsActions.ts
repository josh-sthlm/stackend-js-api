//@flow

import { Thunk } from '../api';
import { REQUEST_CONTENT, RECEIVE_CONTENT, RECEIVE_CONTENTS, SET_CONTENT, CmsState } from './cmsReducer';
import { getContent, Content } from './index';

/**
 * Fetch CMS content
 * @param id
 * @param permalink
 * @returns {Function}
 */
export function fetchContent({ id, permalink }: { id?: number; permalink?: string }): Thunk<Promise<any>> {
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
export function receiveContents(contents: { [id: number]: Content }): Thunk<any> {
  return async (dispatch: any): Promise<any> => {
    return await dispatch({
      type: RECEIVE_CONTENTS,
      contents
    });
  };
}

/**
 * Get cms content by id from the state
 * @param state
 * @param id
 */
export function getContentById(state: CmsState, id: number): Content | null {
  return state.byId[id];
}

/**
 * Get cms content by permalink from the state
 * @param state
 * @param permalink
 */
export function getContentByPermalink(state: CmsState, permalink: string): Content | null {
  const id = state.idByPermalink[permalink];
  return id ? state.byId[id] : null;
}
