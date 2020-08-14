//@flow

import { XCAP_VOTES_RECIEVED, XCAP_VOTES_UPDATE } from './voteReducer';
import { Vote, VoteSummary } from '../vote';
import { VoteInfo } from './voteReducer';
import { Comment } from '../comments';
import { AnyAction } from 'redux';

export function recieveVotes(
	context: string,
	voteSummary: VoteSummary,
	votes: Map<number, Vote>,
	hasVoted?: boolean,
	myReview?: Comment | null
): AnyAction {
	return {
		type: XCAP_VOTES_RECIEVED,
		context,
		voteSummary,
		votes,
		hasVoted,
		myReview
	};
}

export function updateVotes(
	context: string,
	vote: Vote,
	voteSummary: VoteSummary,
	hasVoted?: boolean,
	myReview?: Comment | null
): AnyAction {
	return {
		type: XCAP_VOTES_UPDATE,
		context,
		vote,
		voteSummary,
		hasVoted,
		myReview
	};
}




export function getVoteInfo(state: any, context: string, referenceId: number): VoteInfo | null {
	if (!state || !referenceId || !context) {
		return null;
	}

	const x = state[context];
	if (!x) {
		return null;
	}

	const y = x[referenceId];
	if (!y) {
		return null;
	}
	return y;
}

export function getVote(
  state: any,
  context: string,
  referenceId: number,
  referenceGroupId: number
): Vote | null {
  const vi = getVoteInfo(state, context, referenceId);
  if (!vi) {
    return null;
  }

  const v = vi.votes[referenceGroupId];
  return v ? v : null;
}

export function getVoteSummary(state: any, context: string, referenceId: number): VoteSummary | null {
  const vi = getVoteInfo(state, context, referenceId);
  return vi ? vi.voteSummary : null;
}

export function getVotes(state: any, context: string, referenceId: number): { [referenceGroupId: number]: Vote } | null {
  const vi = getVoteInfo(state, context, referenceId);
  return vi ? vi.votes : null;
}
