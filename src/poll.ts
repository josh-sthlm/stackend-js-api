//@flow
import { getJson, post, XcapJsonResult, XcapObject, Thunk, XcapOptionalParameters } from './api';
import { VoteSummary } from './vote';

/**
 * Xcap Blog poll api constants and methods.
 * @author jens
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

export interface Poll extends XcapObject {
  __type: 'se.josh.xcap.poll.Poll';
  description: string;
  creatorUserId: number;
  creatorUserRef: any;
  createdDate: number;
  modifiedDate: number;
  startDate: number;
  endDate: number;
  referenceId: number;
  referenceRef: number;
  obfuscatedReference: string;
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
  votesByAnswer: {[id: string]: number};
  votesPercentByAnswer: {[id: string]: number};
  hidden: false;
}

/**
 * Get a poll and the results.
 *
 * @param referenceId {number} Reference id. Required.
 */
export function getPoll({
  referenceId,
}: {
  referenceId: number;
} & XcapOptionalParameters): Thunk<Promise<GetPollResult>> {
  return getJson({ url: '/poll/get', parameters: arguments });
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
  answerId,
}: {
  referenceId: number;
  answerId: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
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
  pollAnswers,
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
      pollAnswers: ans,
    },
  });
}
