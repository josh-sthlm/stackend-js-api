//@flow

import createTestStore from './setup-redux';

import { COMMUNITY_PARAMETER } from '../api'
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../stackend'
import { getGroup, GetGroupResult } from '../group'
import assert from 'assert';


describe('Groups', () => {
  const store = createTestStore();

  describe("getGroup", () => {
    it("Get a group", async () => {
      const r: GetGroupResult = await store.dispatch(getGroup({ groupId: 1 , [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK }));
      expect(r.__resultCode).toBe("success");
      expect(r.groupMembers).toBeDefined();
      assert(r.group);
      expect(r.group.id).toBe(1);
    });
  });


});


