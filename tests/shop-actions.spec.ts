import {
  findProductTypeTreeNode,
  getAllProductTypes,
  getProductListing,
  getProductListKey,
  getProductTypeLabel,
  ProductTypeTree,
  requestAddressFields,
  requestCountries,
  requestMissingProducts,
  requestProduct,
  requestProducts,
  requestProductTypes
} from '../src/shop/shopActions';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { buildProductTypeTree, ShopState } from '../src/shop/shopReducer';
import assert from 'assert';
import { ProductSortKeys } from '../src/shop';
import { Country, FieldName } from '@shopify/address';

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

  describe('getProductTypeLabel', () => {
    it('Get the label part of a product type', () => {
      expect(getProductTypeLabel('')).toBe('');
      expect(getProductTypeLabel('A')).toBe('A');
      expect(getProductTypeLabel('A/B')).toBe('B');
      expect(getProductTypeLabel('A/B/C')).toBe('C');
    });
  });

  describe('findProductTypeTreeNode', () => {
    it('Finds a specific tree node', () => {
      const t: ProductTypeTree = [
        {
          name: 'A',
          productType: 'a',
          children: [
            {
              name: 'A/B',
              productType: 'a/b',
              children: []
            },
            {
              name: 'A/C',
              productType: 'a/c',
              children: []
            }
          ]
        },
        { name: 'B', productType: 'b', children: [] }
      ];

      const r = findProductTypeTreeNode(t, 'a/c');
      assert(r);
      expect(r.productType).toBe('a/c');
      expect(findProductTypeTreeNode(t, 'c')).toBeNull();
      expect(findProductTypeTreeNode(t, 'b')).toBeDefined();

      expect(findProductTypeTreeNode(t[0], 'a/c')).toStrictEqual(t[0].children[1]);
    });
  });

  describe('getProductListKey', () => {
    it('Gets a unique key', () => {
      expect(getProductListKey({})).toBe(';;;RELEVANCE;;;1024;');

      expect(
        getProductListKey({
          first: 10,
          after: 'after',
          productTypes: ['Boot', 'Blouse'],
          tags: ['tag1', 'tag2'],
          q: 'test search'
        })
      ).toBe('test search;Boot,Blouse;tag1,tag2;RELEVANCE;10;after;1024;');
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

      const listing = getProductListing(shop, req);
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

  describe('requestProducts', () => {
    it('List products', async () => {
      const req = {
        sort: ProductSortKeys.BEST_SELLING,
        first: 1
      };
      await store.dispatch(requestProducts(req));
      const s = store.getState();
      const shop: ShopState = s.shop;
      assert(shop);
      const listing = getProductListing(shop, req);
      assert(listing);
      expect(listing.products).toBeDefined();
      expect(listing.products.length).toBe(1);
      expect(listing.products[0].handle).toBeDefined();
      expect(listing.selection).toBeDefined();
      expect(listing.selection.sort).toBe(req.sort);
      expect(listing.selection.first).toBe(req.first);
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
});
