import createTestStore from './setup';

import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { fetchBlogEntries } from '../src/blog/groupBlogEntriesActions';
import { initialize } from '../src/api/actions';

describe('Blog', () => {
  const store = createTestStore();

  describe('Actions', () => {
    it('List entries', async () => {
      await store.dispatch(
        initialize({
          permalink: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );

      const likes1 = store.getState().likes;

      await store.dispatch(fetchBlogEntries({ blogKey: 'groups/news' }));
      const { groupBlogEntries, likes } = store.getState();
      expect(groupBlogEntries).toBeDefined();
      expect(groupBlogEntries['groups/news']).toBeDefined();
      expect(groupBlogEntries['groups/news'].json).toBeDefined();
      expect(groupBlogEntries['groups/news'].json.resultPaginated).toBeDefined();
      expect(groupBlogEntries['groups/news'].json.resultPaginated.totalSize).toBeGreaterThan(1);
      expect(groupBlogEntries['groups/news'].json.resultPaginated.entries).toBeDefined();

      // FIXME: Check likes
      console.log(likes);
      expect(Object.keys(likes).length).toBeGreaterThan(Object.keys(likes1).length);
    });
  });

  /* FIXME: Broken reducer
  it('Get entry ', async () => {
    const r: GetBlogEntryResult | null = await store.dispatch(fetchBlogEntry({ id: 52, blogKey: 'groups/news' }));
    assert(r);
    expect(r.blogEntry).toBeDefined();
  });
   */
});
