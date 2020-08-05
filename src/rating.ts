//@flow
import { XcapJsonResult, post, getJson } from './api';
import { Thunk } from './store';

/**
 * Submit a rating
 * @param reference
 * @param value
 */
export function rate({
	reference,
	value
}: {
	reference: string,
	value: number
}): Thunk<XcapJsonResult> {
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
export function getAverateRating({ reference }: { reference: string }): Thunk<XcapJsonResult> {
	return getJson({
		url: '/rating/get-average',
		parameters: arguments
	});
}
