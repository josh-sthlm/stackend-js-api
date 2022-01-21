import createTestStore from './setup';

import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import {
  fetchBlogEntries,
  fetchBlogEntriesWithComments,
  FetchBlogEntriesWithCommentsResult
} from '../src/blog/groupBlogEntriesActions';
import { initialize } from '../src/api/actions';
import { Privilege } from '../src/user/privileges';
import {
  fetchBlog,
  getBlogAuthById,
  getBlogAuthByPermalink,
  getBlogById,
  getBlogByPermalink
} from '../src/blog/blogActions';
import { getBlogEntries, getGroupBlogState, GroupBlogState } from '../src/blog/groupBlogEntriesReducer';
import assert from 'assert';
import { PaginatedCollection } from '../src/api/PaginatedCollection';
import { BlogEntry } from '../src/blog';
import { getUserFromStore } from '../src/user/userActions';
import { User } from '../src/user';
//import { GetBlogEntryResult } from '../src/blog';
//import assert from 'assert';

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

      const r = await store.dispatch(fetchBlogEntries({ blogKey: 'groups/news', pageSize: 2 }));
      assert(r);
      expect(r.error).toBeUndefined();
      //console.log(r.resultPaginated);
      const { groupBlogEntries, likes, blogs, users } = store.getState();
      expect(groupBlogEntries).toBeDefined();
      expect(groupBlogEntries['groups/news']).toBeDefined();

      const gbs: GroupBlogState | null = getGroupBlogState(groupBlogEntries, 'groups/news');
      assert(gbs);
      expect(gbs.json).toBeDefined();
      //console.log(gbs.json);

      const entries: PaginatedCollection<BlogEntry> | null = getBlogEntries(groupBlogEntries, 'groups/news');
      assert(entries);

      expect(entries.totalSize).toBeGreaterThan(1);
      expect(entries.entries).toBeDefined();
      assert(entries.entries[0]);
      // FIXME: Backends support for pinning changes the page size. Should disable that
      // expect(entries.entries.length).toBe(2);
      assert(entries.entries[0].creatorUserRef);
      expect(entries.entries[0].creatorUserRef.id).toBe(1);

      //console.log(blogs);
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

      //console.log(likes);
      expect(Object.keys(likes).length).toBeGreaterThan(Object.keys(likes1).length);

      // as a side effect, users should have been added
      assert(users);
      const u: User | null = getUserFromStore(users, 1);
      assert(u);
      expect(u.id).toBe(1);

      // Load another page
      await store.dispatch(fetchBlogEntries({ blogKey: 'groups/news', p: 2, pageSize: 2 }));

      const entries2: PaginatedCollection<BlogEntry> | null = getBlogEntries(
        store.getState().groupBlogEntries,
        'groups/news'
      );
      assert(entries2);
      expect(entries2.entries.length).toBeGreaterThan(entries.entries.length);
    });
  });

  it('fetchBlogEntriesWithComments', async () => {
    const r: FetchBlogEntriesWithCommentsResult = await store.dispatch(
      fetchBlogEntriesWithComments({ blogKey: 'groups/news', invalidatePrevious: true })
    );
    assert(r.fetchBlogEntries);
    expect(r.fetchBlogEntries.error).toBeUndefined();
    assert(r.fetchMultipleComments);
    expect(r.fetchMultipleComments.error).toBeUndefined();

    const { groupBlogEntries } = store.getState();

    const e: PaginatedCollection<BlogEntry> | null = getBlogEntries(groupBlogEntries, 'groups/news');
    assert(e);

    expect(e.entries[0]).toBeDefined();
    assert(e.entries[0].creatorUserRef);
    expect(e.entries[0].creatorUserRef.id).toBe(1);
  });

  it('fetchBlog', async () => {
    const r = await store.dispatch(fetchBlog({ blogKey: 'groups/news' }));
    console.log(r);
    // FIXME: Improve this
  });

  /* Enable when backend support is deployed
  it('Get entry ', async () => {
    const r: GetBlogEntryResult | null = await store.dispatch(
      fetchBlogEntry({
        id: 23,
        permalink: 'stackend-supports-cake-goal-zero-sawc-and-trifilon',
        blogKey: 'groups/news'
      })
    );
    assert(r);
    expect(r.blogEntry).toBeDefined();
  });
   */
});
