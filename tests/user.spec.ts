//@flow

import createTestStore from './setup';
import { COMMUNITY_PARAMETER } from '../src/api';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { getUser, GetUserResult } from '../src/user';
import assert from 'assert';

describe('User', () => {
  const store = createTestStore();

  describe('getUser', () => {
    it('Get a user', async () => {
      const r: GetUserResult = await store.dispatch(
        getUser({
          id: 1,
          [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );

      expect(r.__resultCode).toBe('success');
      assert(r.user);
      expect(r.user.id).toBe(1);
    });
  });
});
