import assert from 'assert';
import {
  Basket, createCheckout,
  findAllProductVariants,
  findExactProductVariant,
  forEachProductVariant,
  getLowestVariantPrice,
  getNextCursor,
  getPreviousCursor,
  getProduct,
  GetProductResult,
  getProductSelection,
  getProductVariant,
  getVariantImage,
  listProducts,
  ListProductsRequest,
  ListProductsResult,
  mapProductVariants,
  ProductSelection,
  ProductSortKeys
} from "../src/shop";
import createTestStore from './setup';
import { getBasket, storeBasket } from '../src/shop/shopActions';
import { ShopState } from '../src/shop/shopReducer';
import { loadInitialStoreValues } from '../src/api/actions';
import { setConfiguration } from "../src/api";

describe('Shop', () => {
  const store = createTestStore();

  describe('Basket', () => {
    it('Add/remove/find/toString', () => {
      const b = new Basket();

      expect(b.toString()).toBe('{"items":[]}');

      b.add('test');
      expect(b.toString()).toBe('{"items":[{"handle":"test","quantity":1}]}');

      b.add('test', undefined, 2);
      expect(b.toString()).toBe('{"items":[{"handle":"test","quantity":3}]}');

      b.add('test', 'korv');
      expect(b.toString()).toBe(
        '{"items":[{"handle":"test","quantity":3},{"handle":"test","variant":"korv","quantity":1}]}'
      );

      expect(b.find('apa')).toBeNull();
      expect(b.find('test')).toBeDefined();
      expect(b.find('test', 'apa')).toBeNull();
      expect(b.find('test', 'korv')).toBeDefined();

      b.remove('test', 'korv');
      expect(b.toString()).toBe('{"items":[{"handle":"test","quantity":3}]}');

      b.remove('test');
      expect(b.toString()).toBe('{"items":[{"handle":"test","quantity":2}]}');

      b.remove('test', undefined, 5);
      expect(b.toString()).toBe('{"items":[]}');
    });

    it('fromString', () => {
      const b = Basket.fromString(
        '{"items":[{"handle":"test","quantity":3},{"handle":"test","variant":"korv","quantity":1}]}'
      );
      assert(b);
      expect(b.items.length).toBe(2);
      expect(b.items[0].handle).toBe('test');
      expect(b.items[0].variant).toBeUndefined();
      expect(b.items[0].quantity).toBe(3);
      expect(b.items[1].handle).toBe('test');
      expect(b.items[1].variant).toBe('korv');
      expect(b.items[1].quantity).toBe(1);
    });

    it('get/store', () => {
      const basket: Basket = store.dispatch(getBasket());
      assert(basket);
      basket.add('test');

      let shop: ShopState = store.getState().shop;
      const basketUpdated = shop.basketUpdated;

      store.dispatch(storeBasket(basket));
      shop = store.getState().shop;
      expect(shop.basketUpdated).toBeGreaterThan(basketUpdated);
    });
  });

  describe('Product', () => {
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
      expect(img.transformedSrc).toBeDefined();
      expect(img.altText).toBeDefined();

      const vp = getLowestVariantPrice(p);
      assert(vp);
      expect(vp.currencyCode).toBeDefined();
      expect(vp.amount).toBeDefined();
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

  describe('createCheckout', () => {
    it('Creates a checkout', async () => {
      await store.dispatch(setConfiguration({
        server: "https://localhost:8443",
        contextPath: "/stackend"
      }));

      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'bruka-design'
        })
      );

      const r = await store.dispatch(createCheckout({
        input: {
          email: "jens+test@josh.se",
          note: 'test',
          lineItems: [{ quantity: 1, variantId: ''}],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'Testsson',
            address1: 'Street',
            zip: '123',
            city: 'Stockholm',
            country: 'Sweden'
          }
        }
      }));
      assert(r);
      console.log(r);
    });
  });
});
