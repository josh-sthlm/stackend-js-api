// @flow
import _ from 'lodash';
import {
  post,
  getJson,
  XcapJsonResult,
  _getApiUrl,
  Config,
  Thunk, XcapOptionalParameters
} from '../api';
import type { PaginatedCollection } from '../api/PaginatedCollection';
import type { Community } from '../stackend';

const COMPONENT_NAME = 'like';
const CONTEXT = 'like';

/**
 * Xcap Like API constants and methods.
 * @author jens
 * @since 20 feb 2017
 */

export interface LikeData {
  likes: number;
  likedByCurrentUser: boolean;
}

/**
 * Maps from id to boolean if the current user likes this id
 */
export type LikesByCurrentUser = { [id: string]: boolean };

/**
 * Like data map.
 * Maps from obfuscated reference to like data.
 */
export type LikeDataMap = { [ref: string]: LikeData };

/**
 * Get like data for an object given a likes object.
 *
 * @param likes
 * @param object
 * @return a like object, never null
 */
export function getLikeData(likes: LikeDataMap, object: any): LikeData {
  if (!!likes && !!object && !!object.obfuscatedReference) {
    const l = likes[object.obfuscatedReference];
    if (l) {
      return l;
    }
  }

  return {
    likes: 0,
    likedByCurrentUser: false,
  };
}

export interface LikeResult extends XcapJsonResult {
  numberOfLikes: number;
}
/**
 * Like an object.
 *
 * Supply one of the parameters reference or obfuscatedReference.
 *
 * The new number of likes will be returned.
 *
 * Only authorized users may like an object.
 */
export function like({
  obfuscatedReference,
  reference,
  context = CONTEXT,
}: {
  obfuscatedReference?: string;
  reference?: string;
  context: string;
} & XcapOptionalParameters): Thunk<Promise<LikeResult>> {
  return post({
    url: '/like/like',
    parameters: { obfuscatedReference, reference },
    componentName: COMPONENT_NAME,
    context,
  });
}

/**
 * Remove a like from an object.
 *
 * Supply one of the parameters reference or obfuscatedReference.
 *
 * The new number of likes will be returned.
 *
 */
export function removeLike({
  obfuscatedReference,
  reference,
  context = CONTEXT,
}: {
  obfuscatedReference?: string;
  reference?: string;
  context: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/like/like',
    parameters: { obfuscatedReference, reference, remove: true },
    componentName: COMPONENT_NAME,
    context,
  });
}

/**
 * Like or remove a like from an object.
 *
 * Supply one of the parameters reference or obfuscatedReference.
 *
 * The new number of likes will be returned.
 */
export function setLike({
  obfuscatedReference,
  reference,
  like = true,
  context = CONTEXT,
}: {
  obfuscatedReference?: string;
  reference?: string;
  like: boolean;
  context?: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/like/like',
    parameters: { obfuscatedReference, reference, remove: !like },
    componentName: COMPONENT_NAME,
    context,
  });
}

export interface LikeObjectAndCount {
  object: any;
  likes: number;
}

export interface GetLikeToplistResult extends XcapJsonResult {
  /** Toplist of liked objects */
  toplist: PaginatedCollection<LikeObjectAndCount>;

  /** Maps from obfuscated reference like data */
  likes: LikeDataMap;

  /** Actual interval used */
  interval: string;

  /** Like creator user id */
  creatorUserId: number;

  /** Object context */
  objectContext: string | null;

  /** Object creator user id */
  objectCreatorUserId: number;
}

export interface GetToplist extends XcapOptionalParameters {
  creatorUserId?: number;
  objectCreatorUserId?: number;
  interval?: string;
  objectType?: string;
  objectContext?: string;
  p?: number;
  pageSize?: number;
}

/**
 * Get a toplist of liked objects.
 *
 * @param creatorUserId get likes by this user
 * @param objectCreatorUserId get likes for objects created by this user
 * @param interval Time interval (default: 4weeks)
 * @param objectType Object class name
 * @param objectContext Object context (in current community)
 * @param p Page number
 * @param pageSize Page size
 */
export function getToplist({
  creatorUserId,
  objectCreatorUserId,
  interval,
  objectType,
  objectContext,
  p,
  pageSize,
}: GetToplist): Thunk<Promise<GetLikeToplistResult>> {
  return getJson({
    url: '/like/toplist',
    parameters: arguments,
  });
}

export function getToplistUrl({
  creatorUserId,
  objectCreatorUserId,
  interval,
  objectType,
  objectContext,
  p,
  pageSize,
  community,
  config,
}: GetToplist & { community: Community; config: Config }): string {
  const url = '/like/toplist';
  const communityPermalink = _.get(community, 'permalink');

  return _getApiUrl({
    state: { communities: { community }, config },
    url,
    parameters: {
      creatorUserId,
      objectCreatorUserId,
      interval,
      objectType,
      objectContext,
      p,
      pageSize,
    },
    community: communityPermalink,
    componentName: COMPONENT_NAME,
    context: CONTEXT,
  });
}