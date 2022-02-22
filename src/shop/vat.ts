import { getJson, Thunk, XcapJsonResult } from '../api';
import { ShopState, VatState } from './shopReducer';
import { getLowestVariantPrice, MoneyV2, Product, ProductVariant } from './index';
import { forEachGraphQLList } from '../util/graphql';

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

/**
 * Get the vat for a productCollectionHandle. Follows the VAT setup and falls back to standard vat.
 * @param shopState
 * @param productCollectionHandle
 * @param tradeRegion Override the set trade region
 * @param customerType Override the set customer type
 */
export function getVATMultiplier({
  shopState,
  productCollectionHandle,
  customerType,
  tradeRegion
}: {
  shopState: ShopState;
  productCollectionHandle: string;
  customerType?: CustomerType;
  tradeRegion?: TradeRegion;
}): number {
  if (!shopState.vats || !shopState.vats.showPricesUsingVAT) {
    return 1;
  }

  const typeOfCustomer = customerType || shopState.vats.customerType || CustomerType.CONSUMER;
  const region = tradeRegion || shopState.vats.customerTradeRegion || TradeRegion.NATIONAL;

  if (
    /* No VAT charged to international customers */
    region === TradeRegion.WORLDWIDE ||
    /* No VAT charged to b2b customer within the region */
    (region == TradeRegion.REGIONAL && typeOfCustomer == CustomerType.BUSINESS)
  ) {
    return 1;
  }

  // FIXME: Handle B2B rates

  const vats: VatState = shopState.vats;
  let rate: boolean | number = false;

  // Use an override rate?
  const vatType = vats.overrides[productCollectionHandle];
  if (vatType) {
    rate = vats.vatRates[vatType];
  }

  // Fall back to standard VAT
  if (!rate) {
    rate = vats.vatRates[VatType.STANDARD];
  }

  if (typeof rate === 'number') {
    return 1 + rate / 100;
  }

  return 1;
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
 */
export function getPriceIncludingVAT({
  shopState,
  product,
  productVariant,
  customerType,
  tradeRegion = TradeRegion.NATIONAL
}: {
  shopState: ShopState;
  product: Product;
  productVariant: ProductVariant | null;
  customerType?: CustomerType;
  tradeRegion?: TradeRegion;
}): MoneyV2 | null {
  if (!useVATS({ shopState, customerType, tradeRegion })) {
    if (productVariant) {
      return productVariant.priceV2;
    }
    return getLowestVariantPrice(product);
  }

  let price: MoneyV2 | null = null;
  if (productVariant) {
    price = productVariant.priceV2;
  } else {
    price = getLowestVariantPrice(product);
  }
  if (!price) {
    return null;
  }

  // Check if there is a VAT exception for any of the collections the product belongs to
  const vatType: VatType = getVATType(shopState, product);

  return applyVat(shopState, vatType, price);
}

/**
 * Apply VAT to the price
 * @param shopState
 * @param vatType
 * @param price
 */
export function applyVat(shopState: ShopState, vatType: VatType, price: MoneyV2): MoneyV2 {
  if (!shopState.vats) {
    return price;
  }

  if (!shopState.vats.vatRates) {
    console.warn('Stackend: VAT rates not available.');
    return price;
  }

  let rate = shopState.vats.vatRates[vatType];
  if (!rate) {
    rate = shopState.vats.vatRates[VatType.STANDARD];
    if (!rate) {
      return price;
    }
  }

  if (typeof rate !== 'number') {
    return price;
  }

  const v = parseFloat(price.amount) * (1 + rate / 100);
  return {
    amount: String(v),
    currencyCode: price.currencyCode
  };
}

/**
 * Get the vat type for a product
 * @param shopState
 * @param product
 */
export function getVATType(shopState: ShopState, product: Product): VatType {
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
