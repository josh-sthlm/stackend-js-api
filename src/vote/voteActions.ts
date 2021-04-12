import { VoteActions, VoteState, XCAP_VOTES_RECEIVED, XCAP_VOTES_UPDATE } from './voteReducer';
import { Vote, VoteSummary } from './index';
import { VoteInfo } from './voteReducer';
import { Comment } from '../comments';

/**
 * Add votes to the redux store
 * @param context
 * @param voteSummary
 * @param votes
 * @param hasVoted
 * @param myReview
 */
export function receiveVotes(
  context: string,
  voteSummary: VoteSummary,
  votes: { [id: number]: Vote },
  hasVoted?: boolean,
  myReview?: Comment | null
): VoteActions {
  return {
    type: XCAP_VOTES_RECEIVED,
    context,
    voteSummary,
    votes,
    hasVoted,
    myReview
  };
}

/**
 * Update votes in the redux store
 * @param context
 * @param vote
 * @param voteSummary
 * @param hasVoted
 * @param myReview
 */
export function updateVotes(
  context: string,
  vote: Vote,
  voteSummary: VoteSummary,
  hasVoted?: boolean,
  myReview?: Comment | null
): VoteActions {
  return {
    type: XCAP_VOTES_UPDATE,
    context,
    vote,
    voteSummary,
    hasVoted,
    myReview
  };
}

/**
 * Get vote info for an object
 * @param state
 * @param context
 * @param referenceId
 */
export function getVoteInfo(state: VoteState, context: string, referenceId: number): VoteInfo | null {
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

/**
 * Get vote for an object
 * @param state
 * @param context
 * @param referenceId
 * @param referenceGroupId
 */
export function getVote(state: VoteState, context: string, referenceId: number, referenceGroupId: number): Vote | null {
  const vi = getVoteInfo(state, context, referenceId);
  if (!vi) {
    return null;
  }

  const v = vi.votes[referenceGroupId];
  return v ? v : null;
}

/**
 * Get vote summary for an object
 * @param state
 * @param context
 * @param referenceId
 */
export function getVoteSummary(state: VoteState, context: string, referenceId: number): VoteSummary | null {
  const vi = getVoteInfo(state, context, referenceId);
  return vi ? vi.voteSummary : null;
}

/**
 * Get votes for an object
 * @param state
 * @param context
 * @param referenceId
 */
export function getVotes(
  state: VoteState,
  context: string,
  referenceId: number
): { [referenceGroupId: number]: Vote } | null {
  const vi = getVoteInfo(state, context, referenceId);
  return vi ? vi.votes : null;
}
