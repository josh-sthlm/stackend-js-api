//@flow

import store from './setup-redux';
import { getEntries } from '../src/blog';

describe('Blog', () => {

  // Ensure setup
  store.getState();

  describe('getEntries', () => {
    it("List entries", async () => {

      let r = await store.dispatch(getEntries({blogId : 1}));
      expect(r.blog).toBeDefined();
      expect(r.resultPaginated).toBeDefined();
      expect(r.resultPaginated.totalSize).toBeGreaterThan(0);

    })
  })
});