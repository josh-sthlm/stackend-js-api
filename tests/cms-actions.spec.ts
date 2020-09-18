//@flow

import createTestStore from './setup';

import { initialize, loadInitialStoreValues } from "../src/api/actions";
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { fetchContent, getContentById, getContentByPermalink } from "../src/cms/cmsActions";
import { CmsState } from "../src/cms/cmsReducer";
import assert from "assert";

describe('CMS Actions',  () => {
  const store = createTestStore();
  const permalink = 'my-first-stack-instructions';

  describe('fetchContent', () => {
    it('Fetch cms content', async () => {
      await store.dispatch(
        initialize({ permalink: STACKEND_COM_COMMUNITY_PERMALINK })
      );

      const id = 84;
      await store.dispatch(
        fetchContent({
          permalink
        })
      );

      const state = store.getState();
      const cmsContent: CmsState = state.cmsContent;
      expect(cmsContent).toBeDefined();

      // For backwards compatibility
      expect((cmsContent as any)[id]).toBeDefined();
      expect((cmsContent as any)[id].id).toBe(id);
      expect((cmsContent as any)[id].permalink).toBe(permalink);

      // New structure
      expect(cmsContent.byId).toBeDefined();
      expect(cmsContent.idByPermalink).toBeDefined();
      expect(cmsContent.idByPermalink[permalink]).toBeDefined();
      expect(cmsContent.idByPermalink[permalink]).toBe(id);
      expect(cmsContent.byId[id]).toBeDefined();


      expect(cmsContent.byId[id].id).toBe(id);
      expect(cmsContent.byId[id].permalink).toBe(permalink);

      const c = getContentById(cmsContent, id);
      assert(c);
      expect(c.permalink).toBe(permalink);

      const c2 = getContentByPermalink(cmsContent, permalink);
      assert(c2);
      expect(c2.id).toBe(id);
    });
  });

  describe('receiveContents', () => {
    it('Arrange received content', async () => {

      await store.dispatch(loadInitialStoreValues({
        permalink: STACKEND_COM_COMMUNITY_PERMALINK,
        contentIds: [ 84, 4 ]
      }));

      const state = store.getState();
      const cmsContent: CmsState = state.cmsContent;

      expect((cmsContent as any)[84]).toBeDefined();
      expect((cmsContent as any)[4]).toBeDefined();

      expect(cmsContent.idByPermalink[permalink]).toBe(84);
      expect(cmsContent.idByPermalink['footer']).toBe(4);

      expect(cmsContent.byId[84].permalink).toBe(permalink);
      expect(cmsContent.byId[4].permalink).toBe('footer');
    });
  })
})
