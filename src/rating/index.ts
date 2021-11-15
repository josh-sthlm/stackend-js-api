import { XcapJsonResult, post, getJson, Thunk, XcapOptionalParameters } from '../api';

/**
 * Submit a rating
 * @param reference
 * @param value
 */
export function rate({
  reference,
  value
}: { reference: string; value: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/rating/rate',
    parameters: arguments
  });
}

/**
 * Get average rating for a reference
 * @param reference
 * @returns {Thunk<XcapJsonResult>}
 */
export function getAverateRating({
  reference
}: { reference: string } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({
    url: '/rating/get-average',
    parameters: arguments
  });
}
