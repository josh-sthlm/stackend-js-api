import createTestStore from './setup';
import {
  Blog,
  BLOG_ENTRY_CLASS,
  BlogEntry,
  GetBlogEntryResult,
  getCompositeBlogKey,
  getEntries,
  GetEntriesResult,
  getEntry,
  newBlogEntry
} from '../src/blog';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { COMMUNITY_PARAMETER } from '../src/api';
import assert from 'assert';
import ModerationStatus from '../src/api/ModerationStatus';
import { Group } from '../src/group';

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

  describe('getEntries with tags', () => {
    it('List entries with tags', async () => {
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

  describe('getCompositeBlogKey', () => {
    it('Get a composite blog key (blogKey, tags)', () => {
      const bk = getCompositeBlogKey({ blogKey: 'groups/my-blog', tags: ['bbb', 'aaa'] });
      expect(bk).toBeDefined();
      expect(bk).toBe('groups/my-blog/tags/aaa/bbb');
    });

    it('Get a composite blog key (blogKey, undefined tags)', () => {
      const bk = getCompositeBlogKey({ blogKey: 'groups/my-blog', tags: undefined });
      expect(bk).toBeDefined();
      expect(bk).toBe('groups/my-blog');
    });

    it('Get a composite blog key (blogKey, empty tags)', () => {
      const bk = getCompositeBlogKey({ blogKey: 'groups/my-blog', tags: [] });
      expect(bk).toBeDefined();
      expect(bk).toBe('groups/my-blog');
    });
  });
});

export function mockBlog(id: number, blogKey: string, group: Group): Blog {
  const now = Date.now();
  return {
    __type: 'net.josh.community.blog.Blog',
    id,
    name: 'Test blog ' + id,
    ttl: 0,
    type: 0,
    subtype: 0,
    modStatus: ModerationStatus.PASSED,
    modifiedDate: now,
    createdDate: now,
    description: 'Test ' + id,
    permalink: 'test-' + id,
    referenceId: 0,
    obfuscatedReference: 'blog' + id,
    creatorUserRef: null,
    publishedEntrySize: 1,
    entrySize: 1,
    cssName: '',
    css: 0,
    categoryRef: null,
    groupRef: group
  };
}

export function mockBlogEntry(blog: Blog, id: number): BlogEntry {
  const now = Date.now();
  return {
    __type: BLOG_ENTRY_CLASS,
    id,
    permalink: 'entry-' + id,
    type: '',
    creatorUserId: 0,
    creatorUserRef: null,
    blogId: 1,
    blogRef: blog,
    createdDate: now,
    obfuscatedReference: 'abc' + id,
    description: '',
    modifiedDate: now,
    ttl: 0,
    body: 'Test ' + id,
    plainTextBody: 'Test ' + id,
    modStatus: ModerationStatus.PASSED,
    name: 'Title ' + id,
    publishDate: now,
    numberOfComments: 0,
    numberOfLikes: 0,
    categoryRef: [],
    tags: ['tag1', 'tag2']
  };
}
