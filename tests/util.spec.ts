import { generateClassName, hash } from '../src/util';

describe('Util', () => {
  describe('hash', () => {
    it('Calculate a hash', () => {
      expect(hash(null)).toBe(0);
      expect(hash('')).toBe(0);
      expect(hash(undefined)).toBe(0);
      expect(hash('abc')).toBe(96354);
      expect(hash('cba')).toBe(98274);
    });
  });

  describe('generateClassName', () => {
    it('Creates a new tree node', () => {
      expect(generateClassName(null)).toBe('0');
      expect(generateClassName(undefined)).toBe('0');
      expect(generateClassName('')).toBe('0');
      expect(generateClassName('räksmörgås')).toBe('raksmorgas');
      expect(generateClassName('a b & c')).toBe('a-b-c');
    });
  });
});
