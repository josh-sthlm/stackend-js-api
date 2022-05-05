import assert from 'assert';

import createTestStore from './setup';
import {
  createCart,
  //createCart,
  getCart,
  getCollection,
  getCollections,
  getProduct,
  listProducts,
  listProductTypes
} from '../src/shop/shopify-clientside';
import {
  GetCartResult,
  GetCollectionResult,
  GetCollectionsResult,
  GetProductResult,
  getShopifyConfig,
  ListProductsResult,
  ListProductTypesResult,
  ProductSortKeys
} from '../src/shop';
import { initialize } from '../src/api/actions';

describe('Shopify Clientside', () => {
  const store = createTestStore();

  describe('getShopifyConfig', () => {
    it('getShopifyConfig', async () => {
      await store.dispatch(initialize({ permalink: 'husdjur' }));

      expect(store.dispatch(getShopifyConfig())).toStrictEqual({
        accessToken: 'ecdc7f91ed0970e733268535c828fbbe',
        apiVersion: '2022-01',
        countryCode: 'CA',
        domain: 'graphql.myshopify.com'
      });
    });
  });

  describe('listProductTypes', () => {
    it('listProductTypes', async () => {
      const r: ListProductTypesResult = await store.dispatch(listProductTypes({}));
      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.productTypes).toBeDefined();
      expect(r.productTypes.edges.length).toBeGreaterThan(1);
      console.log(r.productTypes.edges);
    });
  });

  describe('getProduct', () => {
    it('getProduct', async () => {
      const r: GetProductResult = await store.dispatch(getProduct({ handle: 'snare-boot' }));
      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.product).toBeDefined();
      console.log(r.product);
    });
  });

  describe('listProducts', () => {
    it('listProducts', async () => {
      const r: ListProductsResult = await store.dispatch(
        listProducts({ productTypes: ['Boots'], first: 2, q: 'snare', sort: ProductSortKeys.TITLE })
      );
      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.products).toBeDefined();
      expect(r.products.edges.length).toBeGreaterThan(0);
      console.log(r.products.edges[0].node);
    });
  });

  describe('getCollection', () => {
    it('getCollection', async () => {
      const r: GetCollectionResult = await store.dispatch(getCollection({ handle: 'frontpage' }));
      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.collection).toBeDefined();
      console.log(r.collection);
    });
  });

  describe('getCollections', () => {
    it('getCollections', async () => {
      const r: GetCollectionsResult = await store.dispatch(getCollections({}));
      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.collections).toBeDefined();
      expect(r.collections.edges.length).toBeGreaterThan(1);
      console.log(r.collections.edges);
    });
  });

  describe('create/get-cart', () => {
    it('Creates and gets a cart', async () => {
      let r: GetCartResult = await store.dispatch(
        createCart({
          lines: [{ merchandiseId: 'gid://shopify/Product/9895276099' }]
        })
      );
      assert(r);
      expect(r.error).toBeUndefined();
      assert(r.cart);
      console.log(r.cart);

      r = await store.dispatch(
        getCart({
          cartId: r.cart.id
        })
      );
      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.cart).toBeDefined();
      console.log(r.cart);
    });
  });
});
