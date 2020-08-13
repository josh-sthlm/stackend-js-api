// @flow
import update from 'immutability-helper';
import createReducer from '../createReducer';
import { Action } from 'redux'

export type EditForumThreadActions = Edit | Set | AddQuote | ToggleEdit;

export const actionTypes = {
	EDIT_FORUM_ENTRY_TEXT: 'EDIT_FORUM_ENTRY_TEXT',
	SET_FORUM_ENTRY_TEXT: 'SET_FORUM_ENTRY_TEXT',
	ADD_QUOTE: 'ADD_QUOTE',
	FORUM_THREAD_TOGGLE_EDIT: 'FORUM_THREAD_TOGGLE_EDIT'
};

export type Edit = Action & {
	type: 'EDIT_FORUM_ENTRY_TEXT',
	text: string
};

export type Set = Action & {
	type: 'SET_FORUM_ENTRY_TEXT',
	text: string
};

export type AddQuote = Action & {
	type: 'ADD_QUOTE',
	quote: string
};

export type ToggleEdit = Action & {
	type: 'FORUM_THREAD_TOGGLE_EDIT',
	forumPermalink: string,
	editThreadId: number
};

type State = {
	text: string,
	iteration: number,
	quote: string,
	editForumPermalink: string|undefined,
	editThreadId: number
};

const initialState = {
	text: '',
	iteration: 0,
	quote: '',
	editThreadId: 0,
};

export default createReducer(initialState, {
	EDIT_FORUM_ENTRY_TEXT: (state: State, action: Edit) =>
		update(state, {
			text: { $set: action.text },
			quote: { $set: '' }
		}),
	SET_FORUM_ENTRY_TEXT: (state: State, action: Set) =>
		update(state, {
			text: { $set: action.text },
			iteration: { $set: state.iteration + 1 },
			quote: { $set: '' }
		}),
	ADD_QUOTE: (state: State, action: AddQuote) =>
		update(state, {
			quote: { $set: action.quote }
		}),
	FORUM_THREAD_TOGGLE_EDIT: (state: State, action: ToggleEdit) =>
		update(state, {
			editForumPermalink: { $set: action.forumPermalink },
			editThreadId: { $set: action.editThreadId }
		})
});
