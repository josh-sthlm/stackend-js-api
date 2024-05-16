import createTestStore from './setup';

import { initialize } from '../src/api/actions';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import assert from 'assert';
import { getPageByPermalink, requestMissingPages, requestMissingSubSite, requestSubSite } from '../src/cms/pageActions';
import { PagesState } from '../src/cms/pageReducer';
import { GetSubSiteResult } from '../src/cms';

describe('CMS Page Actions', () => {
  const store = createTestStore();

  describe('requestMissingPages', () => {
    it('Fetch cms pages', async () => {
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

  describe('requestSubSite', () => {
    it('Fetch a sub site', async () => {
      let r: GetSubSiteResult = await store.dispatch(requestSubSite(5)); // For backward compatibility
      expect(r.error).toBeUndefined();
      expect(r.tree).toBeDefined();
      expect(r.tree?.id).toBe(5);
      expect(r.tree?.permalink).toBe('stackend-com');

      r = await store.dispatch(requestSubSite({ id: 5 }));
      expect(r.error).toBeUndefined();
      expect(r.tree).toBeDefined();
      expect(r.tree?.id).toBe(5);
      expect(r.tree?.permalink).toBe('stackend-com');

      r = await store.dispatch(requestSubSite({ permalink: 'stackend-com' }));
      expect(r.error).toBeUndefined();
      expect(r.tree).toBeDefined();
      expect(r.tree?.id).toBe(5);
      expect(r.tree?.permalink).toBe('stackend-com');
    });
  });

  describe('requestMissingSubSite', () => {
    it('Fetch a missing sub site', async () => {
      const r: GetSubSiteResult = await store.dispatch(requestMissingSubSite({ id: 5 })); // For backward compatibility
      expect(r.error).toBeUndefined();
      expect(r.tree).toBeDefined();
      expect(r.tree?.id).toBe(5);
      expect(r.tree?.permalink).toBe('stackend-com');
      let pages: PagesState = store.getState().pages;
      expect(pages.subSiteById[5]).toBeDefined();
      expect(pages.subSiteIdByPermalink['stackend-com']).toBe(5);

      const r2: GetSubSiteResult = await store.dispatch(requestMissingSubSite({ id: 5 })); // For backward compatibility
      expect(r2.error).toBeUndefined();
      expect(r2.tree === r.tree).toBeTruthy(); // Should be cached
      pages = store.getState().pages;
      expect(pages.subSiteById[5]).toBeDefined();
      expect(pages.subSiteIdByPermalink['stackend-com']).toBe(5);
    });
  });
});
