import { cartAdd, cartRemove } from '../src/shop/shopActions';
import createTestStore from './setup';
import { loadInitialStoreValues } from '../src/api/actions';
import { ShopState } from '../src/shop/shopReducer';
import assert from 'assert';

describe('Shop Cart Actions/Reducers', () => {
  const store = createTestStore();

  describe('Setup', () => {
    it('Setup', async () => {
      await store.dispatch(
        loadInitialStoreValues({
          permalink: 'husdjur',
          productHandles: [
            'pin-boot', // already loaded
            'hanra-shirt'
          ]
        })
      );
    });
  });

  describe('cartAdd/remove', () => {
    it('Add items to the cart', async () => {
      let shop: ShopState = store.getState().shop;
      assert(shop);
      const p = shop.products['pin-boot'];
      let r = await store.dispatch(cartAdd(p, p.variants.edges[0].node));
      expect(r.error).toBeUndefined();
      assert(r.cart);
      console.log(r.cart.lines.edges);
      expect(r.cart.lines.edges.length).toBe(1);
      shop = store.getState().shop;
      assert(shop.cart);
      expect(shop.cart.id).toBe(r.cart.id);
      let l = shop.cart.lines.edges[0].node;
      console.log(l);
      expect(l.merchandise).toStrictEqual({ id: p.variants.edges[0].node.id, product: { handle: p.handle, id: p.id } });
      expect(l.quantity).toStrictEqual(1);

      // Add a few more one
      r = await store.dispatch(cartAdd(p, p.variants.edges[0].node, 2));
      expect(r.error).toBeUndefined();
      assert(r.cart);
      expect(r.cart.id).toBe(shop.cart.id); // Same cart
      shop = store.getState().shop;
      assert(shop.cart);
      l = shop.cart.lines.edges[0].node;
      console.log(l);
      expect(l.merchandise).toStrictEqual({ id: p.variants.edges[0].node.id, product: { handle: p.handle, id: p.id } });
      expect(l.quantity).toStrictEqual(3);
    });

    it('Removes items from the cart', async () => {
      let shop: ShopState = store.getState().shop;
      assert(shop);
      const p = shop.products['pin-boot'];
      let r = await store.dispatch(cartRemove(p, p.variants.edges[0].node, 2));
      expect(r.error).toBeUndefined();
      assert(r.cart);
      expect(r.cart.id).toBe(shop.cart?.id); // Same cart
      shop = store.getState().shop;
      assert(shop.cart);
      const l = shop.cart.lines.edges[0].node;
      console.log(l);
      expect(l.merchandise).toStrictEqual({ id: p.variants.edges[0].node.id, product: { handle: p.handle, id: p.id } });
      expect(l.quantity).toStrictEqual(1);

      // Remove last one
      r = await store.dispatch(cartRemove(p, p.variants.edges[0].node));
      expect(r.error).toBeUndefined();
      assert(r.cart);
      expect(r.cart.id).toBe(shop.cart?.id); // Same cart
      expect(r.cart.lines.edges.length).toBe(0);
      shop = store.getState().shop;
      assert(shop.cart);
      expect(shop.cart.lines.edges.length).toBe(0);
    });
  });
});
