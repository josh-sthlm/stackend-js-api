import createTestStore from './setup';
import { COMMUNITY_PARAMETER } from '../src/api';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { GetUserResult } from '../src/user';
import assert from 'assert';
import { clearUser, fetchUser } from '../src/user/userActions';

describe('User', () => {
  const store = createTestStore();

  describe('Actions', () => {
    it('fetchUser', async () => {
      const r: GetUserResult = await store.dispatch(
        fetchUser({
          id: 1,
          [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );

      expect(r.__resultCode).toBe('success');
      assert(r.user);
      expect(r.user.id).toBe(1);

      const users = store.getState().users;
      console.log(users);
      expect(users[1]).toBeDefined();
    });

    it('clearUser', () => {
      store.dispatch(clearUser(1));
      const users = store.getState().users;
      expect(users[1]).toBeUndefined();
    });
  });
});
