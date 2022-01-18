import createTestStore from './setup';

import assert from 'assert';
import { PollsState } from '../src/poll/pollReducer';
import { clearPoll, clearPolls, DEFAULT_POLL_CONTEXT, getPollFromStore, updatePoll } from '../src/poll/pollActions';
import { Poll } from '../src/poll';

describe('Poll', () => {
  const store = createTestStore();

  describe('Actions', () => {
    it('updatePoll', () => {
      let polls: PollsState = store.getState().polls;
      assert(polls);
      const poll = mockPoll(123);
      store.dispatch(updatePoll(poll));
      polls = store.getState().polls;
      expect(polls[DEFAULT_POLL_CONTEXT][123]).toStrictEqual(poll);
      store.dispatch(updatePoll(undefined));
      store.dispatch(updatePoll(mockPoll(456)));
      polls = store.getState().polls;
      expect(polls[DEFAULT_POLL_CONTEXT][456]).toBeDefined();
      console.log(polls);
    });

    it('getPollFromStore', () => {
      const polls: PollsState = store.getState().polls;
      expect(getPollFromStore(polls, 123)).toBeDefined();
      expect(getPollFromStore(polls, 666)).toBeNull();
      expect(getPollFromStore(polls, 123, 'apa')).toBeNull();
    });

    it('clearPoll', () => {
      store.dispatch(clearPoll(123));
      const polls: PollsState = store.getState().polls;
      expect(polls[DEFAULT_POLL_CONTEXT][123]).toBeUndefined();
    });

    it('clearPolls', () => {
      store.dispatch(clearPolls());
      const polls: PollsState = store.getState().polls;
      expect(polls[DEFAULT_POLL_CONTEXT]).toBeUndefined();
    });
  });
});

let pollId = 1;

function mockPoll(referenceId: number): Poll {
  pollId++;
  const now = Date.now();
  return {
    __type: 'se.josh.xcap.poll.Poll',
    id: pollId,
    referenceId,
    referenceRef: undefined,
    startDate: now,
    modifiedDate: null,
    description: 'Poll ' + referenceId,
    obfuscatedReference: '123',
    creatorUserRef: null,
    creatorUserId: 0,
    createdDate: now,
    endDate: now + 30 * 60 * 60 * 1000,
    view: '',
    open: true,
    visible: true,
    votes: 3,
    answers: [
      {
        id: 1,
        answerId: 1,
        answer: 'Yes',
        votes: 1,
        order: 1,
        votesPercent: 33
      },
      {
        id: 2,
        answerId: 2,
        answer: 'No',
        votes: 2,
        order: 2,
        votesPercent: 67
      }
    ]
  };
}
