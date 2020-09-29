//@flow

import createTestStore from './setup';

import { initialize } from '../src/api/actions';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import assert from 'assert';
import { getPageByPermalink, requestMissingPages } from '../src/cms/pageActions';
import { PagesState } from '../src/cms/pageReducer';

describe('CMS Page Actions', () => {
  const store = createTestStore();

  describe('requestMissingPages', () => {
    it('Fetch cms content', async () => {
      await store.dispatch(initialize({ permalink: STACKEND_COM_COMMUNITY_PERMALINK }));

      let r = await store.dispatch(
        requestMissingPages({
          permalinks: ['about', 'does-not-exist-666']
        })
      );

      let state = store.getState();
      let pages: PagesState = state.pages;
      assert(pages);
      expect(pages.idByPermalink).toBeDefined();
      expect(pages.idByPermalink['about']).toBe(5);
      expect(pages.idByPermalink['does-not-exist-666']).toBeNull();
      expect(pages.byId).toBeDefined();
      expect(pages.byId[5]).toBeDefined();

      // Should not fetch anything
      r = await store.dispatch(
        requestMissingPages({
          permalinks: ['about', 'does-not-exist-666']
        })
      );

      expect(r.__relatedObjects).toBeUndefined();
      state = store.getState();
      pages = state.pages;

      expect(getPageByPermalink(pages, 'about')).toBeDefined();
      expect(getPageByPermalink(pages, 'does-not-exist-666')).toBeNull();
    });
  });
});
