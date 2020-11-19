//@flow
import deburr from 'lodash/deburr';
import { isRunningInBrowser, State, Thunk } from '../api';
import get from 'lodash/get';
import { STACKEND_COMMUNITY } from '../stackend';

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

/**
 * Get a local storage key name prefixed with the current community permalink
 * @param name
 */
export function getLocalStorageKey(name: string): Thunk<string> {
  return (dispatch, getState): string => {
    return _getLocalStorageKey(getState(), name);
  };
}

/**
 * Get a local storage key name prefixed with the current community permalink
 * @param state
 * @param name
 */
export function _getLocalStorageKey(state: State, name: string): string {
  return get(state, 'communities.community.permalink', STACKEND_COMMUNITY) + '-' + name;
}

/**
 * Store any object in local storage under a community unique key
 * @param name
 * @param value
 */
export function setLocalStorageItem(name: string, value: string): Thunk<void> {
  return (dispatch: any): void => {
    if (isRunningInBrowser()) {
      const key = dispatch(getLocalStorageKey(name));
      localStorage.setItem(key, value);
    }
  };
}

/**
 * Get any object from local storage using a community unique key
 * @param name
 */
export function getLocalStorageItem(name: string): Thunk<string | null> {
  return (dispatch: any): string | null => {
    if (isRunningInBrowser()) {
      const key = dispatch(getLocalStorageKey(name));
      return localStorage.getItem(key);
    }
    return null;
  };
}

/**
 * Remove an object from local storage using a community unique key
 * @param name
 */
export function removeLocalStorageItem(name: string): Thunk<void> {
  return (dispatch: any): void => {
    if (isRunningInBrowser()) {
      const key = dispatch(getLocalStorageKey(name));
      localStorage.removeItem(key);
    }
  };
}

/**
 * An email validation regular expression that covers most cases without
 * being to costly to evaluate. Not 100% correct, but covers most use cases.
 */
export const EMAIL_VALIDATION_REGEXP_RELAXED = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CURRENCY_FORMATTERS: { [key: string]: Intl.NumberFormat } = {};

/**
 * Get a (cached) currency formatter.
 * @param currencyCode
 * @param locale Optional locale. Falls back to current community locale or "en-US" if no community is loaded.
 */
export function getCurrencyFormatter(currencyCode: string, locale?: string): Thunk<Intl.NumberFormat> {
  return (dispatch, getState: any): Intl.NumberFormat => {
    if (!locale) {
      const community = getState()?.communities?.community;
      locale = getStackendLocale(community?.locale);
    }

    locale = locale.replace('_', '-');

    const key = currencyCode.toUpperCase() + ';' + locale.toUpperCase();
    let formatter = CURRENCY_FORMATTERS[key];
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode
      });
      CURRENCY_FORMATTERS[key] = formatter;
    }

    return formatter;
  };
}
