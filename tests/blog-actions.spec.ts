import createTestStore from './setup';

import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { fetchBlogEntries } from '../src/blog/groupBlogEntriesActions';
import { initialize } from '../src/api/actions';
import { Privilege } from '../src/user/privileges';
import { getBlogAuthById, getBlogAuthByPermalink, getBlogById, getBlogByPermalink } from '../src/blog/blogActions';

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
      const { groupBlogEntries, likes, blogs } = store.getState();
      expect(groupBlogEntries).toBeDefined();
      expect(groupBlogEntries['groups/news']).toBeDefined();
      expect(groupBlogEntries['groups/news'].json).toBeDefined();
      console.log(groupBlogEntries['groups/news'].json);
      expect(groupBlogEntries['groups/news'].json.resultPaginated).toBeDefined();
      expect(groupBlogEntries['groups/news'].json.resultPaginated.totalSize).toBeGreaterThan(1);
      expect(groupBlogEntries['groups/news'].json.resultPaginated.entries).toBeDefined();

      //expect(groupBlogEntries['groups/news'].json).toBeUndefined();

      console.log(blogs);
      expect(blogs.blogs).toBeDefined();
      expect(blogs.idByPermalink['groups/news']).toBe(1);
      expect(blogs.blogs[1]).toBeDefined();
      expect(blogs.blogs[1].id).toBe(1);
      expect(blogs.auth[1]).toBeDefined();
      expect(blogs.auth[1].userPrivilege).toBe(Privilege.VISITOR);
      expect(getBlogById(blogs, 1)?.permalink).toBe('groups/news');
      expect(getBlogByPermalink(blogs, 'groups/news')?.id).toBe(1);
      expect(getBlogAuthById(blogs, 1)?.userPrivilege).toBe(Privilege.VISITOR);
      expect(getBlogAuthByPermalink(blogs, 'groups/news')?.userPrivilege).toBe(Privilege.VISITOR);

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
