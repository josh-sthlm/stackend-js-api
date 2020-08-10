//@flow

import createTestStore from './setup-redux';
import { getCommunity, GetCommunityResult, STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend'

describe('Stackend', () => {
  let store = createTestStore();

	describe('getCommunity', () => {
		it("Should get a community", async () => {
      let r:GetCommunityResult = await store.dispatch(getCommunity({ permalink: STACKEND_COM_COMMUNITY_PERMALINK }));
      expect(r.__resultCode).toBe("success");

      let c = r.stackendCommunity;
      expect(c).toBeDefined();
      expect(c.id).toBe(55);
      expect(c.permalink).toBe(STACKEND_COM_COMMUNITY_PERMALINK);
		})
	})
});


