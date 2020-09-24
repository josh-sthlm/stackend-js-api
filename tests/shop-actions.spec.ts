import {
  getAllProductTypes,
  getProductListing,
  getProductListKey,
  requestProduct,
  requestProducts,
  requestProductTypes
} from '../src/shop/shopActions';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { buildProductTypeTree, ShopState } from '../src/shop/shopReducer';
import assert from 'assert';

describe('Shop Actions/Reducers', () => {
  const store = createTestStore();

  describe('buildProductTypeTree', () => {
    it('Creates a product tree', () => {
      let t = buildProductTypeTree([]);
      assert(t);
      expect(t.length).toBe(0);

      t = buildProductTypeTree([{ node: 'c' }, { node: 'b' }, { node: 'a' }]);
      assert(t);
      expect(t.length).toBe(3);
      expect(t[0].children.length).toBe(0);
      expect(t[0].name).toBe('a');
      expect(t[0].productType).toBe('a');

      expect(t[2].children.length).toBe(0);
      expect(t[2].name).toBe('c');
      expect(t[2].productType).toBe('c');

      t = buildProductTypeTree([{ node: 'a/b' }, { node: 'c' }, { node: 'a' }]);
      assert(t);
      expect(t.length).toBe(2);
      expect(t[0].name).toBe('a');
      expect(t[0].productType).toBe('a');
      expect(t[0].children[0].productType).toBe('a/b');
      expect(t[0].children[0].name).toBe('b');
      expect(t[0].children[0].children.length).toBe(0);
      expect(t[1].productType).toBe('c');

      t = buildProductTypeTree([{ node: 'c' }, { node: 'a/b/c' }, { node: 'a/a' }, { node: 'a/b' }]);
      assert(t);
      expect(t.length).toBe(2);
      expect(t[0].name).toBe('a');
      expect(t[1].productType).toBe('c');
      expect(t[0].children.length).toBe(2);
      expect(t[0].children[0].productType).toBe('a/a');
      expect(t[0].children[1].productType).toBe('a/b');
      expect(t[0].children[1].children.length).toBe(1);
      expect(t[0].children[1].children[0].productType).toBe('a/b/c');

      expect(getAllProductTypes(t[0])).toStrictEqual(['a', 'a/a', 'a/b', 'a/b/c']);
    });
  });

  describe('getProductListKey', () => {
    it('Gets a unique key', () => {
      expect(getProductListKey({})).toBe(';;;RELEVANCE;;;');

      expect(
        getProductListKey({
          first: 10,
          after: 'after',
          productTypes: ['Boot', 'Blouse'],
          tags: ['tag1', 'tag2'],
          q: 'test search'
        })
      ).toBe('test search;Boot,Blouse;tag1,tag2;RELEVANCE;10;after;');
    });
  });

  describe('Initial state', () => {
    const s = store.getState();
    const shop: ShopState = s.shop;
    expect(shop).toBeDefined();
    expect(shop.productListings).toBeDefined();
    expect(shop.products).toBeDefined();
    expect(shop.productTypes).toBeDefined();
    expect(shop.productTypeTree).toBeDefined();
  });

  describe('requestProducts', () => {
    it('Loads products into store', async () => {
      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur'
        })
      );

      const req = {
        first: 3,
        productTypes: ['Boots']
      };

      await store.dispatch(requestProducts(req));
      const s = store.getState();
      const shop: ShopState = s.shop;
      assert(shop);

      expect(shop.productListings).toBeDefined();
      const key = getProductListKey(req);
      expect(shop.productListings[key]).toBeDefined();
      expect(shop.productListings[key].length).toBeGreaterThanOrEqual(1);

      const EXPECTED_HANDLES = ['snare-boot', 'neptune-boot', 'arena-zip-boot'];
      expect(shop.productListings[key]).toStrictEqual(EXPECTED_HANDLES);

      EXPECTED_HANDLES.forEach(h => {
        expect(shop.products[h]).toBeDefined();
      });

      const products = getProductListing(shop, req);
      assert(products);
      expect(products.length).toBe(3);
      expect(products[0].handle).toBe('snare-boot');
    });
  });

  describe('requestProductTypes', () => {
    it('Loads product types into store', async () => {
      await store.dispatch(requestProductTypes({}));
      const s = store.getState();
      const shop: ShopState = s.shop;
      assert(shop);
      expect(shop.productTypes).toBeDefined();
      expect(shop.productTypes.length).toBeGreaterThanOrEqual(1);
      expect(shop.productTypeTree.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('requestProduct', () => {
    it('Loads a product into store', async () => {
      await store.dispatch(requestProduct({ handle: 'pin-boot' }));
      const s = store.getState();
      const shop: ShopState = s.shop;
      assert(shop);
      expect(shop.products['pin-boot']).toBeDefined();
    });
  });
});
