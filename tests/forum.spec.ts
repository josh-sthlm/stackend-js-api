//@flow

import createTestStore from './setup-redux';

import { listForums } from '../src/forum'


describe('Forum', () => {
  const store = createTestStore();

  describe("listForums", () => {
    it("Ensures forum module compiled", () => {
      expect(listForums).toBeDefined();
    });
  });


});


