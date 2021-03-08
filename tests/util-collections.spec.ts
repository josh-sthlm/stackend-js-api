import { getAddedRemoved } from '../src/util/collections';

describe('Util', () => {
  describe('collections', () => {
    it('getAddedRemoved', () => {
      const s1 = new Set<string>();
      const s2 = new Set<string>();
      let r = getAddedRemoved(s1, s2);
      expect(r).toBeDefined();
      expect(r.added).toBeDefined();
      expect(r.removed).toBeDefined();
      expect(r.added.size).toBe(0);
      expect(r.removed.size).toBe(0);

      s1.add('removed');
      s1.add('same');
      s2.add('same');
      s2.add('added');
      r = getAddedRemoved(s1, s2);
      expect(r.added.has('added')).toBeTruthy();
      expect(r.removed.has('removed')).toBeTruthy();
      expect(r.added.size).toBe(1);
      expect(r.removed.size).toBe(1);
    });
  });
});
