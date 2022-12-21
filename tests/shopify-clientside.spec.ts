import assert from 'assert';

import createTestStore from './setup';
import {
  cartLinesAdd,
  cartLinesUpdate,
  createCart,
  getCart,
  getCollection,
  getCollections,
  getProduct,
  listProducts,
  listProductTypes
} from '../src/shop/shopify-clientside';
import {
  cartLinesRemove,
  forEachProductVariant,
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
      console.log('getProduct: ', JSON.stringify(r.product, undefined, 2));
      expect(r.product).toBeDefined();
      assert(r.product);
      expect(r.product.variants).toBeDefined();
      forEachProductVariant(r.product, v => {
        expect(v.id).toBeDefined();
        expect(v.title).toBeDefined();
        expect(v.priceV2).toBeDefined(); // pre 2022-10
        //expect(v.price).toBeDefined(); pre 2022-10
      });

      expect(r.product.options).toBeDefined();
      r.product.options.forEach(o => {
        expect(o.id).toBeDefined();
        expect(o.name).toBeDefined();
        expect(o.values).toBeDefined();
      });
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

  describe('create/get/update-cart', () => {
    let r: GetCartResult | null = null;
    it('Creates a cart', async () => {
      r = await store.dispatch(
        createCart({
          lines: [{ merchandiseId: 'gid://shopify/ProductVariant/36607622083' }]
        })
      );
      assert(r);
      console.log(r);
      expect(r.error).toBeUndefined();
      assert(r.cart != undefined);
    });

    it('get a cart', async () => {
      assert(r && r.cart);
      r = await store.dispatch(
        getCart({
          cartId: r.cart.id
        })
      );
      assert(r);
      expect(r.error).toBeUndefined();
      assert(r.cart);
      expect(r.cart.id).toBeDefined();
      expect(r.cart.lines.edges.length).toBe(1);
      console.log(r.cart);
    });

    it('updates a cart', async () => {
      assert(r && r.cart);
      r = await store.dispatch(
        cartLinesUpdate({
          cartId: r.cart.id,
          lines: [
            { id: r.cart.lines.edges[0].node.id, merchandiseId: r.cart.lines.edges[0].node.merchandise.id, quantity: 2 }
          ]
        })
      );
      assert(r);
      console.log(r.cart);
      expect(r.error).toBeUndefined();
      assert(r.cart);
      expect(r.cart.id).toBeDefined();
      expect(r.cart.lines.edges.length).toBe(1);
      expect(r.cart.lines.edges[0].node.quantity).toBe(2);
      console.log(r.cart.lines.edges[0].node);
    });

    it('add to a cart', async () => {
      assert(r && r.cart);
      r = await store.dispatch(
        cartLinesAdd({
          cartId: r.cart.id,
          lines: [{ merchandiseId: 'gid://shopify/ProductVariant/36607712259' }]
        })
      );
      assert(r);
      expect(r.error).toBeUndefined();
      assert(r.cart);
      console.log(r.cart.lines.edges);
      expect(r.cart.id).toBeDefined();
      expect(r.cart.lines.edges.length).toBe(2);
    });

    it('removes from a cart', async () => {
      assert(r && r.cart);
      r = await store.dispatch(
        cartLinesRemove({
          cartId: r.cart.id,
          lineIds: [r.cart.lines.edges[0].node.id]
        })
      );
      assert(r);
      expect(r.error).toBeUndefined();
      assert(r.cart);
      console.log(r.cart.lines.edges);
      expect(r.cart.id).toBeDefined();
      expect(r.cart.lines.edges.length).toBe(1);
    });
  });
});
