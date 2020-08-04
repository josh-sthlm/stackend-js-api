// @flow
import update from 'immutability-helper';
import * as blogApi from './blog.js';

export const REQUEST_BLOGS = 'REQUEST_BLOGS';
export const RECIEVE_BLOGS = 'RECIEVE_BLOGS';
export const INVALIDATE_BLOGS = 'INVALIDATE_BLOGS';

export type State = {
	isFetching: boolean,
	didInvalidate: boolean,
	lastUpdated: Date,
	entries: { [number]: blogApi.Blog } //entries is an object with blogId: blog
};

const initialState = {
	isFetching: false,
	didInvalidate: false,
	entries: {},
	lastUpdated: Date.now()
};

export type Action =
	| { type: 'REQUEST_BLOGS' }
	| { type: 'RECIEVE_BLOGS', entries: Array<blogApi.Blog> }
	| { type: 'INVALIDATE_BLOGS' };

export default function blogs(state: State = initialState, action: Action) {
	switch (action.type) {
		case REQUEST_BLOGS:
			return update(state, {
				isFetching: { $set: true },
				didInvalidate: { $set: false }
			});
		case RECIEVE_BLOGS:
			let newBlogs = {};
			[].concat(action.entries).map(group => (newBlogs[group.id] = group));

			return update(state, {
				isFetching: { $set: false },
				didInvalidate: { $set: false },
				lastUpdated: { $set: Date.now() },
				entries: { $merge: newBlogs }
			});
		case INVALIDATE_BLOGS:
			return update(state, {
				didInvalidate: { $set: true }
			});
		default:
			return state;
	}
}
