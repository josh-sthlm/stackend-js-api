//@flow

import createTestStore from './setup';
import {
  getCommunity,
  GetCommunityResult,
  getReferenceUrl,
  isCommunityUrlBlocked,
  STACKEND_COM_COMMUNITY_PERMALINK,
} from '../src/stackend';
import assert from 'assert';

describe('Stackend', () => {
  const store = createTestStore();

  describe('getCommunity', () => {
    it('Should get a community', async () => {
      const r: GetCommunityResult = await store.dispatch(getCommunity({ permalink: STACKEND_COM_COMMUNITY_PERMALINK }));
      expect(r.__resultCode).toBe('success');

      const c = r.stackendCommunity;
      assert(c);
      expect(c.id).toBe(55);
      expect(c.permalink).toBe(STACKEND_COM_COMMUNITY_PERMALINK);
    });
  });

  describe('isCommunityUrlBlocked', () => {
    it('Check if a community permalink is allowed or not', () => {
      expect(isCommunityUrlBlocked('facebook')).toBeTruthy();
      expect(isCommunityUrlBlocked('google')).toBeTruthy();
      expect(isCommunityUrlBlocked('user')).toBeTruthy();
      expect(isCommunityUrlBlocked('register')).toBeTruthy();
      expect(isCommunityUrlBlocked('create')).toBeTruthy();
      expect(isCommunityUrlBlocked('stacks')).toBeTruthy();
      expect(isCommunityUrlBlocked('my-settings')).toBeTruthy();
    });
  });

  describe('getReferenceUrl', () => {
    it('Get the domain (excluding www) and path of an url', () => {
      expect(getReferenceUrl('')).toBe(''); // FIXME: Improve this case
      expect(getReferenceUrl('http://www.stackend.com/test')).toBe('stackend.com/test');
      expect(getReferenceUrl('https://stackend.com/test')).toBe('stackend.com/test');
    });
  });
});
