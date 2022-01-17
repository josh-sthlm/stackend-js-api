import createTestStore from './setup';
import { eventsReceived, getEventFromStore, getRsvpUserLists, rsvpReceived } from '../src/event/eventActions';
import { CALENDAR_CONTEXT, Event, EVENT_CLASS, EventCalendar, RSVPStatus } from '../src/event';
import ModerationStatus from '../src/api/ModerationStatus';
import { emptyPaginatedCollection, newPaginatedCollection } from '../src/api/PaginatedCollection';

function mockEvent(id: number): Event {
  const now = new Date().getTime();
  return {
    __type: EVENT_CLASS,
    id,
    obfuscatedReference: 'abc123',
    calendarId: 1,
    calendarRef: { id: 1 } as EventCalendar,
    categoryId: 0,
    categoryRef: null,
    copyOf: 0,
    startDate: now,
    endDate: now + 60 * 60 * 1000,
    creatorUserId: 0,
    createdDate: now,
    eventDescriptionId: 0,
    locationId: 0,
    creatorUserRef: undefined,
    modifiedDate: now,
    multipleDays: false,
    ttl: 0,
    modStatus: ModerationStatus.PASSED,
    data: {
      location: 'Stockholm',
      link: 'https://stackend.com',
      title: 'Ice Skating'
    },
    rsvp: {
      nInterested: 0,
      nDeclined: 0,
      nAccepted: 0
    }
  };
}

describe('Event actions', () => {
  const store = createTestStore();

  describe('eventReceived', () => {
    it('Updates event state', async () => {
      let events = store.getState().events;
      expect(events).toBeDefined();

      const event1 = mockEvent(1);
      await store.dispatch(
        eventsReceived({
          events: [event1],
          relatedObjects: {
            '123': { __type: 'korv', id: 1 },
            '456': mockEvent(2)
          },
          currentUserRsvpStatuses: {
            1: RSVPStatus.INTERESTED,
            5: RSVPStatus.ACCEPTED /* no such event, but should not crash */
          },
          rsvpUserIds: {
            1: {
              interested: newPaginatedCollection({ entries: [1], totalSize: 1 }),
              accepted: emptyPaginatedCollection(),
              declined: emptyPaginatedCollection()
            },
            6: {
              /* no such event, but should not crash */
              interested: newPaginatedCollection({ entries: [1], totalSize: 1 }),
              accepted: emptyPaginatedCollection(),
              declined: emptyPaginatedCollection()
            }
          }
        })
      );

      events = store.getState().events;
      //console.log(events[CALENDAR_CONTEXT]);
      console.log(events[CALENDAR_CONTEXT][1]);
      expect(events[CALENDAR_CONTEXT]).toBeDefined();
      expect(events[CALENDAR_CONTEXT][1]).toBeDefined();
      expect(events[CALENDAR_CONTEXT][1].event).toBeDefined();
      expect(events[CALENDAR_CONTEXT][1].event.rsvp).toStrictEqual({
        nAccepted: 0,
        nDeclined: 0,
        nInterested: 1
      });
      expect(events[CALENDAR_CONTEXT][1].currentUserRsvp).toBe(RSVPStatus.INTERESTED);
      expect(events[CALENDAR_CONTEXT][1].rsvpUserLists).toBeDefined();
      expect(events[CALENDAR_CONTEXT][1].event.rsvp.nInterested).toBe(1);
      expect(events[CALENDAR_CONTEXT][1].event.rsvp.nAccepted).toBe(0);
      expect(events[CALENDAR_CONTEXT][1].event.rsvp.nDeclined).toBe(0);
      expect(events[CALENDAR_CONTEXT][2]).toBeDefined();

      expect(getEventFromStore(events, 1)).toBeDefined();
      expect(getEventFromStore(events, 666)).toBeNull();
      expect(getRsvpUserLists(events, 1)).toBeDefined();
      expect(getRsvpUserLists(events, 666)).toBeNull();

      await store.dispatch(
        rsvpReceived({
          currentUserRsvpStatuses: {
            1: RSVPStatus.ACCEPTED,
            7: RSVPStatus.ACCEPTED /* no such event, but should not crash */
          },
          rsvpUserIds: {
            1: {
              interested: emptyPaginatedCollection(),
              accepted: newPaginatedCollection({ entries: [1], totalSize: 1 }),
              declined: emptyPaginatedCollection()
            }
          }
        })
      );

      expect(events[CALENDAR_CONTEXT][1].currentUserRsvp).toBe(RSVPStatus.ACCEPTED);
      expect(events[CALENDAR_CONTEXT][1].event.rsvp.nInterested).toBe(0);
      expect(events[CALENDAR_CONTEXT][1].event.rsvp.nAccepted).toBe(1);
      expect(events[CALENDAR_CONTEXT][1].event.rsvp.nDeclined).toBe(0);
    });
  });
});
