//@flow

import { Content, GetContentResult } from './index';
import { getJsonErrorText } from '../api';

export const REQUEST_CONTENT = 'REQUEST_CONTENT';
export const RECEIVE_CONTENT = 'RECEIVE_CONTENT';
export const RECEIVE_CONTENTS = 'RECEIVE_CONTENTS';
export const SET_CONTENT = 'SET_CONTENT';

export interface CmsState {
  /** Cms content by id */
  byId: {
    [id: string]: Content;
  };

  idByPermalink: {
    [permalink: string]: number;
  };
  // For backwards compatibility, we also add
  // [id: string]: Content,
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

export interface ReceiveContentsAction {
  type: typeof RECEIVE_CONTENTS;
  contents: { [id: number]: Content };
}

export interface SetContentAction {
  type: typeof SET_CONTENT;
  content?: Content | null;
}

export type CmsActionTypes = RequestContentAction | ReceiveContentAction | ReceiveContentsAction | SetContentAction;

export default function (
  state: CmsState = {
    byId: {},
    idByPermalink: {}
  },
  action: CmsActionTypes
): CmsState {
  switch (action.type) {
    case RECEIVE_CONTENT: {
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

      const content = action.json.content;
      if (content) {
        const s = Object.assign({}, state, {
          [content.id + '']: content
        });

        s.byId[content.id] = content;
        s.idByPermalink[content.permalink] = content.id;

        return s;
      }

      console.warn('No such content: ' + (action.id ? action.id : '') + (action.permalink ? action.permalink : ''));

      return state;
    }

    // Receive multiple contents
    case RECEIVE_CONTENTS: {
      if (!action.contents) {
        return state;
      }

      const s = Object.assign({}, state);
      for (const [id, c] of Object.entries(action.contents)) {
        if (c) {
          s.byId[id] = c;
          s.idByPermalink[c.permalink] = c.id;
          (s as any)[id] = c;
        }
      }

      return s;
    }

    case SET_CONTENT:
      if (action.content) {
        const c = action.content;
        const s = Object.assign({}, state);
        s.byId[c.id] = c;
        s.idByPermalink[c.permalink] = c.id;
        (s as any)[c.id] = c;
        return s;
      }

      return state;

    default:
      return state;
  }
}
