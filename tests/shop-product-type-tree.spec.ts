import { getProductTypeLabel } from '../src/shop/shopActions';
import {
  buildProductTypeTree,
  ProductTypeTree,
  getAllProductTypes,
  findProductTypeTreeNode
} from '../src/shop/ProductTypeTree';
import assert from 'assert';

describe('ProductTypeTree', () => {
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
            { name: 'A/B', productType: 'a/b', children: [] },
            { name: 'A/C', productType: 'a/c', children: [] }
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
});
