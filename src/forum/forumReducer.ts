// @flow
import update from 'immutability-helper';
import { Action } from 'redux';
import _ from 'lodash';
import createReducer from '../createReducer';
import * as forumApi from './forum';

export type ForumActions = Request | Recieve | Invalidate;

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

interface State {
	isFetching: boolean,
	didInvalidate: boolean,
	lastUpdated: number, //Date
	entries: Array<forumApi.Forum>
}

const initialState:State = {
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
			.map(_.spread(_.merge))
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
