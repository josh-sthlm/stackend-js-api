import createTestStore from './setup';
import { COMMUNITY_PARAMETER } from '../src/api';
import { search, SearchAbleType, SearchResult } from '../src/search';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';

describe('Search', () => {
  const store = createTestStore();

  describe('search', () => {
    it('Search', async () => {
      const r: SearchResult = await store.dispatch(
        search({
          q: '',
          type: SearchAbleType.ARTICLE,
          pageSize: 1,
          [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );

      expect(r.__resultCode).toBe('success');
      expect(r.likes).toBeDefined();
      expect(r.results).toBeDefined();
      expect(r.results.totalSize).toBeGreaterThanOrEqual(1);
      expect(r.results.entries).toBeDefined();
    });
  });
});
