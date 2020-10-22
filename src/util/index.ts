//@flow
import deburr from 'lodash/deburr';

/**
 * Generate a class name
 * @param s
 */
export function generateClassName(s: string | null | undefined): string {
  if (!s) {
    return '0';
  }

  let c: string = deburr(s);
  c = c
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-');

  if (c) {
    return c;
  }

  return '' + hash(c);
}

/**
 * Calculate a hash number from a string
 * @param s
 */
export function hash(s: string | null | undefined): number {
  if (!s) {
    return 0;
  }

  let hash = 0;
  let chr;

  for (let i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}

const STACKEND_LOCALES_BY_LANGUAGE: { [language: string]: string } = {
  sv: 'sv_SE',
  fi: 'fi_FI',
  de: 'de_DE',
  en: 'en_US'
};

/**
 * Get a stackend supported locale given the corresponding language code
 * @param language
 */
export function getStackendLocale(language?: string | null): string {
  if (!language) {
    return 'en_US';
  }

  let l = language.replace('-', '_');
  if (l.indexOf('_')) {
    l = l.split('_')[0];
  }

  l = STACKEND_LOCALES_BY_LANGUAGE[l.toLowerCase()];
  return l || 'en_US';
}
