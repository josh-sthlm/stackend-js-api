//@flow

import { emptyPaginatedCollection, newPaginatedCollection } from '../src/api/PaginatedCollection';

describe('PaginatedCollection', () => {
  describe('newPaginatedCollection', () => {
    it('new', () => {
      const entries = [1, 2, 3];
      let c = newPaginatedCollection({ entries, page: 2, pageSize: 5, totalSize: 8 });
      expect(c).toBeDefined();
      expect(c.entries).toStrictEqual(entries);
      expect(c.page).toEqual(2);
      expect(c.pageSize).toEqual(5);
      expect(c.totalSize).toEqual(8);

      c = newPaginatedCollection({ entries: [], page: 1, pageSize: 5, totalSize: 0 });
      expect(c).toBeDefined();
      expect(c.entries).toStrictEqual([]);
      expect(c.page).toEqual(1);
      expect(c.pageSize).toEqual(5);
      expect(c.totalSize).toEqual(0);
    });
  });

  describe('newPaginatedCollection', () => {
    const c = emptyPaginatedCollection(3);
    expect(c).toBeDefined();
    expect(c.entries).toStrictEqual([]);
    expect(c.page).toEqual(1);
    expect(c.pageSize).toEqual(3);
    expect(c.totalSize).toEqual(0);
  });
});
