//@flow

import createTestStore from './setup-redux';

import { COMMUNITY_PARAMETER } from '../src/api'
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend'
import { listForums } from '../src/forum'


describe('Forum', () => {
  let store = createTestStore();

  describe("listForums", () => {
    it("Ensures forum module compiled", () => {
      expect(listForums).toBeDefined();
    });
  });


});


