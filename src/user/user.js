//@flow
import {
	getJson,
	createCommunityUrl,
	post,
	getApiUrl,
	type XcapJsonResult,
	type AuthObject,
	type PrivilegeTypeIds,
	Order, type OrderIds, invertOrder
} from '../api.js';
import { type Request } from '../request.js';
import { type Thunk } from '../store.js';
import { AuthenticationType, type AuthenticationTypeId } from '../login/login.js';
import { type PaginatedCollection } from '../PaginatedCollection.js';
import moment from 'moment';
import _ from 'lodash/object';
import { type CurrentUserType } from '../login/loginReducer.js';
import type { Community } from '../stackend/stackend.js';

/**
 * Xcap User api constants and methods.
 * @author jens
 * @since 6 feb 2017
 */

export const TYPE_USER: string = 'net.josh.community.user.backend.xcap.XcapUser';

/**
 * Definition of a user
 */
export type User = {|
	id: number,
	__type: 'net.josh.community.user.backend.xcap.XcapUser',
	name: string,
	permalink: string,
	createdDate: number,
	obfuscatedReference: string,
	alias: string,
	firstName: string,
	lastName: string,

	/** Full name, or the alias if not set */
	nameOrAlias: string,
	/** Birth date or null if not set*/
	birthDate: ?number,
	cityId: number,

	/** City name, if set */
	city: ?string,
	online: boolean,
	userName: string,

	/** Profile image url, or null if not set */
	profileImage: ?string,
	//KING avatarCss: string,
	privileges: Array<string>,

	/* Gender. Not present if unknown */
	gender?: ?GenderType
|};

/**
 * User fields only available to privileged users
 */
export type UserPrivateDataType = User & {|
	email: string,
	status?: StatusIdType,
	zipCode?: ?string,
	nrOfLogins?: ?number
|};

/**
 * User status
 * @type {{OK: number, NOT_VERIFIED: number, BLOCKED: number, DELETED_BY_USER: number, DELETED_BY_ADMIN: number}}
 */
export const Status = {
	OK: 0,
	NOT_VERIFIED: 5,
	BLOCKED: 10,
	DELETED_BY_USER: 15,
	DELETED_BY_ADMIN: 20
};

/**
 * Valid Statuses
 */
export type StatusIdType = $Values<typeof Status>;

const STATUS_NAMES = {
	[Status.BLOCKED]: 'Blocked',
	[Status.DELETED_BY_ADMIN]: 'Deleted by admin',
	[Status.DELETED_BY_USER]: 'Deleted',
	[Status.NOT_VERIFIED]: 'Not verified',
	[Status.OK]: 'OK'
};

/**
 * Get a human readable form of the status
 * @param statusId
 * @returns string
 */
export function getStatusName(statusId: StatusIdType): string {
	if (typeof statusId === 'undefined') {
		return '?';
	}

	return STATUS_NAMES[statusId] || '?';
}

/**
 * Gender
 */
export const GenderId = {
	UNKNOWN: 0,
	FEMALE: 1,
	MALE: 2
};

export type GenderIdType = $Values<typeof GenderId>;

export const Gender = {
	UNKNOWN: 'UNKNOWN',
	FEMALE: 'FEMALE',
	MALE: 'MALE',

	getByGenderId: function(id: GenderIdType) {
		switch (id) {
			case GenderId.FEMALE:
				return Gender.FEMALE;
			case GenderId.MALE:
				return Gender.MALE;
			default:
				return Gender.UNKNOWN;
		}
	},

	getGenderId: function(gender: ?Gender) {
		switch (gender) {
			case Gender.FEMALE:
				return Gender.FEMALE;
			case Gender.MALE:
				return Gender.MALE;
			default:
				return Gender.UNKNOWN;
		}
	}
};

export type GenderType = $Values<typeof Gender>;

/**
 * User context-type
 * @type {string}
 */
export const CONTEXT: string = 'members';

/**
 * User Component name
 * @type {string}
 */
export const COMPONENT_NAME: string = 'user';

/**
 * User manager component class
 * @type {string}
 */
export const COMPONENT_CLASS: string = 'net.josh.community.user.UserManager';

/**
 * Sort order for user search
 */
export const OrderBy = {
	ALIAS: 'ALIAS',
	CREATED: 'CREATED',
	CITY: 'CITY',
	AGE: 'AGE',
	LAST_LOGIN: 'LAST_LOGIN',
	GENDER: 'GENDER',
	LAST_MODIFIED: 'LAST_MODIFIED',
	STATUS: 'STATUS'
};

export type OrderByIds = $Values<typeof OrderBy>;

export type GetUserResult = XcapJsonResult & {
	user: ?User
};

/**
 * Get the current user in the current community, or null if not authorized.
 * This involves a server request.
 * @see stackend.js:getCurrentStackendUser()
 * @return {Thunk}
 */
export function getCurrentUser(): Thunk<GetUserResult> {
	// TODO: Implement caching here
	return getJson({ url: '/user/get', componentName: COMPONENT_NAME, context: CONTEXT });
}

/**
 * Construct a link to a users profile page.
 * @param request
 * @param userId
 * @param userName
 * @param absolute
 */
export function getProfilePageUrl({
	request,
	userId,
	userName,
	absolute
}: {
	request: Request,
	userId: number,
	userName: string,
	absolute?: boolean
}): string {
	return createCommunityUrl({
		request,
		path: `/user/${userId}/${encodeURIComponent(userName)}`,
		absolute
	});
}

/**
 * Construct a link to a users profile page, supports remote profile links as well as local
 * @param request
 * @param user
 * @param community
 */
export function getProfileLink(
	request: Request,
	user: User,
	community: ?Community
): {
	url: string,
	isRemote: boolean
} {
	const useRemoteProfileLink = _.get(community, 'settings.useRemoteProfileLink', false);
	let profileLink = null;
	let isRemote = false;
	if (useRemoteProfileLink && user.profile.remoteProfileUrl) {
		profileLink = user.profile.remoteProfileUrl;
		isRemote = true;
	}

	if (!profileLink) {
		profileLink = getProfilePageUrl({ request, userId: user.id, userName: user.userName });
	}

	return {
		url: profileLink,
		isRemote
	};
}

/**
 * Check if the current user has elevated privileges (does not include rules etc).
 *
 * @param currentUser
 * @param componentContext {String} Context name, for example "members", "news", "cms"
 * @param componentClass {String} Component, for example "net.josh.community.user.UserManager", "net.josh.community.blog.BlogManager",
 * 	"se.josh.xcap.cms.CmsManager", "net.josh.community.forum.ForumManager"
 * @param privilegeType {number} Minimum required privilege
 */
export function hasElevatedPrivilege(
	currentUser?: CurrentUserType,
	componentContext: string,
	componentClass: string,
	privilegeType: number
): boolean {
	if (!currentUser || !currentUser.user) {
		return false;
	}

	const privs = currentUser.user.privileges;
	if (typeof privs === 'undefined') {
		return false;
	}

	let prefix = componentContext + ',' + componentClass;
	for (let i = 0; i < privs.length; i++) {
		let p = privs[i];
		if (!p.startsWith(prefix)) {
			continue;
		}

		let pt = p.split(',')[2];
		if (pt >= privilegeType) {
			return true;
		}
	}

	return false;
}

/**
 * Get a user.
 * Use id, alias to look up a user.
 *
 * @param id User id (required)
 * @param alias User alias (optional)
 * @returns {Promise}
 */
export function getUser({ id, alias }: { id?: number, alias?: string }): Thunk<GetUserResult> {
	return getJson({ url: '/user/get', parameters: arguments });
}

export type GetUsersResult = XcapJsonResult & {
	users: Array<User>
};

/**
 * Get multiple users by id
 * @param id
 * @returns {Promise}
 */
export function getUsers({ id }: { id: Array<number> }): Thunk<GetUsersResult> {
	return getJson({ url: '/user/get-multiple', parameters: arguments });
}

/**
 * Transform into a mutable user data that is accepted by store user
 * @param user
 */
export function getMutableUser(user: User): any {
	let birthYear = undefined,
		birthMonth = undefined,
		birthDay = undefined;

	let profileEntries = _.get(user, 'profile', {});
	if (user && user.birthDate) {
		let d = moment(user.birthDate);
		birthYear = d.year();
		birthMonth = d.month() + 1;
		birthDay = d.date();
	}

	return {
		id: _.get(user, 'id'),
		email: _.get(user, 'email'),
		firstName: _.get(user, 'firstName', ''),
		lastName: _.get(user, 'lastName', ''),
		gender: _.get(user, 'gender', GenderId.UNKNOWN),
		cityId: _.get(user, 'cityId', 0),
		birthYear,
		birthMonth,
		birthDay,
		showBirthDay: birthYear ? true : false,
		zipCode: _.get(user, 'zipCode', undefined),
		termsAccept: true,
		...profileEntries
	};
}

export type StoreUserResult = XcapJsonResult & {
	user: ?User
};

/**
 * Store a user.
 *
 * All parameters except id are optional. If not present, they will not be changed.
 *
 * @param id
 * @param alias
 * @param email
 * @param firstName
 * @param lastName
 * @param gender
 * @param cityId
 * @param birthYear
 * @param birthMonth
 * @param birthDay
 * @param showBirthDay
 * @param zipCode
 * @param termsAccept Accept the terms and conditions
 * @param profileEntries Other entries
 */
export function storeUser({
	id,
	alias,
	email,
	firstName,
	lastName,
	gender,
	cityId,
	birthYear,
	birthMonth,
	birthDay,
	showBirthDay,
	zipCode,
	termsAccept,
	...profileEntries
}: {
	id?: number,
	alias?: string,
	email?: string,
	firstName?: string,
	lastName?: string,
	gender?: string,
	cityId?: number,
	birthYear?: number,
	birthMonth?: number,
	birthDay?: number,
	showBirthDay?: boolean,
	zipCode?: number,
	termsAccept?: boolean,
	profileEntries?: any
}): Thunk<StoreUserResult> {
	return post({ url: '/user/store', parameters: arguments });
}

export type GetUserPrivilegesResult = XcapJsonResult & {
	auth: AuthObject,
	privilegeType: PrivilegeTypeIds
};

/**
 * Get the current users privileges for a given component/context
 * @param componentContext {String} Context name, for example "members", "news", "cms"
 * @param componentClass {String} Component, for example "net.josh.community.user.UserManager", "net.josh.community.blog.BlogManager",
 * 	"se.josh.xcap.cms.CmsManager", "net.josh.community.forum.ForumManager"
 * @param externalTypeId {number}
 * @returns {Promise}
 */
export function getUserPrivileges({
	componentContext,
	componentClass,
	externalTypeId
}: {
	componentContext: string,
	componentClass: string,
	externalTypeId: number
}): Thunk<GetUserPrivilegesResult> {
	return getJson({ url: '/user/get-privileges', parameters: arguments });
}

const ORDER_MAPPING = {
	[OrderBy.ALIAS + Order.DESCENDING]: 1,
	[OrderBy.ALIAS + Order.ASCENDING]: 2,
	[OrderBy.CREATED + Order.DESCENDING]: 3,
	[OrderBy.CREATED + Order.ASCENDING]: 4,
	[OrderBy.CITY + Order.ASCENDING]: 5,
	[OrderBy.CITY + Order.DESCENDING]: 6,
	[OrderBy.AGE + Order.ASCENDING]: 7,
	[OrderBy.AGE + Order.DESCENDING]: 8,
	[OrderBy.LAST_LOGIN + Order.ASCENDING]: 9,
	[OrderBy.LAST_LOGIN + Order.DESCENDING]: 10,
	[OrderBy.GENDER + Order.DESCENDING]: 11,
	[OrderBy.GENDER + Order.ASCENDING]: 12,
	[OrderBy.LAST_MODIFIED + Order.DESCENDING]: 13,
	[OrderBy.STATUS + Order.ASCENDING]: 14
};

/**
 * Maps order by and order to xcap values
 * @param orderBy
 * @param order
 * @returns {number}
 */
function convertSortOrder(orderBy: ?OrderByIds, order: ?OrderIds): number {
	let k = (orderBy || OrderBy.ALIAS) + (order || Order.ASCENDING);
	let v = ORDER_MAPPING[k];
	if (v) {
		return v;
	}

	// Order may not be supported. Try the inverted order
	k = (orderBy || OrderBy.ALIAS) + invertOrder(order || Order.ASCENDING);
	v = ORDER_MAPPING[k];
	if (v) {
		return v;
	}

	return ORDER_MAPPING[OrderBy.ALIAS + Order.ASCENDING];
}

export type SearchResult = XcapJsonResult & {
	users: PaginatedCollection<User>
};

/**
 * Search for users.
 *
 * @param q Serch string
 * @param allowEmptySearch Will empty searches be allowed and return all matches?
 * @param excludeCurrentUser Should the current user be ignored?
 * @param p Page number
 * @param pageSie Page size
 */
export function search({
	q = null,
	allowEmptySearch = true,
	excludeCurrentUser = false,
	p = 1,
	pageSize = 10,
	orderBy = OrderBy.ALIAS,
	order = Order.ASCENDING,
	community
}: {
	q?: any,
	allowEmptySearch?: boolean,
	excludeCurrentUser?: boolean,
	p?: number,
	pageSize?: number,
	orderBy?: ?OrderByIds,
	order?: ?OrderIds,
	community?: string
}): Thunk<SearchResult> {
	const sortOrder = convertSortOrder(orderBy, order);

	return getJson({
		url: '/user/search',
		parameters: { q, allowEmptySearch, excludeCurrentUser, p, pageSize, orderBy: sortOrder },
		community
	});
}

export type SetProfileImageResult = XcapJsonResult & {
	imageId: number
};

/**
 * Set profile image of the current user
 *
 * @param imageId Image id (from the members context)
 * @returns {Promise}
 */
export function setProfileImage({
	imageId,
	community
}: {
	imageId: number,
	community?: string
}): Thunk<SetProfileImageResult> {
	return post({
		url: '/user/set-profile-image',
		parameters: { imageId: imageId },
		community
	});
}

/**
 * Remove profile image of the current user
 *
 * @returns {Promise}
 */
export function removeProfileImage({ community }: { community?: string }): Thunk<XcapJsonResult> {
	return post({
		url: '/user/remove-profile-image',
		community
	});
}

/**
 * Get the url to a users feed.
 * @param userId {Integer} optional, defaults to current user
 * @returns {String}
 */
export function getUserFeedUrl({ userId }: { userId: number }): Thunk<string> {
	return getApiUrl({
		url: '/user/feed',
		parameters: arguments
	});
}

export type IsEmailFreeResult = XcapJsonResult & {
	email: ?string,
	isEmailFree: boolean
};

/**
 * Check if the email is free for registration
 * @param email
 */
export function isEmailFree({ email }: { email: string }): Thunk<IsEmailFreeResult> {
	return getJson({
		url: '/user/register/is-email-free',
		parameters: arguments
	});
}

export type IsAliasFreeResult = XcapJsonResult & {
	alias: ?string,
	isAliasFree: boolean
};

/**
 * Check if the alias is free for registration
 * @param email
 */
export function isAliasFree({ alias }: { alias: string }): Thunk<IsAliasFreeResult> {
	return getJson({
		url: '/user/register/is-alias-free',
		parameters: arguments
	});
}

export type GetRegistrationDataResult = XcapJsonResult & {
	/** Email, if available */
	email: ?string,

	/** Should the user be able to edit the email? */
	isEmailEditable: boolean,

	/** Unique alias (generated) */
	alias: ?string,

	/** Non unique user name */
	username: ?string,

	/** Should the user be able to edit the user name? */
	isUsernameEditable: boolean,

	/** Id in the remote system */
	referenceId: number,

	/** */
	authenticationType: AuthenticationTypeId,

	cityId: number,

	/** Gender  */
	gender: ?GenderIdType,

	/** First name */
	firstName: ?string,

	/** Last name */
	lastName: ?string,

	/** Birth date, if available */
	birthDate: ?number
};

/**
 * Get data needed to make a registration.
 *
 * @returns {Thunk<GetRegistrationDataResult>}
 */
export function getFacebookRegistrationData({}: {}): Thunk<GetRegistrationDataResult> {
	return getJson({
		url: '/user/register/facebook',
		parameters: arguments
	});
}

/**
 * Submit additional information when registering a facebook user
 *
 * @param email
 * @param username
 * @param firstName
 * @param lastName
 * @param gender
 * @param birthDate
 * @param termsAccept
 * @param returnUrl optional return url
 * @returns {Thunk<XcapJsonResult>}
 */
export function registerFacebookUser({
	email,
	username,
	firstName,
	lastName,
	gender,
	birthDate,
	termsAccept,
	returnUrl
}: {
	email?: string,
	username?: string,
	firstName?: string,
	lastName?: string,
	gender?: GenderIdType,
	birthDate?: string,
	termsAccept?: boolean,
	returnUrl?: string
}): Thunk<XcapJsonResult> {
	return post({
		url: '/user/register/facebook/save',
		parameters: arguments
	});
}

/**
 * Remove a facebook login reference
 * @param facebookId
 * @returns {Thunk<XcapJsonResult>}
 */
export function removeFacebookReference({
	facebookId
}: {
	facebookId?: ?string
}): Thunk<XcapJsonResult> {
	return post({
		url: '/user/auth/facebook/remove',
		parameters: arguments
	});
}

/**
 * Remove a Google login reference
 * @param userReferenceId
 * @returns {Thunk<XcapJsonResult>}
 */
export function removeGoogleReference({
	userReferenceId
}: {
	userReferenceId?: ?string
}): Thunk<XcapJsonResult> {
	return post({
		url: '/user/auth/google/remove',
		parameters: arguments
	});
}

/**
 * Submit additional information when registering a google user
 *
 * @param email
 * @param username
 * @param firstName
 * @param lastName
 * @param gender
 * @param birthDate
 * @param termsAccept
 * @param returnUrl optional return url
 * @returns {Thunk<XcapJsonResult>}
 */
export function registerGoogleUser({
	email,
	username,
	firstName,
	lastName,
	gender,
	birthDate,
	termsAccept,
	returnUrl
}: {
	email?: string,
	username?: string,
	firstName?: string,
	lastName?: string,
	gender?: GenderIdType,
	birthDate?: string,
	termsAccept?: boolean,
	returnUrl?: string
}): Thunk<XcapJsonResult> {
	return post({
		url: '/user/register/google',
		parameters: arguments
	});
}

/**
 * Submit additional information when registering a OAuth2 user
 *
 * @param email
 * @param username
 * @param firstName
 * @param lastName
 * @param gender
 * @param birthDate
 * @param termsAccept
 * @param returnUrl optional return url
 * @returns {Thunk<XcapJsonResult>}
 */
export function registerOAuth2User({
	email,
	username,
	firstName,
	lastName,
	gender,
	birthDate,
	termsAccept,
	returnUrl
}: {
	email?: string,
	username?: string,
	firstName?: string,
	lastName?: string,
	gender?: GenderIdType,
	birthDate?: string,
	termsAccept?: boolean,
	returnUrl?: string
}): Thunk<XcapJsonResult> {
	return post({
		url: '/user/register/oauth2',
		parameters: arguments
	});
}

export type VerifyEmailResult = XcapJsonResult & {
	/** Was the validation successfull? */
	valid: boolean,

	/** Does the user need to enter additional data? */
	register: boolean,
	returnUrl: ?string,

	/** Permalink of the users first, automatically created community */
	firstCommunityPermalink?: ?string
};

/**
 * Send an email with a verification code link.
 * This is done to validate that this is an actual email address owned by the user.
 *
 * @param email
 * @param authenticationType
 * @param returnUrl optional returnUrl to include in the mail
 * @returns {Thunk<VerifyEmailResult>}
 * @see verifyEmail
 */
export function sendVerificationEmail({
	email,
	authenticationType = AuthenticationType.FACEBOOK,
	returnUrl
}: {
	email: string,
	authenticationType?: string,
	returnUrl?: string
}): Thunk<VerifyEmailResult> {
	return post({
		url: '/user/register/send-verification-email',
		parameters: arguments
	});
}

/**
 * Verify a user email by posting the code recieved in an email.
 *
 * @param email
 * @param code
 * @param login. Should the user be logged in on successufull verification?s
 * @param returnUrl Optional return url
 * @returns {Thunk<VerifyEmailResult>}
 * @see sendVerificationEmail
 */
export function verifyEmail({
	email,
	code,
	login,
	returnUrl
}: {
	email: string,
	code: string,
	login?: boolean,
	returnUrl?: string
}): Thunk<VerifyEmailResult> {
	return post({
		url: '/user/register/verify-email',
		parameters: arguments
	});
}

export type RegisterUserResult = XcapJsonResult & {
	user: User
};

/**
 * Register a user using an email address.
 *
 * @param email
 * @param username
 * @param firstName
 * @param lastName
 * @param gender
 * @param birthYear
 * @param birthMonth
 * @param birthDay
 * @param showBirthDay
 * @param termsAccept
 * @param returnUrl optional return url
 * @returns {Thunk<RegisterUserResult>}
 */
export function registerUser({
	email,
	username,
	firstName,
	lastName,
	gender,
	birthYear,
	birthMonth,
	birthDay,
	showBirthDay,
	termsAccept,
	returnUrl
}: {
	email?: string,
	username?: string,
	firstName?: string,
	lastName?: string,
	gender?: GenderIdType,
	birthYear?: number,
	birthMonth?: number,
	birthDay?: number,
	showBirthDay?: boolean,
	termsAccept?: boolean,
	returnUrl?: string
}): Thunk<RegisterUserResult> {
	return post({
		url: '/user/register/email',
		parameters: arguments
	});
}

/**
 * Activity statistics for a user. If any of the counts equals -1, that feature is disabled.
 */
export type UserStatistics = {
	userId: number,
	numberOfPosts: number,
	numberOfComments: number,
	numberOfForumEntries: number,
	numberOfQuestions: number,
	numberOfAnswers: number,
	numberOfLikes: number
};

export type GetUserStatisticsResult = XcapJsonResult & {
	user: ?User,
	userStatistics: ?UserStatistics
};

/**
 * Get activity counters for a user
 * @param id
 * @returns {*}
 */
export function getStatistics({ id }: { id: number }): Thunk<GetUserStatisticsResult> {
	return getJson({
		url: '/user/statistics',
		parameters: { id }
	});
}

/**
 * Check if a password is acceptable
 * @param password
 * @returns {string|boolean|(Array<string>&{index: number, input: string, groups})}
 */
export function isPasswordAcceptable(password: string): boolean {
	return password && password.length >= 6 && password.match(/[0-9]/);
}

export type ListAutenticationOptionsResult = XcapJsonResult & {
	user: ?User,
	availableOptions: Array<AuthenticationTypeId>,
	enabledOptions: Array<AuthenticationTypeId>
};

/**
 * List available and enabled autentication options of the current user.
 * @returns {Thunk<XcapJsonResult>}
 */
export function listAutenticationOptions({}: any): Thunk<ListAutenticationOptionsResult> {
	return getJson({
		url: '/user/auth/list-options',
		parameters: arguments
	});
}

/**
 * Block/unblock a user. Requires stackend community admin status.
 * @param id
 * @param block
 * @param comment
 * @returns {Thunk<XcapJsonResult>}
 */
export function setBlocked({
	id,
	block,
	comment
}: {
	id: number,
	block: boolean,
	comment?: ?string
}): Thunk<XcapJsonResult> {
	return post({
		url: '/user/set-blocked',
		parameters: arguments
	});
}

export function listOnline() {
	return getJson({
		url: '/user/list-online',
		parameters: arguments
	});
}
