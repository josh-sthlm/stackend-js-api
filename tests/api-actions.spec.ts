//@flow

import createTestStore from './setup';
import { GetInitialStoreValuesResult } from '../src/api';
import { loadInitialStoreValues } from '../src/api/actions';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { PagesState } from '../src/cms/pageReducer';
import { CmsState } from '../src/cms/cmsReducer';

describe('API actions', () => {
  const store = createTestStore();

  describe('loadInitialStoreValues', () => {
    it('Loads data into the store', async () => {
      const r: GetInitialStoreValuesResult = await store.dispatch(
        loadInitialStoreValues({
          permalink: STACKEND_COM_COMMUNITY_PERMALINK,
          subSiteIds: [1]
        })
      );

      // Correct result
      expect(r.stackendCommunity).toBeDefined();
      expect(r.subSites).toBeDefined();
      expect(r.subSites['1']).toBeDefined();
      expect(r.cmsPages).toBeDefined();
      expect(r.cmsPages['8']).toBeDefined(); // Start page for site
      expect(r.cmsContents).toBeDefined();

      // Correct store setup
      const state = store.getState();
      const cmsContent: CmsState = state.cmsContent;
      const pages: PagesState = state.pages;
      expect(cmsContent).toBeDefined();
      expect(pages).toBeDefined();

      expect(pages.subSiteById['1']).toBeDefined();
      expect(pages.byId['8']).toBeDefined(); // Start page for site
      expect(pages.byId['8'].content).toBeDefined();

      console.log(
        'Content on page 8: ',
        pages.byId['8'].content.map(c => c.type + ' ' + c.reference)
      );

      console.log('Keys in cmsContent', Object.keys(cmsContent));
      // @ts-ignore
      expect(cmsContent['39']).toBeDefined(); // Content for start page
    });
  });
});
