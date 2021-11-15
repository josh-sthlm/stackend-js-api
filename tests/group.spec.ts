import createTestStore from './setup';

import { COMMUNITY_PARAMETER } from '../src/api';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { getGroup, GetGroupResult } from '../src/group';
import assert from 'assert';

describe('Groups', () => {
  const store = createTestStore();

  describe('getGroup', () => {
    it('Get a group', async () => {
      const r: GetGroupResult = await store.dispatch(
        getGroup({ groupId: 1, [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK })
      );
      expect(r.__resultCode).toBe('success');
      expect(r.groupMembers).toBeDefined();
      assert(r.group);
      expect(r.group.id).toBe(1);
    });
  });
});
