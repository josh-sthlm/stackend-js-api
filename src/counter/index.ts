// @flow
import { post, XcapJsonResult, Thunk, XcapOptionalParameters } from '../api';

/**
 * Xcap Counter API constants and methods.
 *
 * @since 27 jun 2017
 */

/**
 * Increment a counter.
 * Typically used to implement view counters.
 * Requires an authorized user. A user can only increment the counter once.
 *
 * @param context Context (Required)
 * @param referenceId Reference id, for example a blog entry id (Required)
 */
export function increment({
  context,
  referenceId
}: { context: string; referenceId: number } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/counter/increment', parameters: arguments });
}

/**
 * Make a footprint
 * Typically used to implement view counters.
 * Requires an authorized user. A user can only increment the counter once.
 *
 * @param context Context (Required)
 * @param referenceId Reference id, for example a blog entry id (Required)

 */
export function putFootprint({
  context,
  referenceId
}: {
  context: string;
  referenceId: number;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({ url: '/counter/footprint', parameters: arguments });
}
