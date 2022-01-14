import {
  CALENDAR_CONTEXT,
  Event,
  EVENT_CLASS,
  rsvp as postRsvp,
  RsvpResult,
  RSVPStatus,
  UserRsvpStatuses
} from './index';
import { Thunk } from '../api';
import {
  CLEAR_EVENT,
  EVENT_RSVP_RECEIVED,
  EVENT_RSVP_UPDATED,
  EVENTS_RECEIVED,
  EventsState,
  EventState,
  RESET_EVENTS,
  RsvpUserResponses
} from './eventReducer';
import XcapObject from '../api/XcapObject';

/**
 * Get event state from the store
 * @param events
 * @param eventId
 * @param context
 */
export function getEventState(
  events: EventsState,
  eventId: number,
  context: string = CALENDAR_CONTEXT
): EventState | null {
  const s = events[context];
  if (!s) {
    return null;
  }

  const e = s[eventId];
  return e || null;
}

/**
 * Get an event from the store
 * @param events
 * @param eventId
 * @param context
 */
export function getEventFromStore(
  events: EventsState,
  eventId: number,
  context: string = CALENDAR_CONTEXT
): Event | null {
  const s = getEventState(events, eventId, context);
  return s ? s.event : null;
}

/**
 * Add or update an event
 * @param event
 * @param context
 */
export function eventReceived({ event, context = CALENDAR_CONTEXT }: { event: Event; context?: string }): Thunk<void> {
  return (dispatch: any): void => {
    dispatch({
      type: EVENTS_RECEIVED,
      context,
      events: [event]
    });
  };
}

/**
 * Remove all events, or events of a given context
 * @param context
 */
export function resetEvents(context?: string): Thunk<void> {
  return (dispatch: any): void => {
    dispatch({
      type: RESET_EVENTS,
      context
    });
  };
}

/**
 * Clear/remove and event from the store
 * @param context
 * @param eventId
 */
export function clearEvent({
  context = CALENDAR_CONTEXT,
  eventId
}: {
  context?: string;
  eventId: number;
}): Thunk<void> {
  return (dispatch: any): void => {
    dispatch({
      type: CLEAR_EVENT,
      context,
      eventId
    });
  };
}

/**
 * Respond to an event, dispatch the EVENT_RSVP_UPDATED action on success.
 * @param context
 * @param eventId
 * @param status
 * @param extraData data passed to the reducer
 */
export function rsvp({
  context = CALENDAR_CONTEXT,
  eventId,
  status,
  extraData
}: {
  context?: string;
  eventId: number;
  status: RSVPStatus;
  extraData?: any;
}): Thunk<Promise<RsvpResult>> {
  return async (dispatch: any): Promise<RsvpResult> => {
    const result: RsvpResult = await dispatch(postRsvp({ eventId, status }));

    if (result.success) {
      dispatch({
        type: EVENT_RSVP_UPDATED,
        context,
        result,
        extraData
      });
    }
    return result;
  };
}

/**
 * Add rsvp data to store
 * @param userRsvpStatuses
 * @param rsvpUserIds
 * @param context
 * @param extraData
 */
export function rsvpReceived({
  userRsvpStatuses,
  rsvpUserIds,
  context = CALENDAR_CONTEXT,
  extraData
}: {
  userRsvpStatuses?: UserRsvpStatuses;
  context?: string;
  rsvpUserIds: RsvpUserResponses;
  extraData?: any;
}): Thunk<Promise<void>> {
  return async (dispatch: any): Promise<void> => {
    dispatch({
      type: EVENT_RSVP_RECEIVED,
      context,
      userRsvpStatuses,
      rsvpUserIds,
      extraData
    });
  };
}

/**
 * Add events and rsvp data to store
 * @param events
 * @param relatedObjects
 * @param userRsvpStatuses
 * @param rsvpUserIds
 * @param context
 * @param extraData
 */
export function eventsReceived({
  events,
  relatedObjects,
  userRsvpStatuses,
  rsvpUserIds,
  context = CALENDAR_CONTEXT,
  extraData
}: {
  events?: Array<Event>;
  relatedObjects?: { [ref: string]: XcapObject };
  userRsvpStatuses?: UserRsvpStatuses;
  rsvpUserIds?: RsvpUserResponses;
  context?: string;
  extraData?: any;
}): Thunk<Promise<void>> {
  return async (dispatch: any): Promise<void> => {
    const addEvents: Array<Event> = events ? events : [];

    if (relatedObjects) {
      Object.keys(relatedObjects).forEach((ref: any) => {
        const o = relatedObjects[ref];
        if (o.__type === EVENT_CLASS) {
          addEvents.push(o as Event);
        }
      });
    }

    if (addEvents.length) {
      dispatch({
        type: EVENTS_RECEIVED,
        context,
        events: addEvents
      });
    }

    dispatch({
      type: EVENT_RSVP_RECEIVED,
      context,
      userRsvpStatuses,
      rsvpUserIds,
      extraData
    });
  };
}
