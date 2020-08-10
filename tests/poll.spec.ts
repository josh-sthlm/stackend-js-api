//@flow

import createTestStore from './setup-redux';
import { COMMUNITY_PARAMETER } from '../src/api'
import { getPoll, GetPollResult } from '../src/poll'


describe('Poll', () => {
  let store = createTestStore();

  describe("getPoll", () => {
    it("Gets a poll object", async () => {
      let r: GetPollResult = await store.dispatch(getPoll({
        referenceId: 39,
        [COMMUNITY_PARAMETER]: 'husdjur'
      }));

      // FIXME: Should be: expect(r.__resultCode).toBe("success");
      expect(r.__resultCode).toBe("input");
      expect(r.poll).toBeDefined();
      expect(r.poll).toBeDefined();
      expect(r.poll.id).toBe(39);
      expect(r.poll.answers).toBeDefined();
      expect(r.canVote).toBeDefined();
      expect(r.hasVoted).toBeDefined();
      expect(r.voteSummary).toBeDefined();
    })
  });


});


