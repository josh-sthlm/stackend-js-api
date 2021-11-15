import { post, getJson, XcapJsonResult, Thunk, XcapOptionalParameters } from '../api';
import XcapObject from '../api/XcapObject';
import CreatedDateAware from '../api/CreatedDateAware';
import ModifiedDateAware from '../api/ModifiedDateAware';
import CreatorUserIdAware from '../api/CreatorUserIdAware';
import ReferenceAble from '../api/ReferenceAble';
import ModerationAware from '../api/ModerationAware';
import NameAware from '../api/NameAware';
import ReferenceIdAware from '../api/ReferenceIdAware';

/**
 * Xcap Event api constants and methods.
 *
 * @since 3 mar 2017
 */

/**
 * Event definition
 */
export interface Event
  extends XcapObject,
    CreatedDateAware,
    ModifiedDateAware,
    CreatorUserIdAware,
    ReferenceAble,
    ModerationAware {
  __type: 'net.josh.community.eventcalendar.Event';
  calendarId: number;
  calendarRef: EventCalendar;
  locationId: number;
  categoryId: number;
  categoryRef: any;
  startDate: number;
  endDate: number;
  copyOf: number;
  eventDescriptionId: number;
  multipleDays: boolean;
  data: any;
}

/**
 * An event calendar
 */
export interface EventCalendar
  extends XcapObject,
    NameAware,
    ReferenceIdAware<XcapObject>,
    ReferenceAble,
    CreatedDateAware,
    ModifiedDateAware,
    ModerationAware {
  __type: 'net.josh.community.eventcalendar.EventCalendar';
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
export function rsvp({
  eventId,
  status
}: { eventId: number; status: RSVPStatus } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
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
  eventId: number;
  status: RSVPStatus;
  p?: number;
  pageSize?: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({ url: '/blog/event/list-rsvp-users', parameters: arguments });
}
