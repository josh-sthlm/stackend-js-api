// @flow
import update from 'immutability-helper';
import { type Action } from '../store.ts';
import _ from 'lodash/object';
import { spread } from 'lodash/function';
import createReducer from '../createReducer.ts';
import * as forumApi from './forum.js';

export type ForumActions = Request | Recieve | Invalidate;
export type ForumActionTypes = $Keys<typeof actionTypes>;

export const actionTypes = {
	RECIEVE_FORUMS: 'RECIEVE_FORUMS',
	REQUEST_FORUMS: 'REQUEST_FORUMS',
	INVALIDATE_FORUMS: 'INVALIDATE_FORUMS'
};

export type Request = {
	type: 'REQUEST_FORUMS'
};
export type Recieve = {
	type: 'RECIEVE_FORUMS',
	entries: Array<forumApi.Forum>
};
export type Invalidate = {
	type: 'INVALIDATE_FORUMS'
};

type State = {
	isFetching: boolean,
	didInvalidate: boolean,
	lastUpdated: number, //Date
	entries: Array<forumApi.Forum>
};
const initialState = {
	isFetching: false,
	didInvalidate: false,
	lastUpdated: 0,
	entries: []
};

export default createReducer(initialState, {
	REQUEST_FORUMS: (state: State, action: Action) =>
		update(state, {
			isFetching: { $set: true },
			didInvalidate: { $set: false }
		}),
	RECIEVE_FORUMS: (state: State, action: Action) => {
		const uniqueForums = _(action.entries)
			.concat(_.get(state, `entries`, []))
			.groupBy('id')
			.map(spread(_.merge))
			.value();

		return update(state, {
			isFetching: { $set: false },
			didInvalidate: { $set: false },
			lastUpdated: { $set: Date.now() },
			entries: { $set: uniqueForums }
		});
	},
	INVALIDATE_FORUMS: (state: State, action: Action) =>
		update(state, {
			didInvalidate: { $set: true }
		})
});
