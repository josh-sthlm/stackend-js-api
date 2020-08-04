//@flow
import { type VoteSummary, type Vote } from './vote.js';

export const XCAP_VOTES_RECIEVED = 'XCAP_VOTES_RECIEVED';
export const XCAP_VOTES_UPDATE = 'XCAP_VOTES_UPDATE';

import update from 'immutability-helper';
import { type Comment } from '../comments/comments.js';

export type VoteInfo = {
	voteSummary: VoteSummary,
	votes: Map<number, Vote>, // referenceGroupId
	hasVoted: boolean,
	myReview?: ?Comment
};

type State = {
	[key: string]: {
		// Context
		[key: string]: VoteInfo // referenceId
	}
};

const voteReducer = (state: State = {}, action: any) => {
	let c = state;
	switch (action.type) {
		case XCAP_VOTES_RECIEVED:
			c = updateVotes({
				state,
				context: action.context,
				voteSummary: action.voteSummary,
				votes: action.votes,
				hasVoted: action.hasVoted,
				myReview: action.myReview
			});
			break;

		case XCAP_VOTES_UPDATE:
			c = updateVotes({
				state,
				context: action.context,
				voteSummary: action.voteSummary,
				vote: action.vote,
				hasVoted: action.hasVoted,
				myReview: action.myReview
			});
			console.log('XCAP_VOTES_UPDATE', state, c, 'same=', state == c);
			break;

		default:
			break;
	}
	return c;
};

export default voteReducer;

function updateVotes({
	state,
	context,
	voteSummary,
	votes,
	vote,
	hasVoted,
	myReview
}: {
	state: State,
	context: string,
	voteSummary: VoteSummary,
	votes?: Map<number, Vote>,
	vote?: Vote,
	hasVoted?: boolean,
	myReview?: ?Comment
}): State {
	let x = Object.assign({}, state);

	if (!x[context]) {
		x[context] = {};
	}

	let refId = voteSummary.referenceId;

	if (!x[context][refId]) {
		x[context][refId] = {
			voteSummary,
			votes: {},
			hasVoted: false,
			myReview: null
		};
	}

	let v = Object.assign({}, x[context][refId]);

	v.voteSummary = voteSummary;

	if (votes) {
		v = update(v, {
			votes: { $merge: votes }
		});
	}

	if (vote) {
		v.votes[vote.referenceGroupId] = vote;
	}

	if (typeof hasVoted === 'boolean') {
		v.hasVoted = hasVoted;
	}

	if (myReview) {
		if (v.myReview) {
			console.log('D=', v.myReview.modifiedDate, myReview.modifiedDate);
		}
		v.myReview = myReview;
	}

	x.n = Math.random(); // Hack to make this update

	x[context][refId] = v;

	return x;
}
