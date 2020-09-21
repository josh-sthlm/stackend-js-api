import {
  addToBasket,
  getProductListKey,
  removeFromBasket,
  requestProduct,
  requestProducts
} from '../src/shop/shopActions';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { ShopState } from '../src/shop/shopReducer';
import assert from 'assert';
import { Product } from '../src/shop';

describe('Shop Actions/Reducers', () => {
  const store = createTestStore();

  describe('getProductListKey', () => {
    it('Gets a uniqe key', () => {
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
    expect(shop.basket).toBeDefined();
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

  describe('Basket add/remove', () => {
    it('Add/removes a product to the basket', async () => {
      await store.dispatch(addToBasket('pin-boot'));
      let s = store.getState();
      let shop: ShopState = s.shop;
      assert(shop);

      expect(shop.basket).toBeDefined();
      expect(shop.basket).toStrictEqual([
        {
          handle: 'pin-boot',
          quantity: 1,
          variant: undefined
        }
      ]);

      await store.dispatch(addToBasket('pin-boot'));
      s = store.getState();
      shop = s.shop;
      expect(shop.basket).toStrictEqual([
        {
          handle: 'pin-boot',
          quantity: 2,
          variant: undefined
        }
      ]);

      await store.dispatch(removeFromBasket('pin-boot'));
      s = store.getState();
      shop = s.shop;
      expect(shop.basket).toStrictEqual([
        {
          handle: 'pin-boot',
          quantity: 1,
          variant: undefined
        }
      ]);

      await store.dispatch(removeFromBasket('pin-boot'));
      s = store.getState();
      shop = s.shop;
      expect(shop.basket).toStrictEqual([]);
    });
  });
});
