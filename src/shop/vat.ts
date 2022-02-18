import { getJson, Thunk, XcapJsonResult } from '../api';

export enum TradeRegion {
  /** Domestic trade */
  NATIONAL = 'national',

  /** Trade within EU, etc */
  REGIONAL = 'regional',

  /** Trade with the rest, etc */
  WORLDWIDE = 'worldwide'
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
