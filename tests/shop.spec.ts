import assert from 'assert';
import {
  findAllProductVariants,
  findExactProductVariant,
  forEachProductVariant,
  getAddressFields,
  getCollection,
  GetCollectionRequest,
  GetCollectionResult,
  getCountries,
  getCountry,
  getLowestVariantPrice,
  getParentProductType,
  getProduct,
  GetProductResult,
  getProductSelection,
  getProductTypeRoots,
  getProductVariant,
  getVariantImage,
  listProducts,
  ListProductsRequest,
  ListProductsResult,
  mapProductVariants,
  newGetProductRequest,
  newGetProductsRequest,
  newListProductsRequest,
  ProductSelection,
  ProductSortKeys,
  toMoneyV2,
  Country,
  AddressFieldName,
  getCollections,
  GetCollectionsResult
} from '../src/shop';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { getNextCursor, getPreviousCursor } from '../src/util/graphql';

describe('Shop', () => {
  const store = createTestStore();

  describe('Product', () => {
    it('newGetProductRequest', () => {
      expect(store.dispatch(newGetProductRequest('apa'))).toStrictEqual({
        handle: 'apa',
        imageMaxWidth: 1024
      });

      expect(store.dispatch(newGetProductRequest({ handle: 'apa' }))).toStrictEqual({
        handle: 'apa',
        imageMaxWidth: 1024
      });

      expect(store.dispatch(newGetProductRequest({ handle: 'apa', imageMaxWidth: 333 }))).toStrictEqual({
        handle: 'apa',
        imageMaxWidth: 333
      });
    });

    it('newGetProductsRequest', () => {
      expect(store.dispatch(newGetProductsRequest(['skirt', 'shirt']))).toStrictEqual({
        handles: ['skirt', 'shirt'],
        imageMaxWidth: 1024
      });

      expect(store.dispatch(newGetProductsRequest({ handles: ['skirt', 'shirt'] }))).toStrictEqual({
        handles: ['skirt', 'shirt'],
        imageMaxWidth: 1024
      });

      expect(store.dispatch(newGetProductsRequest({ handles: ['skirt', 'shirt'], imageMaxWidth: 333 }))).toStrictEqual({
        handles: ['skirt', 'shirt'],
        imageMaxWidth: 333
      });
    });

    it('get/functions', async () => {
      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur'
        })
      );

      const r: GetProductResult = await store.dispatch(getProduct({ handle: 'snare-boot' }));
      assert(r);
      expect(r.error).toBeUndefined();

      const p = r.product;
      assert(p);

      expect(p.id).toBe('Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0Lzk4OTUyNzYwOTk=');
      expect(p.handle).toBe('snare-boot');
      expect(p.descriptionHtml).toBeDefined();
      expect(p.availableForSale).toBeTruthy();
      expect(p.tags).toBeDefined();
      expect(p.productType).toBeDefined();
      expect(p.createdAt).toBeDefined();
      expect(p.variants).toBeDefined();
      expect(p.images).toBeDefined();
      expect(p.options).toBeDefined();
      expect(p.vendor).toBeDefined();

      expect(p.variants.edges.length).toBeGreaterThan(1);

      let v = getProductVariant(p, 'x');
      expect(v).toBeNull();

      v = getProductVariant(p, 'Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0VmFyaWFudC8zNjYwNzYyMjA4Mw==');
      expect(v).toBeDefined();

      let j = 0;
      forEachProductVariant(p, (v, i, p) => {
        expect(v).toBeDefined();
        expect(p).toBeDefined();
        expect(v.id).toBeDefined();
        expect(i).toBe(j);
        j++;
      });
      expect(j).toBe(p.variants.edges.length);

      const x = mapProductVariants(p, (variant, product) => variant.id);
      expect(x).toBeDefined();
      expect(x.length).toBe(p.variants.edges.length);
      expect(x[0]).toBe(p.variants.edges[0].node.id);

      const img = getVariantImage(p, 'Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0VmFyaWFudC8zNjYwNzYyMjA4Mw==');
      assert(img);
      expect(img.url || (img as any).transformedSrc).toBeDefined();
      expect(img.altText).toBeDefined();

      const vp = getLowestVariantPrice(p);
      assert(vp);
      expect(vp.currencyCode).toBeDefined();
      expect(vp.amount).toBeDefined();
    });

    it('newListProductsRequest', () => {
      let r = store.dispatch(newListProductsRequest());
      expect(r).toStrictEqual({
        imageMaxWidth: 256,
        first: 20
      });

      r = store.dispatch(newListProductsRequest({ q: 'shirt' }));
      expect(r).toStrictEqual({
        imageMaxWidth: 256,
        first: 20,
        q: 'shirt'
      });

      r = store.dispatch(newListProductsRequest({ q: 'shirt', imageMaxWidth: 333, first: 10 }));
      expect(r).toStrictEqual({
        imageMaxWidth: 333,
        first: 10,
        q: 'shirt'
      });
    });

    it('listProducts', async () => {
      const req: ListProductsRequest = {
        first: 1,
        sort: ProductSortKeys.ID
      };
      let r: ListProductsResult = await store.dispatch(listProducts(req));
      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.products).toBeDefined();
      expect(r.products.pageInfo).toBeDefined();
      expect(r.products.pageInfo.hasNextPage).toBeTruthy();
      expect(r.products.pageInfo.hasPreviousPage).toBeFalsy();
      expect(r.products.edges).toBeDefined();
      expect(r.products.edges.length).toBe(1);
      expect(r.products.edges[0]).toBeDefined();
      expect(r.products.edges[0].cursor).toBeDefined();
      expect(r.products.edges[0].node).toBeDefined();
      expect(r.products.edges[0].node.handle).toBe('snare-boot');

      let c = getNextCursor(r.products);
      expect(c).toBe(r.products.edges[0].cursor);
      expect(getPreviousCursor(r.products)).toBeNull();

      // Pagination
      req.after = r.products.edges[0].cursor;
      r = await store.dispatch(listProducts(req));

      assert(r);
      expect(r.error).toBeUndefined();
      expect(r.products).toBeDefined();
      expect(r.products.pageInfo.hasNextPage).toBeTruthy();
      expect(r.products.pageInfo.hasPreviousPage).toBeTruthy();
      expect(r.products.edges.length).toBe(1);
      expect(r.products.edges[0]).toBeDefined();
      expect(r.products.edges[0].cursor).toBeDefined();
      expect(r.products.edges[0].node.handle).toBe('neptune-boot');
      assert(r.products.edges[0].cursor !== req.after);

      c = getNextCursor(r.products);
      expect(c).toBe(r.products.edges[0].cursor);
      //const n = getPreviousCursor(r.products);
      // FIXME: Broken
    });

    it('selection', async () => {
      const r: GetProductResult = await store.dispatch(getProduct({ handle: 'snare-boot' }));
      assert(r);
      const p = r.product;
      assert(p);

      const s: ProductSelection = {};
      expect(findExactProductVariant(p, s)).toBeNull();
      s.Color = 'Brown';
      s.Size = '9';
      const v = findExactProductVariant(p, s);
      assert(v);
      expect(v.title).toBe('Brown / 9');

      const vs = findAllProductVariants(p, { Color: 'Brown' });
      assert(vs);
      expect(vs.length).toBeGreaterThan(1);
      for (const o of vs) {
        expect(o.title).toMatch(/Brown \//);
      }

      const x = getProductSelection(p, p.variants.edges[0].node);
      assert(x);
      expect(x).toStrictEqual({ Color: 'Black', Size: '7' });
    });
  });

  it('getCollection', async () => {
    const req: GetCollectionRequest = {
      handle: 'latest-stuff'
    };
    const r: GetCollectionResult = await store.dispatch(getCollection(req));
    assert(r);
    expect(r.error).toBeUndefined();
    assert(r.collection);
    expect(r.collection.title).toBeDefined();
    expect(r.collection.description).toBeDefined();
    expect(r.collection.descriptionHtml).toBeDefined();
    expect(r.collection.products).toBeDefined();
    expect(r.collection.products.edges.length).toBeGreaterThan(0);
  });

  it('getCollections', async () => {
    const r: GetCollectionsResult = await store.dispatch(getCollections({}));
    assert(r);
    expect(r.error).toBeDefined(); // Requires admin
  });

  describe('getCountries', () => {
    it('Get a list of countries', async () => {
      const r: Array<Country> = await store.dispatch(getCountries({ locale: 'en_US' }));
      assert(r);
      expect(r.length).toBeGreaterThan(10);
      console.log(r[0]);
    });
  });

  describe('getCountry', () => {
    it('Get a country', async () => {
      const r: Country = await store.dispatch(getCountry({ locale: 'sv_SE', countryCode: 'US' }));
      assert(r);
      expect(r.code).toBe('US');
      expect(r.name).toBe('USA');
    });
  });

  describe('getAddressFields', () => {
    it('Get address fields for a country', async () => {
      const r: AddressFieldName[][] = await store.dispatch(getAddressFields({ locale: 'sv_SE', countryCode: 'US' }));
      assert(r);
      expect(r.length).toBeGreaterThan(2);
      console.log(r);
    });
  });

  describe('MoneyV2', () => {
    it('toMoneyV2 ', () => {
      let r = toMoneyV2(1.666666, 'SEK');
      expect(r).toBeDefined();
      expect(r.currencyCode).toBe('SEK');
      expect(r.amount).toBe('1.67');

      r = toMoneyV2(1.666666, 'JPY');
      expect(r).toBeDefined();
      expect(r.currencyCode).toBe('JPY');
      expect(r.amount).toBe('2');
    });
  });

  describe('Product types', () => {
    it('getProductTypeRoots ', () => {
      expect(getProductTypeRoots(undefined)).toStrictEqual([]);
      expect(getProductTypeRoots(null)).toStrictEqual([]);
      expect(getProductTypeRoots([])).toStrictEqual([]);
      expect(getProductTypeRoots(['a', 'b'])).toStrictEqual(['a', 'b']);
      expect(getProductTypeRoots(['a', 'a/a1', 'b', 'b/b2'])).toStrictEqual(['a', 'b']);
      expect(getProductTypeRoots(['a', 'a/b/c'])).toStrictEqual(['a']);
    });

    it('getParentProductType ', () => {
      expect(getParentProductType(undefined)).toBeNull();
      expect(getParentProductType(null)).toBeNull();
      expect(getParentProductType('a')).toBeNull();
      expect(getParentProductType('a/b')).toBe('a');
      expect(getParentProductType('a/b/c')).toBe('a/b');
    });
  });

  /*
  describe('createCheckout', () => {
    it('Creates a checkout', async () => {
      await store.dispatch(
        setConfiguration({
          server: 'https://localhost:8443',
          contextPath: '/stackend'
        })
      );

      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'bruka-design'
        })
      );

      const r = await store.dispatch(
        createCheckout({
          input: {
            email: 'jens+test@josh.se',
            note: 'test',
            lineItems: [{ quantity: 1, variantId: '' }],
            shippingAddress: {
              firstName: 'Test',
              lastName: 'Testsson',
              address1: 'Street',
              zip: '123',
              city: 'Stockholm',
              country: 'Sweden'
            }
          }
        })
      );
      assert(r);
      console.log(r);
    });
  });
   */
});
