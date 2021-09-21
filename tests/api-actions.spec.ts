//@flow

import createTestStore from './setup';
import {
  _getApiUrl,
  Config,
  getApiUrl,
  GetInitialStoreValuesResult,
  resetConfiguration,
  setConfiguration,
  STACKEND_DEFAULT_CONTEXT_PATH,
  STACKEND_DEFAULT_SERVER
} from '../src/api';
import { initialize, loadInitialStoreValues } from '../src/api/actions';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { PagesState } from '../src/cms/pageReducer';
import { CmsState } from '../src/cms/cmsReducer';
import assert from 'assert';
import { ShopState } from '../src/shop/shopReducer';
import { getProductListKey } from '../src/shop/shopActions';

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
      assert(pages.byId['8']);
      expect(pages.byId['8'].content).toBeDefined();

      console.log(
        'Content on page 8: ',
        pages.byId['8'].content.map(c => c.type + ' ' + c.reference)
      );

      // Backwards compatible
      console.log('Keys in cmsContent', Object.keys(cmsContent));
      // @ts-ignore
      expect(cmsContent['39']).toBeDefined(); // Content for start page
    });

    it('Shop data', async () => {
      const listing = {
        first: 1,
        productTypes: ['Boots']
      };
      const key = store.dispatch(getProductListKey(listing));

      const r: GetInitialStoreValuesResult = await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur',
          productHandles: ['snare-boot'],
          productCollectionHandles: ['latest-stuff'],
          productListings: [listing]
        })
      );
      expect(r.error).toBeUndefined();
      const state = store.getState();
      const shop: ShopState = state.shop;
      expect(shop.products['snare-boot']).toBeDefined();
      expect(shop.collections['latest-stuff']).toBeDefined();
      expect(shop.productListings[key]).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('Initialize stackend', async () => {
      const r: GetInitialStoreValuesResult = await store.dispatch(
        initialize({
          permalink: STACKEND_COM_COMMUNITY_PERMALINK
        })
      );
      assert(r);
      assert(r.stackendCommunity);
      expect(r.stackendCommunity.permalink).toBe(STACKEND_COM_COMMUNITY_PERMALINK);

      // STACKEND_COM_COMMUNITY_PERMALINK should now be default
      let u = await store.dispatch(
        getApiUrl({
          url: '/test',
          parameters: { a: 1 }
        })
      );

      expect(
        u.match('https://api.stackend.com/' + STACKEND_COM_COMMUNITY_PERMALINK + '/api/test;s=.+?a=1') != null
      ).toBeTruthy();

      await store.dispatch(
        initialize({
          permalink: 'husdjur'
        })
      );

      // husdjur should now be default
      u = await store.dispatch(
        getApiUrl({
          url: '/test2',
          parameters: { a: 2 }
        })
      );
      expect(u.match('https://api.stackend.com/husdjur/api/test2;s=.*?a=2') != null).toBeTruthy();

      u = _getApiUrl({ state: store.getState(), url: '/test3', parameters: { b: 3 } });
      expect(u.match('https://api.stackend.com/husdjur/api/test3;s=.*?b=3') != null).toBeTruthy();
    });
  });

  describe('set/resetConfiguration', () => {
    it('Changes configuration', async () => {
      await store.dispatch(
        setConfiguration({
          server: 'https://localhost:8443',
          contextPath: '/stackend'
        })
      );

      let config: Config = store.getState().config;
      expect(config.server).toBe('https://localhost:8443');
      expect(config.contextPath).toBe('/stackend');
      expect(config.apiUrl).toBe('https://localhost:8443/stackend/api');
      let u = _getApiUrl({ state: store.getState(), url: '/test3', parameters: { b: 3 } });
      expect(u.match('https://localhost:8443/stackend/husdjur/api/test3;s=.*?b=3') != null).toBeTruthy();

      await store.dispatch(resetConfiguration());
      config = store.getState().config;
      expect(config.server).toBe(STACKEND_DEFAULT_SERVER);
      expect(config.contextPath).toBe(STACKEND_DEFAULT_CONTEXT_PATH);
      expect(config.apiUrl).toBe(STACKEND_DEFAULT_SERVER + STACKEND_DEFAULT_CONTEXT_PATH + '/api');
      u = _getApiUrl({ state: store.getState(), url: '/test3', parameters: { b: 3 } });
      expect(u.match('https://api.stackend.com/husdjur/api/test3;s=.*?b=3') != null).toBeTruthy();
    });
  });
});
