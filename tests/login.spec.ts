import { login } from '../src/login';

describe('Login', () => {
  describe('Compile', () => {
    it('Check that login compiles', async () => {
      expect(login).toBeDefined();
    });
  });
});
