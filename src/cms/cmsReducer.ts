//@flow

import { Content, GetContentResult } from './index';
import { getJsonErrorText } from '../api';

export const REQUEST_CONTENT = 'REQUEST_CONTENT';
export const RECEIVE_CONTENT = 'RECEIVE_CONTENT';
export const RECEIVE_CONTENTS = 'RECEIVE_CONTENTS';
export const SET_CONTENT = 'SET_CONTENT';

export interface CmsState {
  /** Cms content by id */
  [id: string]: Content;
}

export interface RequestContentAction {
  type: typeof REQUEST_CONTENT;
}

export interface ReceiveContentAction {
  type: typeof RECEIVE_CONTENT;
  id?: number | null;
  permalink?: string | null;
  json: GetContentResult;
}

export interface ReciveContentsAction {
  type: typeof RECEIVE_CONTENTS;
  contents: { [id: number]: Content };
}

export interface SetContentAction {
  type: typeof SET_CONTENT;
  content?: Content | null;
}

export type CmsActionTypes = RequestContentAction | ReceiveContentAction | ReciveContentsAction | SetContentAction;

export default function (state: CmsState = {}, action: CmsActionTypes): CmsState {
  switch (action.type) {
    case RECEIVE_CONTENT:
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

      console.warn('No such content: ' + (action.id ? action.id : '') + (action.permalink ? action.permalink : ''));

      return state;

    // Recieve multiple contents
    case RECEIVE_CONTENTS:
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
