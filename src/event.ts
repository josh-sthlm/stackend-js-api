//@flow
import { post, getJson, XcapObject, XcapJsonResult } from './api';
import { Thunk } from './store';

/**
 * Xcap Event api constants and methods.
 * @author jens
 * @since 3 mar 2017
 */

/**
 * Event definition
 */
export interface Event extends XcapObject {
	__type: 'net.josh.community.eventcalendar.Event',
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
}

export interface EventCalendar extends XcapObject {
	__type: 'net.josh.community.eventcalendar.EventCalendar',
	name: string,
	referenceId: number,
	obfuscatedReference: string,
	createdDate: number,
	modifiedDate: number,
	modStatus: string,
	ttl: number
}

export enum RSVPStatus {
	UNKNOWN = 'UNKNOWN',
	ACCEPTED = 'ACCEPTED',
	INTERESTED = 'INTERESTED',
	DECLINED = 'DECLINED'
}

/**
 * Respond to an event invitation
 * @param eventId
 * @param status
 */
export function rsvp({ eventId, status }: { eventId: number, status: RSVPStatus }): Thunk<XcapJsonResult> {
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
	status: RSVPStatus,
	p?: number,
	pageSize?: number
}): Thunk<XcapJsonResult> {
	return getJson({ url: '/blog/event/list-rsvp-users', parameters: arguments });
}
