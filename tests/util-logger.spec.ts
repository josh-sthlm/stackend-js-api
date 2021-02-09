import { ConsoleLogger, Level } from '../src/util/Logger';

const OBJ = {
  a: 1,
  b: 'two'
};
describe('Util', () => {
  describe('ConsoleLogger', () => {
    it('message', () => {
      const l = new ConsoleLogger('test');
      expect(l.level).toEqual(Level.WARN);
      l.setLevel(Level.DEBUG);
      expect(l.level).toEqual(Level.DEBUG);
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
