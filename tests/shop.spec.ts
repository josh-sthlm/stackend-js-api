import assert from 'assert';
import {
  Basket,
  forEachProductVariant,
  getLowestVariantPrice,
  getProduct,
  GetProductResult,
  getProductVariant,
  getVariantImage,
  mapProductVariants
} from '../src/shop';
import createTestStore from './setup';
import { getBasket, storeBasket } from '../src/shop/shopActions';
import { ShopState } from '../src/shop/shopReducer';
import { loadInitialStoreValues } from '../src/api/actions';

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
      expect(p.description).toBeDefined();
      expect(p.descriptionHtml).toBeDefined();
      expect(p.availableForSale).toBeTruthy();
      expect(p.tags).toBeDefined();
      expect(p.productType).toBeDefined();
      expect(p.createdAt).toBeDefined();
      expect(p.variants).toBeDefined();
      expect(p.images).toBeDefined();

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
  });
});
