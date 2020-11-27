import {
  getProductListing,
  getProductListKey,
  getProductTypeLabel,
  getShopDefaults,
  requestAddressFields,
  requestCollection,
  requestCountries,
  requestMissingProducts,
  requestProduct,
  requestProducts,
  requestProductTypes,
  setShopDefaults
} from '../src/shop/shopActions';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { ShopState } from '../src/shop/shopReducer';
import assert from 'assert';
import { ProductSortKeys } from '../src/shop';
import { Country, FieldName } from '@shopify/address';

describe('Shop Actions/Reducers', () => {
  const store = createTestStore();

  describe('get/setShopDefaults', () => {
    it('Manage defaults for the shop', () => {
      const d = store.dispatch(getShopDefaults());
      expect(d).toStrictEqual({
        imageMaxWidth: 1024,
        listingImageMaxWidth: 256,
        pageSize: 20
      });

      const n = {
        pageSize: 10,
        imageMaxWidth: 512,
        listingImageMaxWidth: 100
      };
      store.dispatch(setShopDefaults(n));

      const d2 = store.dispatch(getShopDefaults());
      expect(d2).toStrictEqual(n);

      store.dispatch(setShopDefaults(d)); // Restore
    });
  });

  describe('getProductTypeLabel', () => {
    it('Get the label part of a product type', () => {
      expect(getProductTypeLabel('')).toBe('');
      expect(getProductTypeLabel('A')).toBe('A');
      expect(getProductTypeLabel('A/B')).toBe('B');
      expect(getProductTypeLabel('A/B/C')).toBe('C');
    });
  });

  describe('getProductListKey', () => {
    it('Gets a unique key', () => {
      expect(store.dispatch(getProductListKey({}))).toBe(';;;RELEVANCE;256;20;;;;');

      expect(
        store.dispatch(
          getProductListKey({
            first: 10,
            after: 'after',
            productTypes: ['Boot', 'Blouse'],
            tags: ['tag1', 'tag2'],
            q: 'test search',
            imageMaxWidth: 333
          })
        )
      ).toBe('test search;Boot,Blouse;tag1,tag2;RELEVANCE;333;10;after;;;');
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
      const key = store.dispatch(getProductListKey(req));
      const list = shop.productListings[key];
      expect(list).toBeDefined();
      expect(list.products).toBeDefined();
      expect(list.products.length).toBeGreaterThanOrEqual(1);
      expect(list.hasPreviousPage).toBeFalsy();
      expect(list.hasNextPage).toBeTruthy();
      expect(list.nextCursor).toBeDefined();
      expect(list.previousCursor).toBeDefined();

      const EXPECTED_HANDLES = ['snare-boot', 'neptune-boot', 'arena-zip-boot'];
      expect(list.products.map(p => p.handle)).toStrictEqual(EXPECTED_HANDLES);

      const listing = store.dispatch(getProductListing(req));
      assert(listing);
      expect(listing.products).toBeDefined();
      expect(listing.products.length).toBe(3);
      expect(listing.hasNextPage).toBeTruthy();
      expect(listing.hasPreviousPage).toBeFalsy();
      expect(listing.nextCursor).toBeDefined();
      expect(listing.previousCursor).toBeDefined();
      expect(listing.products[0].handle).toBe('snare-boot');
      expect(listing.selection).toBeDefined();
      expect(listing.selection.first).toBe(req.first);
      expect(listing.selection.productTypes).toStrictEqual(['Boots']);
    });

    it('Sort and pagination', async () => {
      const req = {
        sort: ProductSortKeys.BEST_SELLING,
        first: 1
      };
      await store.dispatch(requestProducts(req));
      const listing = store.dispatch(getProductListing(req));
      assert(listing);
      expect(listing.products).toBeDefined();
      expect(listing.products.length).toBe(1);
      expect(listing.products[0].handle).toBeDefined();
      expect(listing.selection).toBeDefined();
      expect(listing.selection.sort).toBe(req.sort);
      expect(listing.selection.first).toBe(req.first);
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

  describe('requestMissingProducts', () => {
    it('Loads missing products into store', async () => {
      await store.dispatch(
        requestMissingProducts({
          handles: [
            'pin-boot', // already loaded
            'hanra-shirt'
          ]
        })
      );
      const s = store.getState();
      const shop: ShopState = s.shop;
      assert(shop);
      expect(shop.products['pin-boot']).toBeDefined();
      expect(shop.products['hanra-shirt']).toBeDefined();
    });
  });

  describe('requestCollection', () => {
    it('Loads a collection into store', async () => {
      await store.dispatch(requestCollection({ handle: 'latest-stuff' }));
      const s = store.getState();
      const shop: ShopState = s.shop;
      assert(shop);
      expect(shop.collections['latest-stuff']).toBeDefined();
    });
  });

  describe('requestCountries', () => {
    it('Loads countries into store', async () => {
      const c: Array<Country> = await store.dispatch(requestCountries({ locale: 'en_US' }));
      assert(c);
      expect(c.length).toBeGreaterThan(10);
      const shop: ShopState = store.getState().shop;
      assert(shop.countryCodes);
      expect(shop.countryCodes.length).toBeGreaterThan(10);
      expect(shop.countriesByCode).toBeDefined();
      expect(shop.countryCodes.indexOf('SV') !== -1).toBeTruthy();
      expect(shop.countriesByCode['SV']).toBeDefined();
    });
  });

  describe('requestAddressFields', () => {
    it('Loads address fields into store', async () => {
      const c: FieldName[][] = await store.dispatch(requestAddressFields({ locale: 'en_US', countryCode: 'sv' }));
      assert(c);
      expect(c.length).toBeGreaterThan(1);
      const shop: ShopState = store.getState().shop;
      const f = shop.addressFieldsByCountryCode['SV'];
      expect(f).toBeDefined();
      expect(f.length).toBeGreaterThan(3);
    });
  });

  /*
  describe('checkout', () => {
    it('add/remove from checkout', async () => {
      const shop: ShopState = store.getState().shop;
      const p: Product = shop.products['pin-boot']; // Should be loaded by earlier test
      console.log(shop.products);
      expect(p).toBeDefined();
      let r: CheckoutResult = await store.dispatch(checkoutAdd(p, p.variants.edges[0].node, 2));
      assert(r);
      expect(r.error).toBeUndefined();
      console.log(r.response.checkout.lineItems);

      r = await store.dispatch(checkoutRemove(p, p.variants.edges[0].node, 1));
      assert(r);
      expect(r.error).toBeUndefined();
      console.log(r.response.checkout.lineItems);
    });
  });
   */
});
