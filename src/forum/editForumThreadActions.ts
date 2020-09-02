// @flow
import {
  ADD_QUOTE,
  EDIT_FORUM_ENTRY_TEXT,
  EditForumThreadActions,
  FORUM_THREAD_TOGGLE_EDIT,
  SET_FORUM_ENTRY_TEXT,
} from './editForumThreadReducer';
import { Thunk } from '../api';

export function editForumEntyText({ text }: { text: string }): EditForumThreadActions {
  return {
    type: EDIT_FORUM_ENTRY_TEXT,
    text,
  };
}

export function setForumEntyText({ text }: { text: string }): EditForumThreadActions {
  return {
    type: SET_FORUM_ENTRY_TEXT,
    text,
  };
}

export function addForumEntryQuote({ quote }: { quote: string }): EditForumThreadActions {
  return {
    type: ADD_QUOTE,
    quote,
  };
}

export type ToggleEditForumThread = {
  forumPermalink?: string;
  editThreadId?: number;
  text: string;
};

export function toggleEditForumThread({ forumPermalink, editThreadId, text }: ToggleEditForumThread): Thunk<void> {
  return (dispatch: any /*, getState: any*/): void => {
    dispatch({
      type: FORUM_THREAD_TOGGLE_EDIT,
      forumPermalink,
      editThreadId,
    });
    dispatch(setForumEntyText({ text }));
  };
}
