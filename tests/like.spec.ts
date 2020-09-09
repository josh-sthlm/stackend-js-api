//@flow

import createTestStore from './setup';

import { COMMUNITY_PARAMETER } from '../src/api';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { GetLikeToplistResult, getToplist } from '../src/like';

describe('Like', () => {
  const store = createTestStore();

  describe('getToplist', () => {
    it('Get a like toplist', async () => {
      const r: GetLikeToplistResult = await store.dispatch(
        getToplist({
          interval: '1year',
          objectContext: 'comments',
          [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK,
        })
      );

      expect(r.__resultCode).toBe('success');
      expect(r.likes).toBeDefined();
      expect(r.toplist).toBeDefined();
      expect(r.toplist.totalSize).toBeGreaterThanOrEqual(1);
      expect(r.toplist.entries).toBeDefined();
    });
  });
});
