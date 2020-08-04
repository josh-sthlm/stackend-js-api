// @flow
import _ from 'lodash/object';
import { post, getJson, type XcapJsonResult, _getApiUrl, type Config } from './api.js';
import type { Thunk } from './store.js';
import type { PaginatedCollection } from './PaginatedCollection.js';
import type { Community } from './stackend/stackend.js';

const COMPONENT_NAME = 'like';
const CONTEXT = 'like';

/**
 * Xcap Like API constants and methods.
 * @author jens
 * @since 20 feb 2017
 */

export type LikeData = {
	likes: number,
	likedByCurrentUser: boolean
};

/**
 * Maps from id to boolean if the current user likes this id
 */
export type LikesByCurrentUser = Map<string, boolean>;

/**
 * Like data map.
 * Maps from obfuscated reference to like data.
 */
export type LikeDataMap = Map<string, LikeData>;

/**
 * Get like data for an object given a likes object.
 *
 * @param likes
 * @param object
 * @return a like object, never null
 */
export function getLikeData(likes: LikeDataMap, object: any): LikeData {
	if (!!likes && !!object && !!object.obfuscatedReference) {
		let l = likes[object.obfuscatedReference];
		if (!!l) {
			return l;
		}
	}

	return {
		likes: 0,
		likedByCurrentUser: false
	};
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
	context = CONTEXT
}: {
	obfuscatedReference?: string,
	reference?: string,
	context: string
}): Thunk<*> {
	return post({
		url: '/like/like',
		parameters: { obfuscatedReference, reference },
		componentName: COMPONENT_NAME,
		context
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
	context = CONTEXT
}: {
	obfuscatedReference?: string,
	reference?: string,
	context: string
}): Thunk<*> {
	return post({
		url: '/like/like',
		parameters: { obfuscatedReference, reference, remove: true },
		componentName: COMPONENT_NAME,
		context
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
	context = CONTEXT
}: {
	obfuscatedReference?: string,
	reference?: string,
	like: boolean,
	context?: string
}): Thunk<*> {
	return post({
		url: '/like/like',
		parameters: { obfuscatedReference, reference, remove: !like },
		componentName: COMPONENT_NAME,
		context
	});
}

export type LikeObjectAndCount = {
	object: any,
	likes: number
};

export type GetLikeToplistResult = XcapJsonResult & {
	/** Toplist of liked objects */
	toplist: PaginatedCollection<LikeObjectAndCount>,

	/** Maps from obfuscated reference like data */
	likes: Map<string, LikeData>,

	/** Actual interval used */
	interval: string,

	/** Like creator user id */
	creatorUserId: number,

	/** Object context */
	objectContext: ?string,

	/** Object creator user id */
	objectCreatorUserId: number
};

type GetToplist = {
	creatorUserId?: number,
	objectCreatorUserId?: number,
	interval?: string,
	objectType?: string,
	objectContext?: string,
	p?: number,
	pageSize?: number
};
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
	pageSize
}: GetToplist): Thunk<GetLikeToplistResult> {
	return getJson({
		url: '/like/toplist',
		parameters: arguments
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
	config
}: GetToplist & { community: Community, config: Config }) {
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
			pageSize
		},
		community: communityPermalink,
		componentName: COMPONENT_NAME,
		context: CONTEXT
	});
}
