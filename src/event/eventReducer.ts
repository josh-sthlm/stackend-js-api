import createReducer from '../api/createReducer';
import { Event, RsvpResult, RSVPStatus, CurrentUserRsvpStatuses } from './index';
import { PaginatedCollection } from '../api/PaginatedCollection';

export const EVENT_RSVP_UPDATED = 'EVENT_RSVP_UPDATED';
export const EVENT_RSVP_RECEIVED = 'EVENT_RSVP_RECEIVED';
export const EVENTS_RECEIVED = 'EVENTS_RECEIVED';
export const RESET_EVENTS = 'RESET_EVENTS';
export const CLEAR_EVENT = 'CLEAR_EVENT';

export interface EventsReceivedAction {
  type: typeof EVENTS_RECEIVED;
  context: string;
  events: Array<Event>;
}

export interface ResetEventsAction {
  type: typeof RESET_EVENTS;
  context?: string;
}

export interface ClearEventAction {
  type: typeof CLEAR_EVENT;
  context: string;
  eventId: number;
}

export interface EventRsvpUpdatedAction {
  type: typeof EVENT_RSVP_UPDATED;
  context: string;
  result: RsvpResult;
  extraData: any;
}

export interface EventRsvpUserResponses {
  interested: PaginatedCollection<number>;
  accepted: PaginatedCollection<number>;
  declined: PaginatedCollection<number>;
}

export interface RsvpUserResponses {
  [eventId: string]: EventRsvpUserResponses;
}
export interface EventRsvpReceivedAction {
  type: typeof EVENT_RSVP_RECEIVED;
  context: string;
  currentUserRsvpStatuses?: CurrentUserRsvpStatuses;
  rsvpUserIds?: RsvpUserResponses;
  extraData: any;
}

export type RsvpUsersState = PaginatedCollection<number>;

export interface RsvpUserLists {
  /** List of interested users, if loaded */
  interested: RsvpUsersState | null;

  /** List of attending users, if loaded */
  accepted: RsvpUsersState | null;

  /** List of declining users, if loaded */
  declined: RsvpUsersState | null;
}

export function newRsvpUserLists(): RsvpUserLists {
  return {
    interested: null,
    accepted: null,
    declined: null
  };
}

export interface EventState {
  /** The event */
  event: Event | null;

  /** The current users response */
  currentUserRsvp: RSVPStatus;

  /** Rsvp responses */
  rsvpUserLists: RsvpUserLists;
}

export function newEventState(
  event?: Event | null,
  currentUserRsvp: RSVPStatus | null = RSVPStatus.UNKNOWN,
  rsvpUserLists?: RsvpUserLists | null
): EventState {
  return {
    event: event || null,
    currentUserRsvp: currentUserRsvp || RSVPStatus.UNKNOWN,
    rsvpUserLists: rsvpUserLists || newRsvpUserLists()
  };
}

export interface EventContextState {
  [eventId: number]: EventState;
}
export interface EventsState {
  [context: string]: EventContextState;
}

export const events = createReducer(
  {},
  {
    EVENTS_RECEIVED: (state: EventsState, action: EventsReceivedAction): EventsState => {
      let s: EventContextState = state[action.context];
      if (!s) {
        state[action.context] = s = {};
      }

      const events = action.events;
      events.forEach(event => {
        s[event.id] = newEventState(event);
      });

      return Object.assign({}, state);
    },

    RESET_EVENTS: (state: EventsState, action: ResetEventsAction): EventsState => {
      if (action.context) {
        delete state[action.context];
        return Object.assign({}, state);
      }
      return {};
    },

    CLEAR_EVENT: (state: EventsState, action: ClearEventAction): EventsState => {
      const s: EventContextState = state[action.context];
      if (!s) {
        return state;
      }

      if (s[action.eventId]) {
        delete s[action.eventId];
        return Object.assign({}, state);
      }

      return state;
    },

    EVENT_RSVP_UPDATED: (state: EventsState, action: EventRsvpUpdatedAction): EventsState => {
      if (!action.result.success || action.result.error) {
        return state;
      }

      const s: EventState = getOrCreateEventState(state, action.context, action.result.eventId);
      const counts = action.result.counts;
      s.currentUserRsvp = counts.status;

      if (s.event) {
        const r = s.event.rsvp;
        r.nDeclined = counts.rsvp.nDeclined;
        r.nAccepted = counts.rsvp.nAccepted;
        r.nInterested = counts.rsvp.nInterested;
      }

      // FIXME: use counts.rsvp.interested etc (backend broken. Update is delayed?)

      return Object.assign({}, state);
    },

    EVENT_RSVP_RECEIVED: (state: EventsState, action: EventRsvpReceivedAction): EventsState => {
      const { rsvpUserIds, currentUserRsvpStatuses } = action;

      if (!rsvpUserIds && !currentUserRsvpStatuses) {
        return state;
      }
      const s = getOrCreateEventContextState(state, action.context);

      if (rsvpUserIds) {
        Object.keys(rsvpUserIds).forEach((eventId: any) => {
          const es = getOrCreateEventState2(s, eventId);
          const x = rsvpUserIds[eventId];
          const event = es.event;
          if (event) {
            event.rsvp.nInterested = x.interested.totalSize;
            event.rsvp.nAccepted = x.accepted.totalSize;
            event.rsvp.nDeclined = x.declined.totalSize;
          }
          es.rsvpUserLists.interested = x.interested;
          es.rsvpUserLists.accepted = x.accepted;
          es.rsvpUserLists.declined = x.declined;
        });
      }

      if (currentUserRsvpStatuses) {
        Object.keys(currentUserRsvpStatuses).forEach((eventId: any) => {
          const es = getOrCreateEventState2(s, eventId);
          es.currentUserRsvp = currentUserRsvpStatuses[eventId];
        });
      }

      return Object.assign({}, state);
    }
  }
);

export default events;

function getOrCreateEventContextState(state: EventsState, context: string): EventContextState {
  let s: EventContextState = state[context];
  if (!s) {
    state[context] = s = {};
  }
  return s;
}

function getOrCreateEventState2(ecs: EventContextState, eventId: number): EventState {
  let e: EventState = ecs[eventId];
  if (!e) {
    ecs[eventId] = e = newEventState();
  }
  return e;
}

function getOrCreateEventState(state: EventsState, context: string, eventId: number): EventState {
  const s = getOrCreateEventContextState(state, context);
  let e: EventState = s[eventId];
  if (!e) {
    s[eventId] = e = newEventState();
  }
  return e;
}
