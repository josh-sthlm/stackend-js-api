import {
  emptyPaginatedCollection,
  newPaginatedCollection,
  newPaginatedCollectionForPage
} from '../src/api/PaginatedCollection';

describe('PaginatedCollection', () => {
  describe('emptyPaginatedCollection', () => {
    it('create empty', () => {
      const c = emptyPaginatedCollection(3);
      expect(c).toBeDefined();
      expect(c.entries).toStrictEqual([]);
      expect(c.page).toEqual(1);
      expect(c.pageSize).toEqual(3);
      expect(c.totalSize).toEqual(0);
      expect(c.firstPage).toEqual(1);
      expect(c.lastPage).toEqual(1);
      expect(c.hasNextPage).toBeFalsy();
      expect(c.hasPreviousPage).toBeFalsy();
      expect(c.nextPage).toEqual(1); // FIXME: Questionable
      expect(c.previousPage).toEqual(1);
    });
  });

  describe('newPaginatedCollection', () => {
    it('Defaults', () => {
      const entries = [1, 2, 3];
      const c = newPaginatedCollection({ entries });
      expect(c).toBeDefined();
      expect(c.entries).toStrictEqual(entries);
      expect(c.page).toEqual(1);
      expect(c.pageSize).toEqual(10);
      expect(c.totalSize).toEqual(3);
      expect(c.firstPage).toEqual(1);
      expect(c.lastPage).toEqual(1);
      expect(c.hasNextPage).toBeFalsy();
      expect(c.hasPreviousPage).toBeFalsy();
      expect(c.nextPage).toEqual(1); // FIXME: Questionable
      expect(c.previousPage).toEqual(1);
    });

    it('empty page', () => {
      const c = newPaginatedCollection({ entries: [], page: 1, pageSize: 5, totalSize: 0 });
      expect(c).toBeDefined();
      expect(c.entries).toStrictEqual([]);
      expect(c.page).toEqual(1);
      expect(c.pageSize).toEqual(5);
      expect(c.totalSize).toEqual(0);
      expect(c.firstPage).toEqual(1);
      expect(c.lastPage).toEqual(1);
      expect(c.hasNextPage).toBeFalsy();
      expect(c.hasPreviousPage).toBeFalsy();
      expect(c.nextPage).toEqual(1); // FIXME: Questionable
      expect(c.previousPage).toEqual(1);
    });

    it('first page', () => {
      const entries = [1, 2, 3];
      const c = newPaginatedCollection({ entries, page: 1, pageSize: 5, totalSize: 8 });
      expect(c).toBeDefined();

      expect(c.entries).toStrictEqual(entries);
      expect(c.page).toEqual(1);
      expect(c.pageSize).toEqual(5);
      expect(c.totalSize).toEqual(8);
      expect(c.firstPage).toEqual(1);
      expect(c.lastPage).toEqual(2);
      expect(c.hasNextPage).toBeTruthy();
      expect(c.hasPreviousPage).toBeFalsy();
      expect(c.nextPage).toEqual(2);
      expect(c.previousPage).toEqual(1);
    });

    it('last page', () => {
      const entries = [1, 2, 3];
      const c = newPaginatedCollection({ entries, page: 2, pageSize: 5, totalSize: 8 });
      expect(c).toBeDefined();

      expect(c.entries).toStrictEqual(entries);
      expect(c.page).toEqual(2);
      expect(c.pageSize).toEqual(5);
      expect(c.totalSize).toEqual(8);
      expect(c.firstPage).toEqual(1);
      expect(c.lastPage).toEqual(2);
      expect(c.hasNextPage).toBeFalsy();
      expect(c.hasPreviousPage).toBeTruthy();
      expect(c.nextPage).toEqual(1); // FIXME: Questionable
      expect(c.previousPage).toEqual(1);
    });
  });

  describe('newPaginatedCollectionForPage', () => {
    const allEntries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    it('page 2', () => {
      const c = newPaginatedCollectionForPage({ entries: allEntries, page: 2, pageSize: 3 });
      expect(c).toBeDefined();
      expect(c.entries).toStrictEqual([4, 5, 6]);
      expect(c.page).toEqual(2);
      expect(c.pageSize).toEqual(3);
      expect(c.totalSize).toEqual(allEntries.length);
      expect(c.firstPage).toEqual(1);
      expect(c.lastPage).toEqual(4);
      expect(c.hasNextPage).toBeTruthy();
      expect(c.hasPreviousPage).toBeTruthy();
      expect(c.nextPage).toEqual(3);
      expect(c.previousPage).toEqual(1);
    });

    it('last page', () => {
      const c = newPaginatedCollectionForPage({ entries: allEntries, page: 4, pageSize: 3 });
      expect(c).toBeDefined();
      expect(c.entries).toStrictEqual([10]);
      expect(c.page).toEqual(4);
      expect(c.pageSize).toEqual(3);
      expect(c.totalSize).toEqual(allEntries.length);
      expect(c.firstPage).toEqual(1);
      expect(c.lastPage).toEqual(4);
      expect(c.hasNextPage).toBeFalsy();
      expect(c.hasPreviousPage).toBeTruthy();
      expect(c.nextPage).toEqual(1); // FIXME: Questionable
      expect(c.previousPage).toEqual(3);
    });
  });
});
