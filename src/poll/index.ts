import { getJson, post, XcapJsonResult, Thunk, XcapOptionalParameters } from '../api';
import { VoteSummary } from '../vote';
import XcapObject from '../api/XcapObject';
import DescriptionAware from '../api/DescriptionAware';
import CreatedDateAware from '../api/CreatedDateAware';
import CreatorUserIdAware from '../api/CreatorUserIdAware';
import ModifiedDateAware from '../api/ModifiedDateAware';
import ReferenceIdAware from '../api/ReferenceIdAware';
import ReferenceAble from '../api/ReferenceAble';

/**
 * Xcap Blog poll api constants and methods.
 *
 * @since 23 mar 2017
 */

export interface Answer {
  id: number;
  answerId: number;
  order: number;
  answer: string;
  votes: number;
  votesPercent: number;
}

export interface Poll
  extends XcapObject,
    DescriptionAware,
    CreatedDateAware,
    CreatorUserIdAware,
    ModifiedDateAware,
    ReferenceIdAware<XcapObject>,
    ReferenceAble {
  __type: 'se.josh.xcap.poll.Poll';
  startDate: number;
  endDate: number;
  view: string;
  open: boolean;
  visible: boolean;
  votes: number;
  answers: Array<Answer>;
}

export interface GetPollResult extends XcapJsonResult {
  voteSummary: VoteSummary;
  poll: Poll;
  hasVoted: boolean;
  pollAnswerVote: number;
  canVote: boolean;
  votesByAnswer: { [id: string]: number };
  votesPercentByAnswer: { [id: string]: number };
  hidden: false;
}

/**
 * Get a poll and the results.
 *
 * @param referenceId {number} Reference id. Required.
 */
export function getPoll({
  referenceId
}: {
  referenceId: number;
} & XcapOptionalParameters): Thunk<Promise<GetPollResult>> {
  return getJson({ url: '/poll/get', parameters: arguments });
}

export interface VoteResult extends XcapJsonResult {
  poll: Poll;
  referenceId: number;
  answerId: number;
}

/**
 * Vote for a poll option.
 *
 * Requires an authorized user.
 *
 * @param referenceId {number} Reference id. Required.
 * @param answerId {number} The answer id. Required.
 */
export function vote({
  referenceId,
  answerId
}: {
  referenceId: number;
  answerId: number;
} & XcapOptionalParameters): Thunk<Promise<VoteResult>> {
  return post({ url: '/poll/vote', parameters: arguments });
}

/**
 * Edit/create a poll .
 *
 * Requires an authorized user.
 *
 * @param referenceId {number} Reference id. Required.
 * @param startDate Start date. (optional).
 * @param endDate End date. (optional).
 * @param description {String} Description
 * @param view {String} View (optional, default "circle")
 * @param pollAnswers {Object} The answers: Map from id to description. { 1: "Yes", 2: "No", .... }
 */
export function edit({
  referenceId,
  startDate,
  endDate,
  description,
  view,
  pollAnswers
}: {
  referenceId: number;
  startDate?: string;
  endDate?: string;
  description: string;
  view?: string;
  pollAnswers: any;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  const ans = JSON.stringify(pollAnswers);

  return post({
    url: '/poll/edit',
    parameters: {
      referenceId,
      startDate,
      endDate,
      description,
      view,
      pollAnswers: ans
    }
  });
}
