//@flow

import createTestStore from './setup-redux';
import { getEntries, getEntry, newBlogEntry } from '../src/blog';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { COMMUNITY_PARAMETER } from '../src/api';

describe('Blog', () => {

  let store = createTestStore();
  let state = store.getState();
  expect(state.blogs).toBeDefined();


  describe('getEntries', () => {
    it("List entries", async () => {

      let r = await store.dispatch(getEntries({blogId : 1, [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK }));
      expect(r.__resultCode).toBe("success");
      expect(r.blog).toBeDefined();
      expect(r.resultPaginated).toBeDefined();
      expect(r.resultPaginated.totalSize).toBeGreaterThan(0);

    })
  });

  describe("getEntry", () => {
    it("Fetches an entry", async () => {
      let r = await store.dispatch(getEntry({blogId : 1, id: 17, [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK }));
      expect(r.__resultCode).toBe("success");
      expect(r.blogEntry).toBeDefined();
      expect(r.blogEntry.id).toBe(17);
      expect(r.blogEntry.permalink).toBe('get-started-with-article-comments');
      expect(r.blogEntry.slideshow).toBeDefined();
      expect(r.voteSummary).toBeDefined();

    })
  });

  describe("newEntry", () => {
    it("Constructs, but does not save a new blog entry", () => {
      let e = newBlogEntry("my-blog");
      expect(e).toBeDefined();
      expect(e.id).toBe(0);
    })
  });

});
