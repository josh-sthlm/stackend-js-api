//@flow

import { listForums } from '../src/forum';

describe('Forum', () => {
  describe('listForums', () => {
    it('Ensures forum module compiled', () => {
      expect(listForums).toBeDefined();
    });
  });
});
