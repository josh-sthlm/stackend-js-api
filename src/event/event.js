//@flow
import { post, getJson } from '../api.ts';
import { type Thunk } from '../store.ts';

/**
 * Xcap Event api constants and methods.
 * @author jens
 * @since 3 mar 2017
 */

/**
 * Event definition
 */
export type Event = {
	id: number,
	calendarId: number,
	calendarRef: EventCalendar,
	createdDate: number,
	modifiedDate: number,
	locationId: number,
	creatorUserId: number,
	creatorUserRef: any,
	categoryId: number,
	categoryRef: any,
	startDate: number,
	endDate: number,
	obfuscatedReference: string,
	copyOf: number,
	eventDescriptionId: number,
	multipleDays: boolean,
	modStatus: string,
	ttl: number,
	data: any
};

export type EventCalendar = {
	id: number,
	name: string,
	referenceId: number,
	obfuscatedReference: string,
	createdDate: number,
	modifiedDate: number,
	modStatus: string,
	ttl: number
};

export const RSVPStatus = {
	UNKNOWN: 'UNKNOWN',
	ACCEPTED: 'ACCEPTED',
	INTERESTED: 'INTERESTED',
	DECLINED: 'DECLINED'
};

export type RSVPStatusId = $Values<RSVPStatus>;

/**
 * Respond to an event invitation
 * @param eventId
 * @param status
 */
export function rsvp({ eventId, status }: { eventId: number, status: RSVPStatusId }): Thunk<*> {
	return post({ url: '/blog/event/rsvp', parameters: arguments });
}

/**
 * List user attending an event.
 *
 * @param eventId {number}
 * @param status {RSVPStatus}
 * @param p {number} Page
 * @param pageSize {number} Page size (defaults to 10)
 * @returns {Promise}
 */
export function listRsvpUsers({
	eventId,
	status,
	p,
	pageSize
}: {
	eventId: number,
	status: RSVPStatusId,
	p?: number,
	pageSize?: number
}): Thunk<*> {
	return getJson({ url: '/blog/event/list-rsvp-users', parameters: arguments });
}
