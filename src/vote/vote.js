//@flow

import { post, type XcapJsonResult } from '../xcap/api.js';
import type { Thunk } from '../types/store.js';
import { CommentModule } from '../comments/comments.js';

/** VoteSummary is used for like and dislike in forum*/
export type VoteSummary = {
	/** Average score */
	average: number,

	/** Vote value and the number of votes on that value 2 for like, 1 for dislike */
	nrOfVotesByScore: {
		[key: number]: number
	},

	/** typically forumId */
	referenceGroupId: number,

	/** typically forumThreadEntryId */
	referenceId: number,

	totalNrOfVotes: number,

	totalScore: number
};

export type Vote = {
	id: number,
	score: number,
	refId: number,
	referenceGroupId: number,
	creatorUserId: number,
	creatorIp: string,
	createdDate: number
};

export type VoteResult = XcapJsonResult & {
	maxScore: number,
	minScore: number,
	minimumRequiredVotes: number,
	hasVoted: boolean,
	mayVote: boolean,
	hasEnoughVotes: boolean,
	average: number,
	averageAsInt: number,
	voteSummary: ?VoteSummary,
	vote: ?Vote
};

/**
 * Cast a vote.
 */
export function vote({
	referenceId,
	referenceGroupId,
	score,
	module
}: {
	referenceId: number,
	referenceGroupId: number,
	score: number,
	module: string
}): Thunk<VoteResult> {
	return post({
		url: (module && module !== CommentModule.GENERIC ? module : '') + '/comments/vote/vote',
		parameters: arguments
	});
}
