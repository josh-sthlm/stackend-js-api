//@flow

import createTestStore from './setup-redux';
import { COMMUNITY_PARAMETER } from '../src/api'
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend'
import { getUser, GetUserResult } from '../src/user'


describe('User', () => {
  let store = createTestStore();

  describe("getUser", () => {
    it("Get a user", async () => {
      let r: GetUserResult = await store.dispatch(getUser({
        id: 1,
        [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
      }));

      expect(r.__resultCode).toBe("success");
      expect(r.user).toBeDefined();
      expect(r.user.id).toBe(1);
    })
  });

});


