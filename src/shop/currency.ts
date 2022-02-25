import { MoneyV2 } from './index';
import { RECEIVE_CURRENCY, ShopState } from './shopReducer';
import { Thunk } from '../api';

export interface CurrencyInfo {
  code: string;

  /** Name of the currency */
  name: string;

  /* Number of ¢ in € */
  subunitToUnit: number;
  /* Smallest number of subunitToUnit */
  smallestDenomination: number;
}

/**
 * Get currency info from the redux store
 * @param shop
 * @param currencyCode
 */
export function getCurrencyInfo(shop: ShopState, currencyCode: string): CurrencyInfo | null {
  if (!currencyCode) {
    return null;
  }
  const cc = currencyCode.toUpperCase();
  return shop.currencies[cc] || null;
}

/**
 * Request currency info if missing
 * @param currencyCode
 * @param forceReload
 */
export function requestCurrencyInfo(currencyCode: string, forceReload?: boolean): Thunk<Promise<CurrencyInfo | null>> {
  return async (dispatch: any, getState): Promise<CurrencyInfo | null> => {
    if (!currencyCode) {
      return null;
    }

    const cc = currencyCode.toUpperCase();
    if (typeof forceReload === 'undefined' || !forceReload) {
      const { shop } = getState();
      const ci = shop.currencies[cc];
      if (ci) {
        return ci;
      }
    }

    const ci = CURRENCY_DATA[cc];
    if (ci) {
      dispatch({
        type: RECEIVE_CURRENCY,
        currency: ci
      });
      return ci;
    }

    /* FIXME: Implement this
    const r = await dispatch(fetchCurrencyInfo({ currencyCode: cc }));
    if (!r.error) {
      dispatch({
        type: RECEIVE_CURRENCY,
        currency: r.currency
      });
      return ci;
    }
     */

    return null;
  };
}

/*
export interface GetCurrencyInfoResult extends XcapJsonResult {
  currency: CurrencyInfo;
}

export function fetchCurrencyInfo({ currencyCode }: { currencyCode: string }): Thunk<Promise<GetCurrencyInfoResult>> {
  return getJson({
    url: '/shop/currency/get',
    parameters: arguments
  });
}
*/

/**
 *
 * @param shop
 * @param money
 */
export function roundToMinimalFractionalUnit(shop: ShopState, money: MoneyV2): MoneyV2 {
  const ci = getCurrencyInfo(shop, money.currencyCode);
  if (!ci) {
    return money;
  }

  const v = parseFloat(money.amount) * ci.subunitToUnit;
  const r = v % ci.smallestDenomination;
  const roundUp = Math.round(r / ci.smallestDenomination) >= 0.5;
  const rounded = (v - r + (roundUp ? ci.smallestDenomination : 0)) / ci.subunitToUnit;

  return {
    amount: String(rounded),
    currencyCode: money.currencyCode
  };
}

// Some hardcoded data. CAD is useful for the shopify test shop
const CURRENCY_DATA: { [currencyCode: string]: CurrencyInfo } = {
  EUR: {
    code: 'EUR',
    name: 'Euro',
    subunitToUnit: 100,
    smallestDenomination: 1
  },
  USD: {
    code: 'USD',
    name: 'United States Dollar',
    subunitToUnit: 100,
    smallestDenomination: 1
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    subunitToUnit: 100,
    smallestDenomination: 5
  },
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    subunitToUnit: 100,
    smallestDenomination: 100
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    subunitToUnit: 100,
    smallestDenomination: 100
  }
};
