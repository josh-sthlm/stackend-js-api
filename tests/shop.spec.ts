import assert from 'assert';
import { Basket } from '../src/shop';

describe('Shop', () => {
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
  });
});
