import { VoteSummary } from '../src/vote';
import { receiveVotes, getVoteSummary, getVote, getVoteInfo, getVotes, updateVotes } from '../src/vote/voteActions';
import { VoteState } from '../src/vote/voteReducer';
import createTestStore from './setup';
import assert from 'assert';

describe('Vote', () => {
  const store = createTestStore();

  it('store manipulation', () => {
    store.dispatch(
      receiveVotes(
        'comments',
        {
          average: 4,
          referenceGroupId: 123,
          referenceId: 456,
          totalNrOfVotes: 3,
          totalScore: 12,
          nrOfVotesByScore: {
            3: 1,
            4: 1,
            5: 1
          }
        },
        {
          1: {
            id: 1,
            referenceGroupId: 123,
            refId: 456,
            score: 3,
            creatorIp: '',
            createdDate: 0,
            creatorUserId: 0,
            creatorUserRef: undefined
          },
          2: {
            id: 2,
            referenceGroupId: 123,
            refId: 456,
            score: 4,
            creatorIp: '',
            createdDate: 0,
            creatorUserId: 0,
            creatorUserRef: undefined
          },
          3: {
            id: 3,
            referenceGroupId: 123,
            refId: 456,
            score: 5,
            creatorIp: '',
            createdDate: 0,
            creatorUserId: 0,
            creatorUserRef: undefined
          }
        },
        false,
        null
      )
    );

    let vote: VoteState = store.getState().vote;
    expect(vote).toBeDefined();

    const vi = getVoteInfo(vote, 'comments', 456);
    assert(vi);

    expect(getVoteSummary(vote, 'comments', 123)).toBeNull();
    const vs: VoteSummary | null = getVoteSummary(vote, 'comments', 456);
    assert(vs);
    expect(vs.totalScore).toBe(12);
    expect(vs.average).toBe(4);
    expect(vs.referenceId).toBe(456);
    expect(vs.referenceGroupId).toBe(123);

    const votes = getVotes(vote, 'comments', 456);
    assert(votes);
    expect(votes[1]).toBeDefined();

    const v = getVote(vote, 'comments', 456, 2);
    assert(v);
    expect(v.id).toBe(2);
    expect(v.score).toBe(4);

    store.dispatch(
      updateVotes(
        'comments',
        {
          id: 4,
          referenceGroupId: 4,
          refId: 456,
          score: 3,
          createdDate: 0,
          creatorUserId: 0,
          creatorUserRef: undefined,
          creatorIp: ''
        },
        {
          referenceId: 456,
          referenceGroupId: 123,
          average: 3.75,
          nrOfVotesByScore: {
            3: 2,
            4: 1,
            5: 1
          },
          totalScore: 15,
          totalNrOfVotes: 4,
          referenceRef: undefined
        }
      )
    );
    vote = store.getState().vote;
    const vi2 = getVoteInfo(vote, 'comments', 456);
    console.log(vi2);

    const vs2: VoteSummary | null = getVoteSummary(vote, 'comments', 456);
    assert(vs2);
    expect(vs2.totalScore).toBe(15);
    expect(vs2.average).toBe(3.75);
    expect(vs2.referenceId).toBe(456);
    expect(vs2.referenceGroupId).toBe(123);

    const v2 = getVote(vote, 'comments', 456, 4);
    assert(v2);
    expect(v2.id).toBe(4);
    expect(v2.score).toBe(3);
  });
});
