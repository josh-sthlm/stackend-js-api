// @flow
import _ from 'lodash';
import update from 'immutability-helper';
import { Action } from 'redux';
import createReducer from '../createReducer';
import * as forumApi from './forum';

export type ForumThreadActions = Request | Recieve | Invalidate | Rate | Like | DeleteEntry;

export const actionTypes = {
	RECIEVE_FORUM_THREADS: 'RECIEVE_FORUM_THREADS',
	REQUEST_FORUM_THREADS: 'REQUEST_FORUM_THREADS',
	INVALIDATE_FORUM_THREADS: 'INVALIDATE_FORUM_THREADS',
	RECIEVE_VOTE_FORUM_THREAD: 'RECIEVE_VOTE_FORUM_THREAD',
	RECIEVE_LIKE_FORUM_THREAD: 'RECIEVE_LIKE_FORUM_THREAD',
	UPDATE_FORUM_THREAD_ENTRY: 'UPDATE_FORUM_THREAD_ENTRY',
	DELETE_FORUM_THREAD: 'DELETE_FORUM_THREAD'
};

export type Request = {
	type: 'REQUEST_FORUM_THREADS'
};
export type Recieve = {
	type: 'RECIEVE_FORUM_THREADS',
	entries: Array<forumApi.ForumThreadEntry>,
	forumPermalink: string
};
export type Update = {
	type: 'UPDATE_FORUM_THREAD_ENTRY',
	entry: forumApi.ForumThreadEntry,
	forumPermalink: string
};
export type Invalidate = {
	type: 'INVALIDATE_FORUM_THREADS'
};
export type Rate = {
	type: 'RECIEVE_VOTE_FORUM_THREAD',
	voteJson: forumApi.VoteReturn,
	forumPermalink: string
};
export type Like = {
	type: 'RECIEVE_LIKE_FORUM_THREAD',
	recievedLikes: any,
	forumPermalink: string
};
export type DeleteEntry = {
	type: 'DELETE_FORUM_THREAD',
	entry: forumApi.ForumThreadEntry
};

interface State {
	isFetching: boolean,
	didInvalidate: boolean,
	lastUpdated: number, //Date
	forums: {
		[forumPermalink: string]: Array<forumApi.ForumThreadEntry>
	}
}

const initialState:State = {
	isFetching: false,
	didInvalidate: false,
	lastUpdated: 0,
	forums: {}
};

export default createReducer(initialState, {
	REQUEST_FORUM_THREADS: (state: State, action: Action) =>
		update(state, {
			isFetching: { $set: true },
			didInvalidate: { $set: false }
		}),

	RECIEVE_FORUM_THREADS: (state: State, action: Action) => {
		const uniqueForumThreads = _(action.entries)
			.concat(_.get(state, `forums[${action.forumPermalink}]`, []))
			.groupBy('id')
			.map(_.spread(_.merge))
			.value()
			.sort((a, b) => a.sticky < b.sticky);

		return update(state, {
			isFetching: { $set: false },
			didInvalidate: { $set: false },
			lastUpdated: { $set: Date.now() },
			forums: {
				[action.forumPermalink]: {
					$apply: forumPermalink => update(forumPermalink || [], { $set: uniqueForumThreads })
				}
			}
		});
	},

	UPDATE_FORUM_THREAD_ENTRY: (state: State, action: Action) => {
		let indexOfUpdatedEntry = state.forums[action.forumPermalink]
			.map(entry => entry.id)
			.indexOf(action.entry.id);

		if (indexOfUpdatedEntry === -1) {
			// Addition
			indexOfUpdatedEntry = state.forums[action.forumPermalink].length;
		}

		return update(state, {
			isFetching: { $set: false },
			didInvalidate: { $set: false },
			lastUpdated: { $set: Date.now() },
			forums: {
				[action.forumPermalink]: {
					[indexOfUpdatedEntry]: { $set: action.entry }
				}
			}
		});
	},
	INVALIDATE_FORUM_THREADS: (state: State, action: Action) =>
		update(state, {
			didInvalidate: { $set: true }
		}),
	RECIEVE_VOTE_FORUM_THREAD: (state: State, action: Action) => {
		const forumThreadKey = state.forums[action.forumPermalink].findIndex(
			thread => thread.id === action.voteJson.referenceId
		);
		return update(state, {
			forums: {
				[action.forumPermalink]: {
					[forumThreadKey]: {
						voteByCurrentUser: { $set: action.voteJson.score },
						voteSummary: { $set: action.voteJson.voteSummary }
					}
				}
			}
		});
	},
	RECIEVE_LIKE_FORUM_THREAD: (state: State, action: Action) => {
		const forumThreadKey = state.forums[action.forumPermalink].findIndex(
			thread => thread.id === action.referenceId
		);
		return update(state, {
			forums: {
				[action.forumPermalink]: {
					[forumThreadKey]: {
						numberOfLikes: { $set: action.receivedLikes.numberOfLikes },
						likedByCurrentUser: {
							$apply: context =>
								update(context || {}, {
									likes: { $set: action.receivedLikes.numberOfLikes },
									likedByCurrentUser: {
										$set: !action.receivedLikes.remove
									}
								})
						}
					}
				}
			}
		});
	},
	DELETE_FORUM_THREAD: (state: State, action: Action) => {
		const forumThreadEntryKey = state.forums[action.entry.forumRef.permalink].findIndex(
			thread => thread.id === action.entry.id
		);
		return update(state, {
			forums: {
				[action.entry.forumRef.permalink]: {
					[forumThreadEntryKey]: { $set: action.entry }
				}
			}
		});
	}
});
