import { post, getJson, XcapJsonResult, Thunk, XcapOptionalParameters } from '../api';
import XcapObject from '../api/XcapObject';
import CreatedDateAware from '../api/CreatedDateAware';
import ModifiedDateAware from '../api/ModifiedDateAware';
import CreatorUserIdAware from '../api/CreatorUserIdAware';
import ReferenceAble from '../api/ReferenceAble';
import ModerationAware from '../api/ModerationAware';
import NameAware from '../api/NameAware';
import ReferenceIdAware from '../api/ReferenceIdAware';

export const CALENDAR_CONTEXT = 'calendar';

export const EVENT_CLASS = 'net.josh.community.eventcalendar.Event';

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

  /**
   * Additional data (title, location, startTime, endTime, link)
   */
  data: { [key: string]: string | number };
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
 * Maps from eventId to RSVPStatus for the current user
 */
export interface UserRsvpStatuses {
  [eventId: number]: RSVPStatus;
}

/**
 * A "set" of user ids
 */
export interface RsvpUserIds {
  [userId: number]: number;
}

export interface RsvpResult extends XcapJsonResult {
  success: boolean;
  eventContext: string;
  eventId: number;
  counts: {
    status: RSVPStatus;
    rsvp: {
      accepted: RsvpUserIds;
      interested: RsvpUserIds;
      declined: RsvpUserIds;
      nAccepted: number;
      nInterested: number;
      nDeclined: number;
    };
  };
}

/**
 * Respond to an event invitation
 * @param eventId
 * @param status
 */
export function rsvp({
  eventId,
  status
}: { eventId: number; status: RSVPStatus } & XcapOptionalParameters): Thunk<Promise<RsvpResult>> {
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
