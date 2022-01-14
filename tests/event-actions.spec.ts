import createTestStore from './setup';
import { eventsReceived, getEventFromStore } from '../src/event/eventActions';
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
    }
  };
}

describe('Event actions', () => {
  const store = createTestStore();

  describe('eventReceived', () => {
    it('Updates event state', async () => {
      let events = store.getState().events;
      expect(events).toBeDefined();

      await store.dispatch(
        eventsReceived({
          events: [mockEvent(1)],
          relatedObjects: {
            '123': { __type: 'korv', id: 1 },
            '456': mockEvent(2)
          },
          userRsvpStatuses: {
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
      console.log(events[CALENDAR_CONTEXT]);
      console.log(events[CALENDAR_CONTEXT][1]);
      expect(events[CALENDAR_CONTEXT]).toBeDefined();
      expect(events[CALENDAR_CONTEXT][1]).toBeDefined();
      expect(events[CALENDAR_CONTEXT][1].event).toBeDefined();
      expect(events[CALENDAR_CONTEXT][1].rsvp).toBeDefined();
      expect(events[CALENDAR_CONTEXT][2]).toBeDefined();

      expect(getEventFromStore(events, 1)).toBeDefined();
      expect(getEventFromStore(events, 666)).toBeNull();
    });
  });
});
