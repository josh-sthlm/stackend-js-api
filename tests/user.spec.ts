//@flow

import createTestStore from './setup';
import { COMMUNITY_PARAMETER } from '../src/api';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { getUser, GetUserResult, hasElevatedPrivilege } from '../src/user';
import assert from 'assert';
import { PrivilegeTypeId } from '../src/user/privileges';

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

  describe('hasElevatedPrivilege', () => {
    it('Checks for elevated privileges', async () => {
      const u = {
        privileges: ['cms,se.josh.xcap.cms.CmsManager,32', 'news,net.josh.community.blog.BlogManager,16']
      };

      expect(
        hasElevatedPrivilege(u as any, 'cms', 'se.josh.xcap.cms.CmsManager', PrivilegeTypeId.TRUSTED)
      ).toBeTruthy();
      expect(hasElevatedPrivilege(u as any, 'cms', 'se.josh.xcap.cms.CmsManager', PrivilegeTypeId.ADMIN)).toBeTruthy();
      expect(
        hasElevatedPrivilege(u as any, 'cms', 'se.josh.xcap.cms.CmsManager', PrivilegeTypeId.SUPER_ADMIN)
      ).toBeFalsy();

      expect(hasElevatedPrivilege(u as any, 'korv', 'se.josh.xcap.cms.CmsManager', PrivilegeTypeId.ADMIN)).toBeFalsy();
      expect(hasElevatedPrivilege(u as any, 'cms', 'korv', PrivilegeTypeId.ADMIN)).toBeFalsy();

      expect(hasElevatedPrivilege(u as any, 'cms', 'korv', 3)).toBeFalsy();
    });
  });
});
