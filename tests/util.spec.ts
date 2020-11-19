import { generateClassName, getCurrencyFormatter, getStackendLocale, hash } from '../src/util';
import createTestStore from './setup';
import assert from 'assert';
import { initialize } from '../src/api/actions';

describe('Util', () => {
  const store = createTestStore();

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
      expect(generateClassName('Apan Ola')).toBe('apan-ola');
    });
  });

  describe('getStackendLocale', () => {
    it('Gets a stackend supported locale', () => {
      expect(getStackendLocale()).toBe('en_US');
      expect(getStackendLocale(null)).toBe('en_US');
      expect(getStackendLocale('')).toBe('en_US');
      expect(getStackendLocale('sv')).toBe('sv_SE');
      expect(getStackendLocale('de')).toBe('de_DE');
      expect(getStackendLocale('fi')).toBe('fi_FI');

      expect(getStackendLocale('dk')).toBe('en_US');
      expect(getStackendLocale('sv_FI')).toBe('sv_SE');
    });
  });

  describe('getCurrencyFormatter', () => {
    it('Get a currency formatter', async () => {
      const f: Intl.NumberFormat = store.dispatch(getCurrencyFormatter('SEK'));
      assert(f);
      expect(f.format(1.6666)).toBe('SEK 1.67');

      expect(f === store.dispatch(getCurrencyFormatter('SEK'))).toBeTruthy(); // Should be cached
      expect(f === store.dispatch(getCurrencyFormatter('SEK', 'en-US'))).toBeTruthy(); // Should be cached

      const f2: Intl.NumberFormat = store.dispatch(getCurrencyFormatter('SEK', 'sv_SE'));
      assert(f2);
      expect(f2.format(1.6666)).toBe('SEK 1.67');
      expect(f !== f2).toBeTruthy(); // Should not be cached

      // FIXME: Apparently, node does not have fi_FI and fall back to system locale. Why?
      await store.dispatch(initialize({ permalink: 'husdjur' }));
      const f3: Intl.NumberFormat = store.dispatch(getCurrencyFormatter('SEK'));
      expect(f !== f3).toBeTruthy(); // Should use fi_FI
      console.log(f3.resolvedOptions());
    });
  });
});
