//@flow

import createTestStore from './setup-redux';

import { COMMUNITY_PARAMETER } from '../src/api'
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend'
import {
  getContent,
  GetContentResult,
  getPage,
  GetPageResult,
  getPages,
  GetPagesResult, getSubSite, GetSubSiteResult,
  search,
  SearchResult
} from '../src/cms'


describe('CMS', () => {
  let store = createTestStore();

  describe("getContent", () => {
    it("Get a content object", async () => {
      let r: GetContentResult = await store.dispatch(getContent({
        permalink: 'my-first-stack-instructions',
        [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
      }));

      expect(r.__resultCode).toBe("success");

      let c = r.content;
      expect(c).toBeDefined();
      expect(c.id).toBe(84);
      expect(c.permalink).toBe('my-first-stack-instructions');
      expect(c.body).toBeDefined();
    })
  });


  /*
  describe("getPages", () => {
    it("Get CMS pages", async () => {
      let r: GetPagesResult = await store.dispatch(getPages({
        pageIds: [85],
        [COMMUNITY_PARAMETER]: STACKEND_COM_COMMUNITY_PERMALINK
      }));

      console.log(r);
      expect(r.__resultCode).toBe("success");
      expect(r.pages).toBeDefined();
      expect(r.pages[5]).toBeDefined();
    });
  });
  */

  describe("getSubSite", () => {
    it("Get CMS sub site", async () => {
      let r: GetSubSiteResult = await store.dispatch(getSubSite({
        id: 1,
        [COMMUNITY_PARAMETER]: 'husdjur'
      }));

      expect(r.__resultCode).toBe("success");
      expect(r.tree).toBeDefined();
      expect(r.tree.id).toBe(1);
      expect(r.tree.permalink).toBe('test');
      expect(r.tree.__type).toBe("se.josh.xcap.tree.impl.TreeImpl");
      expect(r.tree.children.length).toBeGreaterThanOrEqual(1);
    });
  });

});


