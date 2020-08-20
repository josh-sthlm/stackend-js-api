// @flow
import update from 'immutability-helper';
import createReducer from '../api/createReducer';

export type EditForumThreadActions = Edit | Set | AddQuote | ToggleEdit;

export const EDIT_FORUM_ENTRY_TEXT = 'EDIT_FORUM_ENTRY_TEXT';
export const SET_FORUM_ENTRY_TEXT = 'SET_FORUM_ENTRY_TEXT';
export const ADD_QUOTE = 'ADD_QUOTE';
export const FORUM_THREAD_TOGGLE_EDIT = 'FORUM_THREAD_TOGGLE_EDIT';

export type Edit = {
  type: typeof EDIT_FORUM_ENTRY_TEXT;
  text: string;
};

export type Set = {
  type: typeof SET_FORUM_ENTRY_TEXT;
  text: string;
};

export type AddQuote =  {
  type: typeof ADD_QUOTE;
  quote: string;
};

export type ToggleEdit =  {
  type: typeof FORUM_THREAD_TOGGLE_EDIT;
  forumPermalink: string;
  editThreadId: number;
};

export type EditForumThreadState = {
  text: string;
  iteration: number;
  quote: string;
  editForumPermalink: string | undefined;
  editThreadId: number;
};

const initialState = {
  text: '',
  iteration: 0,
  quote: '',
  editThreadId: 0,
};

export default createReducer(initialState, {
  EDIT_FORUM_ENTRY_TEXT: (state: EditForumThreadState, action: Edit) =>
    update(state, {
      text: { $set: action.text },
      quote: { $set: '' },
    }),

  SET_FORUM_ENTRY_TEXT: (state: EditForumThreadState, action: Set) =>
    update(state, {
      text: { $set: action.text },
      iteration: { $set: state.iteration + 1 },
      quote: { $set: '' },
    }),

  ADD_QUOTE: (state: EditForumThreadState, action: AddQuote) =>
    update(state, {
      quote: { $set: action.quote },
    }),

  FORUM_THREAD_TOGGLE_EDIT: (state: EditForumThreadState, action: ToggleEdit) =>
    update(state, {
      editForumPermalink: { $set: action.forumPermalink },
      editThreadId: { $set: action.editThreadId },
    }),
});
