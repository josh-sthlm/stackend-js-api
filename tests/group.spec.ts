//@flow

import createTestStore from './setup-redux';

import { COMMUNITY_PARAMETER } from '../src/api'
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend'
import { getGroup, GetGroupResult } from '../src/group'


describe('Groups', () => {
  let store = createTestStore();

  describe("getGroup", () => {
    it("Get a group", async () => {
      let r:GetGroupResult = await store.dispatch(getGroup({ groupId: 1 , [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK }));
      expect(r.__resultCode).toBe("success");
      expect(r.groupMembers).toBeDefined();
      expect(r.group).toBeDefined();
      expect(r.group.id).toBe(1);
    });
  });


});


