//@flow
import { VoteSummary, Vote } from './index';
import update from 'immutability-helper';
import { Comment } from '../comments';

export const XCAP_VOTES_RECEIVED = 'XCAP_VOTES_RECEIVED';
export const XCAP_VOTES_UPDATE = 'XCAP_VOTES_UPDATE';

type VoteActionBase = {
  context: string;
  hasVoted?: boolean;
  myReview?: Comment | null;
  voteSummary: VoteSummary;
};
export type VoteActions =
  | (VoteActionBase & {
      type: typeof XCAP_VOTES_RECEIVED;
      votes: { [referenceGroupId: number]: Vote };
    })
  | (VoteActionBase & {
      type: typeof XCAP_VOTES_UPDATE;
      vote: Vote;
    });

export interface VoteInfo {
  voteSummary: VoteSummary;
  votes: { [referenceGroupId: number]: Vote };
  hasVoted: boolean;
  myReview?: Comment | null;
}

export interface VoteState {
  [key: string]: {
    // Context
    [referenceId: string]: VoteInfo;
  };
}

function updateVotes({
  state,
  context,
  voteSummary,
  votes,
  vote,
  hasVoted,
  myReview
}: {
  state: VoteState;
  context: string;
  voteSummary: VoteSummary;
  votes?: { [referenceGroupId: number]: Vote };
  vote?: Vote;
  hasVoted?: boolean;
  myReview?: Comment | null;
}): VoteState {
  const x: VoteState = Object.assign({}, state);

  if (!x[context]) {
    x[context] = {};
  }

  const refId = voteSummary.referenceId;

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

  (x as any).n = Math.random(); // Hack to make this update

  x[context][refId] = v;

  return x;
}

const voteReducer = (state: VoteState = {}, action: VoteActions): VoteState => {
  let c = state;
  switch (action.type) {
    case XCAP_VOTES_RECEIVED:
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
      //console.log('XCAP_VOTES_UPDATE', state, c, 'same=', state === c);
      break;

    default:
      break;
  }
  return c;
};

export default voteReducer;
