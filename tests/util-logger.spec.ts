import { ConsoleLogger } from '../src/util/Logger';

const OBJ = {
  a: 1,
  b: 'two'
};
describe('Util', () => {
  describe('ConsoleLogger', () => {
    it('message', () => {
      const l = new ConsoleLogger('test');
      l.log('log');
      l.debug('debug');
      l.info('info', undefined);
      l.warn('warn', 1, true, OBJ);
      l.error('error', 1, true, OBJ);
    });

    it('getMessage', () => {
      const l = new ConsoleLogger('test');
      const x = l.getMessage('hello');
      expect(x).toEqual('test: hello');
      console.log(x);
    });
  });
});
