//@flow

import {
  post,
  XcapJsonResult,
  Thunk,
  XcapOptionalParameters,
  CreatedDateAware,
  CreatorUserIdAware,
  ReferenceGroupIdAware,
  ReferenceIdAware,
  XcapObject
} from '../api';
import { CommentModule } from '../comments';

/** VoteSummary is used for like and dislike in forum*/
export interface VoteSummary extends ReferenceIdAware<XcapObject>, ReferenceGroupIdAware {
  /** Average score */
  average: number;

  /** Vote value and the number of votes on that value 2 for like, 1 for dislike */
  nrOfVotesByScore: {
    [key: number]: number;
  };

  totalNrOfVotes: number;

  totalScore: number;
}

export interface Vote extends CreatedDateAware, CreatorUserIdAware, ReferenceGroupIdAware {
  id: number;
  score: number;
  refId: number;
  creatorIp: string;
}

export interface VoteResult extends XcapJsonResult {
  maxScore: number;
  minScore: number;
  minimumRequiredVotes: number;
  hasVoted: boolean;
  mayVote: boolean;
  hasEnoughVotes: boolean;
  average: number;
  averageAsInt: number;
  voteSummary: VoteSummary | null;
  vote: Vote | null;
}

/**
 * Cast a vote.
 */
export function vote({
  referenceId,
  referenceGroupId,
  score,
  module
}: {
  referenceId: number;
  referenceGroupId: number;
  score: number;
  module: string;
} & XcapOptionalParameters): Thunk<Promise<VoteResult>> {
  return post({
    url: (module && module !== CommentModule.GENERIC ? module : '') + '/comments/vote/vote',
    parameters: arguments
  });
}
