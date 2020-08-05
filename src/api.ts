//@flow

import { appendQueryString, LoadJson, urlEncodeParameters } from './LoadJson';
import _ from 'lodash';
import { Thunk } from './store';
import { Dispatch} from 'redux';
import { recieveReferences } from './referenceActions';
import { Request, getRequest } from './request';
import { Community, Module } from './stackend/stackend';
import { User } from './user/user';
import { setLoadingThrobberVisible } from '../throbber/throbberActions';
import { Content, Page, SubSite } from './cms/cms';
import { getClientSideApi } from '../functions/ClientSideApi';

declare var __xcapRunningServerSide: any;

export const STACKEND_DEFAULT_SERVER: string = 'https://api.stackend.com';
export const STACKEND_DEFAULT_CONTEXT_PATH: string = '';

/**
 * Xcap API configuration
 */
export interface Config {
	/** Absolute url to the api server*/
	server: string,

	/** Context path on the api server */
	contextPath: string,

	/** Absolute url to the api server including context path and /api */
	apiUrl: string,

	/** Deploy profile */
	deployProfile: string,

	/** Recaptch site key */
	recaptchaSiteKey: string,

	/** Google Analytics key */
	gaKey: string,

	/** Other configuration properties */
	[propName: string]: any
}

/**
 * Known deploy profiles
 */
export const DeployProfile = {
	STACKEND: 'stackend',
	CASTLE: 'castle'
};

/**
 * The default community ("stackend")
 * @type {string}
 */
export const DEFAULT_COMMUNITY: string = 'stackend';

/**
 * Key holding related objects in the json response.
 * @type {string}
 */
export const RELATED_OBJECTS: string = '__relatedObjects';

/**
 * Key holding related likes in the json response.
 * @type {string}
 */
export const LIKES: string = 'likes';

/**
 * Key holding related votes in the json response.
 * @type {string}
 */
export const VOTES: string = 'votes';

/**
 * Parameter name holding the community
 * @type {string}
 */
export const COMMUNITY_PARAMETER: string = '__community';

/**
 * Parameter specifying an alternative rich content chain used to serialize the result
 * @type {string}
 */
export const RICH_CONTENT_CHAIN_PARAMETER: string = 'xcap.rich-content-chain';

/**
 * Privilege types (new enum based version)
 */
export enum Privilege {
	VISITOR = 'VISITOR',
	IDENTIFIED = 'IDENTIFIED',
	VERIFIED = 'VERIFIED',
	BLOCKED = 'BLOCKED',
	TRUSTED = 'TRUSTED',
	ADMIN = 'ADMIN',
	SUPER_ADMIN = 'SUPER_ADMIN'
}


/**
 * Privilege types (old id based version)
 */
export enum PrivilegeType {
	VISITOR = 1,
	IDENTIFIED = 2,
	VERIFIED = 4,
	BLOCKED = 8,
	TRUSTED = 16,
	ADMIN = 32,
	SUPER_ADMIN = 64
}

export type PrivilegeTypeIds = 1 | 2 | 4 | 8 | 16 | 32 | 64;


/**
 * Privilege type names
 */
const PRIVILEGE_NAMES = {
	'1': 'Visitor',
	'2': 'Identified',
	'4': 'Verified',
	'8': 'Blocked',
	'16': 'Author',
	'32': 'Admin',
	'64': 'Super-Admin'
};

/**
 * Search order
 */
export enum Order {
	ASCENDING = 'ASCENDING',
	DESCENDING = 'DESCENDING',
	UNORDERED = 'UNORDERED'
}

/**
 * Base type for api results
 */
export interface XcapJsonResult {
	/**
	 * Error messages. Not present if the API call was successfull
	 */
	error?: {
		/**
		 * Error messages from the API
		 */
		actionErrors: Array<string>,

		/**
		 * Field errors. Maps from a field (parameter) name to validation error messages for that parameter.
		 */
		fieldErrors: Map<string, Array<string>>
	},

	/**
	 * Action specific result code.
	 * Common codes includes: "success", "input", "notfound" etc.
	 */
	__resultCode: string,

	/**
	 * Additional debug messages (non errors) from the API
	 */
	__messages?: Array<string>,

	/**
	 * Related objects mapped from a hash string to the actual object.
	 * Present only when a call is successful.
	 */
	__relatedObjects?: Map<string, any>,

	/** Additional properties specific to the called API method  */
	[propName: string]: any
}

/**
 * Base class for all xcap objects
 */
export interface XcapObject {
	__type: string,
	id: number
}

/**
 * Invert the ordering
 * @param order
 * @returns {string}
 */
export function invertOrder(order: Order): Order {
	if (Order.ASCENDING === order) {
		return Order.DESCENDING;
	} else if (Order.DESCENDING === order) {
		return Order.ASCENDING;
	}

	return Order.UNORDERED;
}

/**
 * Get the name of a privilege type
 */
export function getPrivilegeName(privilegeType: number): string {
	let s = PRIVILEGE_NAMES[String(privilegeType)];
	return s || 'Visitor';
}

/**
 * Describes the user access to an object
 */
export interface AuthObject {
	/** Users privilege */
	userPrivilege: Privilege,

	/** Is comment allowed? */
	comment: boolean,

	/** Is create allowed? */
	create: boolean,

	/** Is moderate allowed? */
	moderate: boolean,

	/** Is read allowed? */
	read: boolean,

	/** Is post moderation required? */
	postModerateRequired: boolean,

	/** Will objects caught by the text filter cause it to be pre-moderated? */
	textFilteredPre: boolean,

	/** Is text filtering requred? */
	textFilteringRequired: boolean,

	/** Rule in effect */
	ruleId: number
}

/**
 * Generic sort order. Some components supports additional orders.
 */
export enum SortOrder {
	ASCENDING = 'ASCENDING',
	DESCENDING = 'DESCENDING'
}

export type Modstatus = 'NONE' | 'PASSED' | 'NOT_PASSED';

/**
 * Xcap types and their names
 */
const typeNames = {
	'se.josh.xcap.comment.Comment': 'Comment',
	'se.josh.xcap.comment.impl.CommentImpl': 'Comment',
	'net.josh.community.user.User': 'User',
	'net.josh.community.group.Group': 'Group',
	'net.josh.community.user.backend.xcap.XcapUser': 'User',
	'net.josh.community.blog.BlogEntry': 'Post',
	'net.josh.community.abuse.ReferencedAbuse': 'Abuse report',
	'net.josh.community.forum.ForumThread': 'Question',
	'net.josh.community.forum.impl.ForumThreadImpl': 'Question',
	'net.josh.community.forum.ForumThreadEntry': 'Answer',
	'net.josh.community.forum.impl.ForumThreadEntryImpl': 'Answer',
	'net.josh.community.forum.Forum': 'Forum',
	'net.josh.community.forum.impl.ForumImpl': 'Forum',
	'net.josh.community.media.Media': 'Media',
	'net.josh.community.media.Image': 'Image',
	'net.josh.community.media.Document': 'Document',
	'net.josh.community.media.Audio': 'Audio',
	'net.josh.community.media.Video': 'Video',
	'se.josh.xcap.cms.Content': 'CMS Content',
	'se.josh.xcap.cms.impl.ContentImpl': 'CMS Content',
	'se.josh.xcap.community.Community': 'Site'
};

/**
 * Moderation visibility indicator, used to filter content depending on
 * moderation status. Managers that accept this visibility filter must maintain
 * sensible defaults (i.e {@link #VISIBLE}) for safety reasons.
 */
export enum ModerationVisibility {
	/**
	 * All will return all items disregarding any moderation status, useful for
	 * administration purposes.
	 */
	ALL = 'ALL',

	/**
	 * Visible is the normal behavior, which filters out all disapproved items
	 * but includes items that are post moderated and not expired.
	 */
	VISIBLE = 'VISIBLE',

	/**
	 * The same behavior as {@link #VISIBLE} but for modules that support user
	 * approval like {@link CommentManager}, the objects awaiting approval are
	 * also included. For modules that do not support this, treat like
	 * {@link #VISIBLE}.
	 */
	VISIBLE_INCLUDING_AWAITING_USER_APPROVAL = 'VISIBLE_INCLUDING_AWAITING_USER_APPROVAL',

	/**
	 * The same behavior as {@link #VISIBLE} but for modules that support user
	 * approval like {@link CommentManager}, the objects awaiting approval,
	 * approved and disapproved are also included. For modules that do not
	 * support this, treat like {@link #VISIBLE}.
	 */
	VISIBLE_INCLUDING_USER_APPROVAL = 'VISIBLE_INCLUDING_USER_APPROVAL',

	/**
	 * Only approved will approve content that has been actively approved or
	 * items that has never been considered for moderation (no moderation). Post
	 * moderated items that have not yet been approved will be left out. Useful
	 * for extra sensitive listings (a front page listing for example).
	 */
	APPROVED = 'APPROVED',

	/**
	 * Only disapproved means that only content that has been disapproved will
	 * be included.
	 */
	DISAPPROVED = 'DISAPPROVED',

	/**
	 * All objects that are pending premoderation or expired postmoderation - i.e. items that are not included in {@link #VISIBLE}.
	 */
	MODERATION_REQUIRED = 'MODERATION_REQUIRED',

	/**
	 * All objects pending moderation, all premoderated and postmoderated items regardless of expiration.
	 */
	MODERATION_PENDING = 'MODERATION_PENDING'
}

/**
 * Moderation statuses
 */
export enum ModerationStatus {
	/**
	 * No moderation required 0
	 */
	NONE = 'NONE',

	/**
	 * Approved by a moderator 1
	 */
	PASSED = 'PASSED',

	/**
	 * Disapproved by a moderator 2
	 */
	NOT_PASSED = 'NOT_PASSED',

	/**
	 * Pre moderation required 4
	 */
	PRE = 'PRE',

	/**
	 * Post moderation required within the specified TTL 5
	 */
	POST = 'POST'
}

const ModerationStatusNames = {
	[ModerationStatus.NONE]: 'Visible, not moderated',
	[ModerationStatus.NOT_PASSED]: 'Disapproved',
	[ModerationStatus.PASSED]: 'Approved',
	[ModerationStatus.POST]: 'Post moderation',
	[ModerationStatus.PRE]: 'Hidden, requires moderation'
};

export function getModerationStatus(n: number): ModerationStatus {
	switch (n) {
		case 0:
			return ModerationStatus.NONE;
		case 1:
			return ModerationStatus.PASSED;
		case 2:
			return ModerationStatus.NOT_PASSED;
		case 4:
			return ModerationStatus.PRE;
		case 5:
			return ModerationStatus.POST;
		default:
			throw n + ' is not a moderation status';
	}
}

export function getModerationStatusName(m: ModerationStatus): string {
	let x = ModerationStatusNames[m];
	if (x) {
		return x;
	}
	return ModerationStatusNames[ModerationStatus.NONE];
}

export const ModerationStatusCode = {
	[ModerationStatus.NONE]: 0,
	[ModerationStatus.PASSED]: 1,
	[ModerationStatus.NOT_PASSED]: 2,
	[ModerationStatus.PRE]: 4,
	[ModerationStatus.POST]: 5
};

export type ModerationStatusCodes = 0 | 1 | 2 | 4 | 5;

export interface CommunityContext {
	community: string,
	context: string
}

export interface Reference {
	communityContext: CommunityContext,
	type: string,
	id: number
}

/**
 * Get the API configuration object
 * @type {Thunk<Config>}
 */
export function getConfiguration(): Thunk<Config> {
	return (dispatch: any, getState: any) => {
		return _.get(getState(), 'config', global.xcapModuleSettings);
	};
}

/**
 * Server domain enabling CORS calls
 * @type {string}
 */
export function getServer(): Thunk<string> {
	return (dispatch: any, getState: any) => {
		if (typeof getState !== 'function') {
			console.error('getServer: Wrong invocation');
		}
		return _.get(
			typeof getState === 'function' ? getState() : null,
			'config.server',
			_.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)
		);
	};
}

/**
 * Server domain enabling CORS calls
 * @type {string}
 */
export function _getServer(config: Config) {
	return _.get(
		config,
		'server',
		_.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)
	);
}

/**
 * @deprecated bad practise to dispatch getters which doesn't set any state, use api._getDeployProfile instead
 * Get the deploy profile name. Allows customized styling for different deployments
 * @return a profile name, or the empty string.
 */
export function getDeployProfile(): Thunk<string> {
	return (dispatch: any, getState: any) => {
		if (typeof getState !== 'function') {
			console.error('getDeployProfile: Wrong invocation');
		}
		return _.get(
			typeof getState === 'function' ? getState() : null,
			'config.deployProfile',
			_.get(global, 'xcapModuleSettings.deployProfile', DeployProfile.STACKEND)
		);
	};
}

/**
 * Get the deploy profile name. Allows customized styling for different deployments
 * @return a profile name, or the empty string.
 */
export function _getDeployProfile(config: Config): string {
	return _.get(
		config,
		'deployProfile',
		_.get(global, 'xcapModuleSettings.deployProfile', DeployProfile.STACKEND)
	);
}

/**
 * ContextPath of Api server
 * @return {Thunk<string>}
 */
export function getContextPath(): Thunk<string> {
	return (dispatch: any, getState: any) => {
		if (typeof getState !== 'function') {
			console.error('Stackend: getContextPath: Wrong invocation');
		}
		return _.get(
			typeof getState === 'function' ? getState() : null,
			'config.contextPath',
			_.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
		);
	};
}

/**
 * ContextPath of Api server
 * @type {string}
 */
export function _getContextPath(config: Config): string {
	return _.get(
		config,
		'contextPath',
		_.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
	);
}

/**
 * Server domain address with ContextPath
 * @return {Thunk<string>}
 */
export function getServerWithContextPath(): Thunk<string> {
	return (dispatch: any, getState: any) => {
		if (typeof getState !== 'function') {
			console.error('getServerWithContextPath: Wrong invocation');
		}
		const state = typeof getState !== 'function' ? getState() : null;

		return (
			_.get(
				state,
				'config.server',
				_.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)
			) +
			_.get(
				state,
				'config.contextPath',
				_.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
			)
		);
	};
}

/**
 * Server domain address with ContextPath from redux store
 */
export function getServerWithContextPathFromStore(config: Config): string {
	return (
		_.get(config, 'server', _.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)) +
		_.get(
			config,
			'contextPath',
			_.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
		)
	);
}

/**
 * Server domain address with ContextPath
 */
export function _getServerWithContextPath(config: Config): string {
	return (
		_.get(config, 'server', _.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)) +
		_.get(
			config,
			'contextPath',
			_.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
		)
	);
}

/**
 * Get the path to the current community.
 * For example "/stackend/test"
 * @return never null
 */
export function getCommunityPath(): Thunk<string> {
	return (dispatch: any, getState: any) => {
		if (typeof getState !== 'function') {
			throw 'getCommunityPath : Wrong invocation';
		}
		return _.get(getState(), 'request.communityUrl', '');
	};
}

/**
 * Get the path to the current community.
 * For example "/stackend/test"
 * @return never null
 */
export function getCommunityPathFromStore({ request }: { request: Request }): string {
	return _.get(request, 'communityUrl', '');
}

/**
 * Get the absolute path to the current community, including host name.
 * For example "stackend.com/stackend/test"
 * Same as request.absoluteCommunityUrl.
 * @return {Thunk<string>}
 */
export function getAbsoluteCommunityPath(): Thunk<string> {
	return (dispatch: any, getState: any) => {
		if (typeof getState !== 'function') {
			throw 'getAbsoluteCommunityPath: Wrong invocation';
		}
		return _.get(getState(), 'request.absoluteCommunityUrl', '');
	};
}

/**
 * Get the community path. In stackend /stacks/, return the context path, not the current community path.
 * @return {Thunk<string>}
 */
export function getEffectiveCommunityPath(): Thunk<string> {
	return (dispatch: any, getState: any) => {
		const state = getState();
		if (/\/stacks\//.exec(_.get(state, 'request.location.pathname', ''))) {
			// Ignore /stacks/xxx
			return _.get(state, 'config.contextPath', global.xcapModuleSettings.contextPath);
		}

		// Outside stackend
		let p = _.get(state, 'request.communityPath', null);
		if (p !== null) {
			return p;
		}

		return _.get(state, 'config.contextPath', global.xcapModuleSettings.contextPath);
	};
}

/**
 * Api url containing server and ContextPath if necessary.
 * @param community Optional community
 * @return {Thunk<string>}
 */
export function getAbsoluteApiBaseUrl(community: string): Thunk<string> {
	return (_dispatch: any, getState: any) => {
		const state = getState();

		const pfx =
			_.get(
				state,
				'config.server',
				_.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)
			) +
			_.get(
				state,
				'config.contextPath',
				_.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
			);

		// The default community does not use a prefix
		if (
			typeof community === 'undefined' ||
			community === null ||
			community === DEFAULT_COMMUNITY ||
			community === ''
		) {
			return pfx + '/api';
		}

		return pfx + '/' + community + '/api';
	}
}

/**
 * Api url containing server and ContextPath if necessary.
 * @param config Xcap config
 * @param communityPermalink Optional community permalink
 * @type {string}
 */
export function _getAbsoluteApiBaseUrl({
	config,
	communityPermalink
}: {
	config: Config,
	communityPermalink?: string
}): string {
	const pfx =
		_.get(config, 'server', _.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)) +
		_.get(
			config,
			'contextPath',
			_.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
		);

	// The default community does not use a prefix
	if (
		typeof communityPermalink === 'undefined' ||
		communityPermalink === null ||
		communityPermalink === DEFAULT_COMMUNITY ||
		communityPermalink === ''
	) {
		return pfx + '/api';
	}

	return pfx + '/' + communityPermalink + '/api';
}

/**
 * Get the current community name (For example "c123")
 * @return may return null
 */
export function getCurrentCommunity(): Thunk<Community|null> {
	return (dispatch: any, getState: any) => {
		return _.get(getState(), 'communities.community', null);
	}
}

/**
 * Get the current community permalink as used in name (For example "test").
 *
 * @return May return null
 */
export function getCurrentCommunityPermalink(): Thunk<string|null> {
	return (dispatch: any, getState: any) => {
		return _.get(getState(), 'communities.community.permalink', null);
	};
}

/**
 * Get the base url to the api server.
 * Typically '/APP/api/endpoint'
 * @param state Store state
 * @param url extra url
 * @param parameters extra parameters (optional)
 * @param notFromApi boolean if the url is not in the api
 * @param community community name
 * @param componentName Component name used to look up config
 * @param context Context name used to look up config
 * @returns {String} the api url
 * @see COMMUNITY_PARAMETER
 */
export function _getApiUrl({
	state,
	url,
	parameters,
	notFromApi = false,
	community,
	componentName,
	context
}: {
	state: { communities: any, config: any }, //redux state
	url: string, //extra url
	parameters?: any, //extra parameters
	notFromApi?: boolean, //if the url is not in the api
	community?: string, //community name
	componentName?: string, //Component name used to look up config
	context?: string //Context name used to look up config
}): string {
	//the api url
	let params = argsToObject(parameters);

	if (typeof community === 'undefined') {
		if (params) {
			community = params[COMMUNITY_PARAMETER];
			delete params[COMMUNITY_PARAMETER];
		}
		if (typeof community === 'undefined') {
			community = _.get(state, 'communities.community.permalink', DEFAULT_COMMUNITY);
		}
	}

	let path = '';

	if (!notFromApi) {
		/* Calls to /api/*  (just don't code like this ok) */
		// FIXME: global.xcapModuleSettings is a fallback for the initial load
		const server = _getConfig({
			config: state.config || {},
			componentName,
			context,
			key: 'server',
			defaultValue: _.get(global, 'xcapModuleSettings.server', STACKEND_DEFAULT_SERVER)
		});
		const contextPath = _getConfig({
			config: state.config || {},
			componentName,
			context,
			key: 'contextPath',
			defaultValue: _.get(global, 'xcapModuleSettings.contextPath', STACKEND_DEFAULT_CONTEXT_PATH)
		});
		const apiUrlOverride = _getConfig({
			config: state.config || {},
			componentName,
			context,
			key: 'api-url'
		});

		let pfx = server + contextPath;

		if (!!apiUrlOverride) {
			pfx = apiUrlOverride;
		}
		// The default community does not use a prefix
		else if (
			typeof community === 'undefined' ||
			community === null ||
			community === DEFAULT_COMMUNITY ||
			community === ''
		) {
			pfx += '/api';
		} else {
			pfx += '/' + community + '/api';
		}
		path = pfx + url;
	} else {
		path = url;
	}

	let args = urlEncodeParameters(params);
	return appendQueryString(path, args);
}

/**
 * Get the base url to the api server.
 * Typically '/APP/api/endpoint'
 * @param url extra url
 * @param parameters extra parameters (optional)
 * @param notFromApi boolean if the url is not in the api
 * @param community community name
 * @param componentName Component name used to look up config
 * @param context Context name used to look up config
 * @returns {Thunk} the api url
 * @see COMMUNITY_PARAMETER
 */
export function getApiUrl({
	url,
	parameters,
	notFromApi = false,
	community,
	componentName,
	context
}: {
	url: string,
	parameters?: any,
	notFromApi?: boolean,
	community?: string,
	componentName?: string,
	context?: string
}): Thunk<string> {
	return (dispatch: any, getState: any) => {
		return _getApiUrl({
			state: getState(),
			url,
			parameters,
			notFromApi,
			community,
			componentName,
			context
		});
	};
}

/**
 * Add any related objects recieved to the store
 * @param dispatch
 * @param json
 */
export function addRelatedObjectsToStore(dispatch: Dispatch, json: any): void {
	if (!!json[RELATED_OBJECTS] && Object.keys(json[RELATED_OBJECTS]).length > 0) {
		const relatedObjects = json[RELATED_OBJECTS];
		dispatch(recieveReferences({ entries: relatedObjects }));
	}
}

/**
 * Get json from the api.
 *
 * @param url
 * @param parameters
 * @param notFromApi boolean if the url is not in the api
 * @param community Current community name
 * @param componentName Component name used for config (for example "like")
 * @param context Community context used for config (for example "forum")
 * @param cookie Optional cookie string to pass on
 * @returns {Thunk}
 */
export function getJson({
	url,
	parameters,
	notFromApi = false,
	community,
	componentName,
	context,
	cookie
}: {
	url: string,
	parameters?: any,
	notFromApi?: boolean,
	community?: string,
	componentName?: string,
	context?: string,
	cookie?: string
}): Thunk<XcapJsonResult> {
	return async (dispatch: any /*,getState: any*/) => {
		try {
			dispatch(setLoadingThrobberVisible(true));

			const p = await dispatch(
				getApiUrl({
					url,
					parameters: argsToObject(parameters),
					notFromApi,
					community,
					componentName,
					context
				})
			);

			let c: string | null = cookie;

			// The client will supply the cookie automatically. Server side will not, so pass it along
			if (
				(typeof c === 'undefined' || c == null) &&
				typeof __xcapRunningServerSide !== 'undefined'
			) {
				let request: Request = await dispatch(getRequest());
				c = request.cookie;
			}

			let requestStartTime = Date.now();
			const result: XcapJsonResult = await LoadJson({ url: p, cookie: c });
			let t = Date.now() - requestStartTime;
			if (t > 500 && typeof __xcapRunningServerSide !== 'undefined') {
				console.warn('Slow API request: ' + t + 'ms:', p);
			}

			if (!!result) {
				if (!!result.error) {
					console.error(getJsonErrorText(result), p);
					dispatch(setLoadingThrobberVisible(false));
					if (result.status === 403) {
						// Unauthorized
						console.warn('Stackend: Session has expired');
						/* FIXME: At this point the user should be prompted to login again. Prefferably using a popup
						dispatch(refreshLoginData({ force : true })); // Breaks because of circular dependencies
						*/
					}

					return result;
				}

				const r = postProcessApiResult(result);
				addRelatedObjectsToStore(dispatch, r);
				dispatch(setLoadingThrobberVisible(false));
				return r;
			}

			console.error('No result received: ', p);
			dispatch(setLoadingThrobberVisible(false));
			return {
				error: {
					actionErrors: ['No result received']
				}
			};
		} catch (e) {
			// 404, connection refused etc
			console.error("Couldn't getJson: " + url, e);
			dispatch(setLoadingThrobberVisible(false));
			return {
				error: {
					actionErrors: ["Couldn't getJson"]
				}
			};
		}
	};
}

/**
 * Get json from the api.
 *
 * @param url
 * @param parameters
 * @returns {Promise}
 */
export function getJsonOutsideApi({
	url,
	parameters
}: {
	url: string,
	parameters?: any
}): Thunk<XcapJsonResult> {
	return async (dispatch: any) => {
		const p = appendQueryString(url, urlEncodeParameters(argsToObject(parameters)));
		let result = await LoadJson({ url: p });

		if (!!result) {
			if (!!result.error) {
				console.warn(getJsonErrorText(result), p);
				return result;
			}
			const r = postProcessApiResult(result);

			addRelatedObjectsToStore(dispatch, r);
			return r;
		}

		return {}; // FIXME: Should return error
	};
}


/**
 * Post using the json api.
 * @param url
 * @param parameters
 * @param community Current community name
 * @param componentName Component name used for config (for example "like")
 * @param context Community context used for config (for example "forum")
 * @returns {Thunk}
 */
export function post({
	url,
	parameters,
	community,
	componentName,
	context
}: {
	url: string,
	parameters?: any,
	community?: string,
	componentName?: string,
	context?: string
}): Thunk<XcapJsonResult> {
	return async (dispatch: any) => {
		const params = argsToObject(parameters);

		if (
			typeof community === 'undefined' &&
			params &&
			typeof params[COMMUNITY_PARAMETER] !== 'undefined'
		) {
			community = params[COMMUNITY_PARAMETER];
		}

		const p = dispatch(
			getApiUrl({
				url,
				notFromApi: false,
				community,
				componentName,
				context
			})
		);

		const xpressToken = await dispatch(getXpressToken({ componentName, context }));

		const result = await LoadJson({
			url: p,
			method: 'POST',
			parameters: params,
			xpressToken: xpressToken.xpressToken
		});

		if (!!result) {
			if (!!result.error) {
				console.warn(getJsonErrorText(result), p);
				return result;
			}
			const r = postProcessApiResult(result);
			addRelatedObjectsToStore(dispatch, r);
			return r;
		}
		return {}; // FIXME: report error
	};
}

/**
 * Post using the json api to an external server.
 * @param url
 * @param parameters
 * @param remoteServer
 * @returns {Promise}
 * @deprected
 * FIXME: Remove this
 *
 */
export function postToExternalServer({
	url,
	parameters,
	remoteServer
}: {
	url: string,
	parameters: any,
	remoteServer: string
}): Thunk<XcapJsonResult> {
	return async (dispatch: any /*, getState: any*/) => {
		let params = argsToObject(parameters);
		const result = await LoadJson({
			url,
			method: 'POST',
			parameters: params,
			server: remoteServer
		});
		if (!!result.error) {
			console.warn(getJsonErrorText(result), url);
		}
		const r = postProcessApiResult(result);
		addRelatedObjectsToStore(dispatch, r);
		return r;
	};
}

/**
 * Get an xpress token used for CSRF prevention.
 * @return {Promise}
 */
export function getXpressToken({
	community,
	componentName,
	context
}: {
	community?: string,
	componentName?: string,
	context?: string
}): Thunk<any> {
	return getJson({
		url: '/xpresstoken',
		community,
		componentName,
		context
	});
}

/**
 * Get a configuration variable.
 *
 * <p>When looking up a key, the followin order is used:</p>
 * <ol>
 * 	<li>COMPONENT.CONTEXT.KEY</li>
 * 	<li>COMPONENT.KEY</li>
 * 	<li>KEY</li>
 * 	<li>Default value</li>
 * </ol>
 *
 * @param key configuration key
 * @param componentName Component name (Optional)
 * @param context Community context(Optional)
 * @param defaultValue Default value (Optional)
 */
export function getConfig({
	key,
	componentName,
	context,
	defaultValue = ''
}: {
	key: string,
	componentName?: string,
	context?: string,
	defaultValue?: any
}): Thunk<*> {
	return (dispatch: any, getState: any) => {
		const config = _.get(getState(), 'config');
		return _getConfig({ config, key, componentName, context, defaultValue });
	};
}

export function _getConfig({
	config,
	key,
	componentName,
	context,
	defaultValue = ''
}: {
	config: Config,
	key: string,
	componentName?: string,
	context?: string,
	defaultValue?: any
}): any {
	if (typeof config === 'undefined') {
		console.warn('getConfig: config is not present in store');
		return defaultValue;
	}

	let v = undefined;
	if (!componentName) {
		v = config[key];
		if (typeof v !== 'undefined') {
			return v;
		}
	} else {
		if (!context) {
			v = config[componentName + '.' + key];
			if (typeof v !== 'undefined') {
				return v;
			}

			return _getConfig({ config, key, defaultValue });
		} else {
			v = config[componentName + '.' + context + '.' + key];
			if (typeof v !== 'undefined') {
				return v;
			}

			return _getConfig({ config, key, componentName, defaultValue });
		}
	}

	return defaultValue;
}

/**
 * Construct an url to the UI.
 *
 * @param path Path
 * @param parameters Parameters map
 * @param hash
 */
export function createUrl({
	path,
	params,
	hash
}: {
	path: string,
	params?: any,
	hash?: string
}): string {
	let loc = path;

	if (!!params) {
		let i = loc.indexOf('?') === -1 ? 0 : 1;
		for (let p in params) {
			if (params.hasOwnProperty(p)) {
				loc += (i === 0 ? '?' : '&') + encodeURIComponent(p);
				let v = params[p];
				if (!!v) {
					loc += '=' + encodeURIComponent(v);
				}
			}
		}
	}

	if (!!hash) {
		loc += hash.startsWith('#') ? hash : '#' + hash;
	}

	return loc;
}

/**
 * Construct an url to a community in the UI.
 *
 * @param request Request object from requestReducers.ts
 * @param path Path
 * @param parameters Parameters map
 * @param hash
 * @param absolute Should the url be absolute (boolean)
 */
export function createCommunityUrl({
	request,
	path,
	params,
	hash,
	absolute
}: {
	request?: Request,
	path: string,
	params?: any,
	hash?: string,
	absolute?: boolean
}): string {
	let pfx: string = '';
	if (!!absolute && absolute) {
		if (!!request) {
			pfx = request.absoluteCommunityUrl;
		} else {
			//pfx = getAbsoluteCommunityPath();
			pfx = 'FIXME';
		}
	} else {
		if (!!request) {
			pfx = request.communityUrl;
		} else {
			//pfx = getCommunityPath();
			pfx = 'FIXME';
		}
	}

	return createUrl({ path: pfx + path, params, hash });
}

/**
 * Convert an Arguments, Array or Object to an object
 * @param args
 * @return {Object}
 */
export function argsToObject(args: any): any {
	if (typeof args === 'string') {
		return args;
	}

	if (!args) {
		return null;
	}

	let r = {};
	if (typeof args.length === 'undefined') {
		r = args; // Plain object
	} else {
		// Arguments or Arguments object
		for (let i = 0; i < args.length; i++) {
			Object.assign(r, args[i]);
		}
	}

	// Remove undefined values
	for (let k in r) {
		if (r.hasOwnProperty(k) && typeof r[k] === 'undefined') {
			delete r[k];
		}
	}

	return r;
}

/**
 * Post process  data from the XCAP json api.
 *
 * - Turns timestamps into Date objects
 * - Resolves references to objects
 *
 * The method modifies data in place to avoid copying.
 *
 * @param result
 * @return {Object}
 */
export function postProcessApiResult(result: XcapJsonResult): any {
	const likes = !!result[LIKES] ? result[LIKES] : undefined;
	const votes = !!result[VOTES] ? result[VOTES] : undefined;
	return _postProcessApiResult(result, result[RELATED_OBJECTS], likes, votes);
}

function _postProcessApiResult(result: XcapJsonResult, relatedObjects: any, likes, votes) {
	if (result === null) {
		return null;
	}

	let d = result;
	for (let n in result) {
		if (!result.hasOwnProperty(n) || n === RELATED_OBJECTS) {
			// Skip
		} else if (n.endsWith('Ref')) {
			/*This disables ssr due to wrong-formating in json-response
        if (n === "createdDate" || n === "modifiedDate" || n === "publishDate" || n === "expiresDate")
        {
            var v = result[n];
            if (typeof v === "number")
            {
                result[n] = new Date(v);
            }
        }*/
			let v = result[n];
			if (typeof v === 'string') {
				let r = relatedObjects[v];
				result[n] = r;
				if (r === null) {
					console.error('Could not resolve related object ' + n + '=' + v);
				} else {
					result[n] = _postProcessApiResult(r, relatedObjects, likes);
				}
			} else if (typeof v === 'object' && v !== null && v.constructor === Array) {
				for (let i = 0; i < v.length; i++) {
					let ref = v[i];
					let r = relatedObjects[ref] || ref;
					v[i] = r;
					if (r === null) {
						console.error('Could not resolve related object ' + ref);
					}
				}
			}
		} else if (n === 'obfuscatedReference') {
			//Check for likes
			const likeObject = _.get(likes, `[${result[n]}]`, undefined);
			if (likeObject) {
				result.likedByCurrentUser = likeObject;
			}
			//Check for votes
			const voteObject = _.get(votes, `[${result[n]}].voteByCurrentUser`, undefined);
			if (voteObject) {
				result.voteByCurrentUser = voteObject;
			}
		} // Objects, arrays
		else {
			let v = result[n];
			if (v !== null && typeof v === 'object') {
				if (v.constructor === Array) {
					for (let i = 0; i < v.length; i++) {
						v[i] = _postProcessApiResult(v[i], relatedObjects, likes, votes);
					}
				} else {
					result[n] = _postProcessApiResult(v, relatedObjects, likes, votes);
				}
			}
		}
	}
	return d;
}

/**
 * Format the response action and field errors object to a string.
 * @return {String}
 */
export function getJsonErrorText(response?: XcapJsonResult): string {
	if (typeof response === 'undefined') {
		return 'No JSON response received';
	}

	let t = typeof response.error;

	if (t === 'undefined') {
		return 'No JSON response received';
	}

	if (t === 'string') {
		return t;
	}

	let m = '';

	if (!response.error) {
		return m;
	}

	if (response.error.actionErrors) {
		for (let i = 0; i < response.error.actionErrors.length; i++) {
			if (i > 0) {
				m += '\n';
			}
			m += response.error.actionErrors[i];
		}
	}

	_.forIn(response.error.fieldErrors, (value, key) => {
		if (m.length > 0) {
			m += '\n';
		}

		m += key + ': ' + value;
	});

	return m;
}

/**
 * Get a human readable type of an xcap object
 * @param objectOrClassName
 * @return {String}
 */
export function getTypeName(objectOrClassName: any): string {
	if (typeof objectOrClassName === 'string') {
		return typeNames[objectOrClassName];
	} else {
		let tn = objectOrClassName['__type'];
		if (typeof tn === 'string') {
			let n = typeNames[tn];
			if (n) {
				return n;
			}

			let i = tn.lastIndexOf('.');
			return i === -1 ? tn : tn.substring(i + 1);
		}
	}

	return 'Unknown type';
}

export interface GetInitialStoreValuesResult extends XcapJsonResult {
	/** Was the community determined from the domain rather that from the permalink? */
	communityFromDomain: boolean,

	/** Permalink of community */
	permalink: string,

	/** Current community. may be null */
	stackendCommunity: Community | null,

	/** Privilege of current community (when running in /stacks) */
	communityPrivilegeType: PrivilegeType,
	domain: string | null,

	/** Current user. Stackend user when running in /stacks */
	user: User | null,
	xcapApiConfiguration: Map<string, any>,
	numberOfUnseen: number,
	modules: Map<string, Module>,

	/** Maps from id to content */
	cmsContents: Map<string, Content>,

	/** Maps from id to  Page */
	cmsPages: Map<string, Page>,

	/** Maps from id to  SubSite */
	subSites: Map<string, SubSite>,

	/** Maps the referenceUrl parameter to an id */
	referenceUrlId: number
}

/**
 * Load the initial store values
 */
export function getInitialStoreValues({
	permalink,
	domain,
	communityId,
	moduleIds,
	contentIds,
	pageIds,
	subSiteIds,
	cookie,
	referenceUrl,
	stackendMode
}: {
	permalink?: string,
	domain?: string,
	communityId?: number,
	moduleIds?: Array<number>,
	contentIds?: Array<number>,
	pageIds?: Array<number>,
	subSiteIds?: Array<number>,
	cookie?: string,
	referenceUrl?: string,
	stackendMode?: boolean
}): Thunk<GetInitialStoreValuesResult> {
	return getJson({
		url: '/init',
		parameters: {
			permalink,
			domain,
			communityId,
			moduleIds,
			contentIds,
			pageIds,
			subSiteIds,
			referenceUrl,
			stackendMode
		},
		community: DEFAULT_COMMUNITY,
		cookie
	});
}

/**
 * Log a javascript error
 * @param error Browser Error object
 */
export async function logJsError(error: Error): Promise<any> {
	if (!error) {
		return;
	}

	if (!window.xcapModuleSettings) {
		console.error(error);
		return;
	}

	let communityId = 0;
	let store = '';
	let api = getClientSideApi();
	if (api && api.reduxStore) {
		let state = api.reduxStore.getState();
		if (state) {
			if (state.communities && state.communities.community) {
				communityId = state.communities.community.id;
			}
			store = JSON.stringify(state);
		}
	}

	// Produces the best error message in all browsers.
	// Safari, however does not include the stacktrace
	let message = message + error.toString() + (error.stack ? '\n' + error.stack : '');

	let params = {
		communityId,
		store,
		error: error.name + (error.number ? ' (' + error.number + ')' : ''),
		message,
		line: error.lineNumber || -1,
		column: error.columnNumber || -1,
		url: error.fileName || '',
		pageUrl: document.location.href
	};

	let url =
		window.xcapModuleSettings.server + window.xcapModuleSettings.contextPath + '/api/js-log';

	let r = null;
	try {
		r = await LoadJson({
			url,
			method: 'POST',
			parameters: params
		});
	} catch (e) {
		console.error('Failed to log: ', params, '\nCause: ', e);
	}
	return r;
}

/**
 * Parse a community context.
 * @param communityContext
 * @returns {null|CommunityContext}
 */
export function parseCommunityContext(communityContext: string | null): CommunityContext | null {
	if (!communityContext) {
		return null;
	}

	let p = communityContext.split(':', 3);
	if (p.length !== 2) {
		return null;
	}

	let c: CommunityContext = {
		community: p[0],
		context: p[1]
	};

	return c;
}

/**
 * Parse a reference
 * @param reference
 * @returns {null|Reference}
 */
export function parseReference(reference: string|null): Reference | null {
	if (!reference) {
		return null;
	}

	let p = reference.split('-', 4);
	if (p.length !== 3) {
		return null;
	}

	let id = parseInt(p[2]);
	if (isNaN(id)) {
		return null;
	}

	let cc = parseCommunityContext(p[0]);
	if (!cc) {
		return null;
	}

	let r: Reference = {
		communityContext: cc,
		type: p[1],
		id
	};

	return r;
}

/**
 * Construct a reference
 * @param xcapCommunityName
 * @param context
 * @param type
 * @param id
 */
export function constructReference(
	xcapCommunityName: string,
	context: string,
	type: string,
	id: number
): Reference {
	let c = xcapCommunityName + ':' + context;
	let cc = parseCommunityContext(c);
	if (!cc) {
		throw 'Invalid communityContext: ' + c;
	}

	return {
		communityContext: cc,
		type,
		id
	};
}

/**
 * Get a reference
 * @param xcapCommunityName
 * @param context
 * @param obj
 * @returns {Reference}
 */
export function getReference(
	xcapCommunityName: string,
	context: string,
	obj: XcapObject
): Reference {
	return constructReference(xcapCommunityName, context, obj.__type, obj.id);
}

/**
 * Get a reference as a string
 * @param ref
 * @returns {string|null}
 */
export function getReferenceAsString(ref: Reference | null): string | null {
	if (!ref) {
		return null;
	}

	return (
		ref.communityContext.community +
		':' +
		ref.communityContext.context +
		'-' +
		ref.type +
		'-' +
		ref.id
	);
}

export const TEMPLATE_START: string = '{{';
export const TEMPLATE_END: string = '}}';

/**
 * Replace occurances of {{XXX}} with the values of XXX from the values.
 * For example templateReplace("Hello {{name}}!", { name: 'Jane' }) would return "Hello Jane!"
 * @param template
 * @param values
 * @param valueEncoder
 * @returns {string}
 */
export function templateReplace(
	template: string,
	values: Map<string, string>,
	valueEncoder?: (v: string) => string | null
): string {
	if (!template) {
		return template;
	}

	let sb: string = '';

	// Special cases
	// "Hello {currentUser.name}, how are you?"
	// "Hello { code"
	let s: number = 0;
	do {
		let i = template.indexOf(TEMPLATE_START, s);
		if (i === -1) {
			// No more stuff, add the remainder
			sb += template.substring(s);
			break;
		}

		// Add everything before {
		sb += template.substring(s, i);

		let e: number = template.indexOf(TEMPLATE_END, i + TEMPLATE_START.length);
		if (e === -1) {
			// No more stuff, add the remainder
			sb += template.substring(i);
			break;
		}

		let n: string = template.substring(i + TEMPLATE_START.length, e);
		let v: string = values[n];
		if (v) {
			sb += valueEncoder ? valueEncoder(v) : v;
		}

		s = e + TEMPLATE_END.length;
	} while (s < template.length);

	return sb;
}

/**
 * Create a hash code of a string. Rouhgly the same impl as java.
 * @param str
 * @returns {number}
 */
export function getHashCode(str: string): number {
	if (!str) {
		return 0;
	}
	return str
		.split('')
		.reduce((prevHash, currVal) => ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0, 0);
}
