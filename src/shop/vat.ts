import { getJson, getJsonErrorText, Thunk, XcapJsonResult } from '../api';
import { ShopState } from './shopReducer';
import { Checkout, MoneyV2, Product, ProductVariant, SlimProduct } from './index';
import { forEachGraphQLList } from '../util/graphql';
import { getProductAndVariant, setCommunityVATS, setCustomerVatInfo } from './shopActions';
import { getCountryCode } from '../util/getCountryCode';

export enum TradeRegion {
  /** Domestic trade */
  NATIONAL = 'national',

  /** Trade within EU, etc */
  REGIONAL = 'regional',

  /** Trade with the rest, etc */
  WORLDWIDE = 'worldwide'
}

export enum CustomerType {
  CONSUMER = 'b2c',
  BUSINESS = 'b2b'
}

/**
 * Format 1.25 as 25%
 * @param vatMultiplier
 */
export function formatVatPercentage(vatMultiplier: number): string {
  return vatMultiplierToPercent(vatMultiplier) + '%';
}

/**
 * Convert a vat multiplier to a percentage
 * @param vatMultiplier
 */
export function vatMultiplierToPercent(vatMultiplier: number): number {
  return Math.round(100 * (vatMultiplier - 1));
}

/**
 * Convert a percentage (25%) to a vat multiplier (1.25)
 * @param percent
 */
export function percentToVatMultiplier(percent: number): number {
  return 1 + percent / 100;
}

export enum VatType {
  STANDARD = 'standardRate',
  REDUCED = 'reducedRate',
  REDUCED_ALT = 'reducedRateAlt',
  SUPER_REDUCED = 'superReducedRate',
  PARKING = 'parkingRate'
}

/** National vat rates in percent or null if not applicable */
export interface NationalVatRates {
  /** ISO country code */
  countryCode: string;
  country: string;
  /** The local name of the VAT */
  vatName: string;
  vatAbbreviatedName: string;
  standardRate: number | null;
  reducedRate: number | null;
  reducedRateAlt: number | null;
  superReducedRate: number | null;
  parkingRate: number | null;
}

export interface GetVatsResult extends XcapJsonResult {
  shopCountryCode: string;
  vats: NationalVatRates;
}

/**
 * Get VATs for a country. Will try to use the stacks default country if not specified.
 * @param shopCountryCode
 * @returns {Thunk<XcapJsonResult>}
 */
export function getVats({ shopCountryCode }: { shopCountryCode?: string }): Thunk<Promise<GetVatsResult>> {
  return getJson({
    url: '/shop/vat/get-vats',
    parameters: arguments
  });
}

export interface ListVatsResult extends XcapJsonResult {
  vats: Array<NationalVatRates>;
}

/**
 * Get all supported VATs.
 * @returns {Thunk<XcapJsonResult>}
 */
export function listVats(): Thunk<Promise<ListVatsResult>> {
  return getJson({
    url: '/shop/vat/list',
    parameters: arguments
  });
}

export interface VatCountry {
  countryCode: string;
  name: string;
}

export interface ListCountriesResult extends XcapJsonResult {
  countries: Array<VatCountry>;
}
/**
 * Get all countries.
 * @returns {Thunk<ListCountriesResult>}
 */
export function listCountries(): Thunk<Promise<ListCountriesResult>> {
  return getJson({
    url: '/shop/vat/list-countries',
    parameters: arguments
  });
}

export interface GetTradeRegionResult extends XcapJsonResult {
  tradeRegion: TradeRegion;
  customerCountryCode: string;
  shopCountryCode: string;
}

/**
 * Get the trade region
 * @returns {Thunk<XcapJsonResult>}
 */
export function getTradeRegion({
  customerCountryCode,
  shopCountryCode
}: {
  customerCountryCode: string;
  shopCountryCode?: string;
}): Thunk<Promise<GetTradeRegionResult>> {
  return getJson({
    url: '/shop/vat/get-trade-region',
    parameters: arguments
  });
}

/**
 * Should VATs be used?
 * @param shopState
 * @param customerType
 * @param tradeRegion
 */
export function useVATS({
  shopState,
  customerType,
  tradeRegion
}: {
  shopState: ShopState;
  customerType?: CustomerType;
  tradeRegion?: TradeRegion;
}): boolean {
  if (!shopState.vats || !shopState.vats.showPricesUsingVAT) {
    return false;
  }

  const typeOfCustomer = customerType || shopState.vats.customerType || CustomerType.CONSUMER;
  const region = tradeRegion || shopState.vats.customerTradeRegion || TradeRegion.NATIONAL;

  if (
    /* No VAT charged to international customers */
    region === TradeRegion.WORLDWIDE ||
    /* No VAT charged to b2b customer within the region */
    (region == TradeRegion.REGIONAL && typeOfCustomer == CustomerType.BUSINESS)
  ) {
    return false;
  }

  return true;
}

/**
 * Get the vat
 * @param shopState
 * @param product
 * @param productVariant
 * @param customerType
 * @param tradeRegion
 * @param quantity Optional quantity, defaults to 1
 */
export function getPriceIncludingVAT({
  shopState,
  product,
  productVariant,
  customerType,
  tradeRegion,
  quantity = 1
}: {
  shopState: ShopState;
  product: SlimProduct | Product;
  productVariant?: ProductVariant | null;
  customerType?: CustomerType;
  tradeRegion?: TradeRegion;
  quantity?: number;
}): MoneyV2 {
  let price: MoneyV2 | null = null;
  if (productVariant) {
    price = productVariant.priceV2;
  } else {
    price = product.priceRange.minVariantPrice; //getLowestVariantPrice(product);
  }

  if (!useVATS({ shopState, customerType, tradeRegion })) {
    return multiplyPrice(price, quantity);
  }

  // Check if there is a VAT exception for any of the collections the product belongs to
  const vatType: VatType = getVATType(shopState, product);

  return applyVat(shopState, vatType, price, quantity);
}

/**
 * Apply VAT to the price
 * @param shopState
 * @param vatType
 * @param price
 * @param quantity
 */
export function applyVat(shopState: ShopState, vatType: VatType, price: MoneyV2, quantity = 1): MoneyV2 {
  if (!shopState.vats) {
    return multiplyPrice(price, quantity);
  }

  if (!shopState.vats.vatRates) {
    console.warn('Stackend: VAT rates not available.');
    return multiplyPrice(price, quantity);
  }

  let rate = shopState.vats.vatRates[vatType];
  if (!rate) {
    rate = shopState.vats.vatRates[VatType.STANDARD];
    if (!rate) {
      return multiplyPrice(price, quantity);
    }
  }

  if (typeof rate !== 'number') {
    return multiplyPrice(price, quantity);
  }

  return multiplyPrice(price, quantity * (1 + rate / 100));
}

export function multiplyPrice(price: MoneyV2, factor: number): MoneyV2 {
  if (factor === 1) {
    return price;
  }

  return {
    amount: String(parseFloat(price.amount) * factor),
    currencyCode: price.currencyCode
  };
}

/**
 * Get the vat type for a product
 * @param shopState
 * @param product
 */
export function getVATType(shopState: ShopState, product: SlimProduct): VatType {
  let vatType = VatType.STANDARD;
  const vats = shopState.vats;

  if (vats && product && product.collections) {
    forEachGraphQLList(product.collections, i => {
      const v = vats.overrides[i.handle];
      if (v) {
        vatType = v;
      }
    });
  }

  return vatType;
}

/**
 * Get the total price for a checkout
 * @param shopState
 * @param checkout
 * @param customerType
 * @param tradeRegion
 */
export function getTotalPriceIncludingVAT({
  shopState,
  checkout,
  customerType,
  tradeRegion
}: {
  shopState: ShopState;
  checkout: Checkout;
  customerType?: CustomerType;
  tradeRegion?: TradeRegion;
}): MoneyV2 {
  let total = 0;
  forEachGraphQLList(checkout.lineItems, i => {
    const pv = getProductAndVariant(shopState, i);
    if (pv) {
      const p = getPriceIncludingVAT({
        shopState,
        product: pv.product,
        productVariant: pv.variant,
        quantity: i.quantity,
        customerType,
        tradeRegion
      });
      total += parseFloat(p.amount);
    }
  });

  return {
    amount: String(total),
    currencyCode: checkout.currencyCode
  };
}

/**
 * Set the customers country code and update trade region accordingly
 * @param customerCountryCode
 */
export function setCustomerCountryCode(customerCountryCode: string): Thunk<Promise<void>> {
  return async (dispatch: any, getState): Promise<void> => {
    let { shop, communities } = getState();

    if (!shop.vats) {
      if (!communities.community) {
        throw 'No current community';
      }
      dispatch(setCommunityVATS(communities.community));
      shop = getState();
      if (!shop.vats) {
        console.error('No VAT data available');
        return;
      }
    }

    const shopCountryCode = shop.vats.shopCountryCode || getCountryCode(communities.community.locale || 'EN');

    customerCountryCode = customerCountryCode.toUpperCase();
    let tradeRegion = TradeRegion.NATIONAL;
    if (customerCountryCode === shopCountryCode) {
      tradeRegion = TradeRegion.NATIONAL;
    } else {
      const r = await dispatch(getTradeRegion({ customerCountryCode }));
      if (r.error) {
        console.error('Stackend: failed to get trade region: ' + getJsonErrorText(r));
        return;
      }
      tradeRegion = r.tradeRegion;
    }

    dispatch(setCustomerVatInfo(customerCountryCode, tradeRegion, shop.vats.customerType || CustomerType.CONSUMER));
  };
}
