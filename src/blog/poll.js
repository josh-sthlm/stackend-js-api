//@flow
import { getJson, post, type XcapJsonResult } from '../api.js';
import type { Thunk } from '../store.js';
import type { VoteSummary } from '../vote/vote.js';

/**
 * Xcap Blog poll api constants and methods.
 * @author jens
 * @since 23 mar 2017
 */

export type Answer = {
	answer: string,
	answerId: number,
	id: number,
	order: number,
	votes: number,
	votesPercent: number
};

export type Poll = {
	referenceId: number,
	answers: Array<Answer>,
	description: string,
	view: string,
	startDate: number,
	endDate: number,
	votes: number
};

export type GetPollResult = XcapJsonResult & {
	voteSummary: VoteSummary,
	poll: Poll,
	hasVoted: boolean,
	pollAnswerVote: number,
	canVote: boolean,
	votesByAnswer: Map<string, number>,
	votesPercentByAnswer: Map<string, number>,
	hidden: false
};

/**
 * Get a poll and the results.
 *
 * @param referenceId {number} Reference id. Required.
 */
export function getPoll({ referenceId }: { referenceId: number }): Thunk<GetPollResult> {
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
	answerId
}: {
	referenceId: number,
	answerId: number
}): Thunk<*> {
	return post({ url: '/poll/vote', parameters: arguments });
}

/**
 * Edit/create a poll .
 *
 * Requires an authorized user.
 *
 * @param referenceId {number} Reference id. Required.
 * @parm startDate Start date. (optional).
 * @parm endDate End date. (optional).
 * @param description {String} Description
 * @param view {String} View (optional, default "circle")
 * @param pollAnswers {Object} The answers: Map from id to description. { 1: "Yes", 2: "No", .... }
 * @return {Promise}
 */
export function edit({
	referenceId,
	startDate,
	endDate,
	description,
	view,
	pollAnswers
}: {
	referenceId: number,
	startDate?: string,
	endDate?: string,
	description: string,
	view?: string,
	pollAnswers: any
}): Thunk<*> {
	let ans = JSON.stringify(pollAnswers);

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
