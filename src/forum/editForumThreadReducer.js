// @flow
import update from 'immutability-helper';
import { Action } from '../store.js';
import createReducer from '../createReducer.js';

export type EditForumThreadActions = Edit | Set | AddQuote | ToggleEdit;
export type EditForumThreadActionTypes = $Keys<typeof actionTypes>;

export const actionTypes = {
	EDIT_FORUM_ENTRY_TEXT: 'EDIT_FORUM_ENTRY_TEXT',
	SET_FORUM_ENTRY_TEXT: 'SET_FORUM_ENTRY_TEXT',
	ADD_QUOTE: 'ADD_QUOTE',
	FORUM_THREAD_TOGGLE_EDIT: 'FORUM_THREAD_TOGGLE_EDIT'
};

export type Edit = {
	type: 'EDIT_FORUM_ENTRY_TEXT',
	text: string
};

export type Set = {
	type: 'SET_FORUM_ENTRY_TEXT',
	text: string
};

export type AddQuote = {
	type: 'ADD_QUOTE',
	quote: string
};

export type ToggleEdit = {
	type: 'FORUM_THREAD_TOGGLE_EDIT',
	forumPermalink: string,
	editThreadId: number
};

type State = {
	text: string,
	iteration: number,
	quote: string
};

const initialState = {
	text: '',
	iteration: 0,
	quote: ''
};

export default createReducer(initialState, {
	EDIT_FORUM_ENTRY_TEXT: (state: State, action: Action) =>
		update(state, {
			text: { $set: action.text },
			quote: { $set: '' }
		}),
	SET_FORUM_ENTRY_TEXT: (state: State, action: Action) =>
		update(state, {
			text: { $set: action.text },
			iteration: { $set: state.iteration + 1 },
			quote: { $set: '' }
		}),
	ADD_QUOTE: (state: State, action: Action) =>
		update(state, {
			quote: { $set: action.quote }
		}),
	FORUM_THREAD_TOGGLE_EDIT: (state: State, action: Action) =>
		update(state, {
			editForumPermalink: { $set: action.forumPermalink },
			editThreadId: { $set: action.editThreadId }
		})
});
