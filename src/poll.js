//@flow

/**
 * Xcap poll api constants and methods.
 * @author jens
 * @since 3 apr 2017
 */

/**
 * Defintion of a poll
 */
export type Poll = {
	id: number,
	description: string,
	creatorUserId: number,
	creatorUserRef: any,
	createdDate: number,
	modifiedDate: number,
	startDate: number,
	endDate: number,
	referenceId: number,
	referenceRef: number,
	obfuscatedReference: string,
	view: string,
	open: boolean,
	visible: boolean,
	votes: number,
	answers: [PollAnswer]
};

/**
 * Defintion of a poll answer
 */
export type PollAnswer = {
	id: number,
	answerId: number,
	order: number,
	answer: string,
	votes: number,
	votesPercent: number
};
