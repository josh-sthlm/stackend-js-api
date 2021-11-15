import createTestStore from './setup';
import { GetBlogEntryResult, getEntries, GetEntriesResult, getEntry, newBlogEntry } from '../src/blog';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { COMMUNITY_PARAMETER } from '../src/api';
import assert from 'assert';

describe('Blog', () => {
  const store = createTestStore();
  const state = store.getState();
  expect(state.blogs).toBeDefined();

  describe('getEntries', () => {
    it('List entries', async () => {
      const r: GetEntriesResult = await store.dispatch(
        getEntries({ blogId: 1, [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK })
      );
      expect(r.__resultCode).toBe('success');
      expect(r.blog).toBeDefined();
      expect(r.resultPaginated).toBeDefined();
      expect(r.resultPaginated.totalSize).toBeGreaterThan(0);
    });
  });

  describe('getEntry', () => {
    it('Fetches an entry', async () => {
      const r: GetBlogEntryResult = await store.dispatch(
        getEntry({ blogId: 1, id: 17, [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK })
      );
      expect(r.__resultCode).toBe('success');

      const e = r.blogEntry;
      assert(e !== null);
      expect(e.id).toBe(17);
      expect(e.permalink).toBe('get-started-with-article-comments');
      expect(e.slideshow).toBeDefined();

      expect(r.voteSummary).toBeDefined();
    });
  });

  describe('newEntry', () => {
    it('Constructs, but does not save a new blog entry', () => {
      const e = newBlogEntry('my-blog');
      expect(e).toBeDefined();
      expect(e.id).toBe(0);
    });
  });
});
