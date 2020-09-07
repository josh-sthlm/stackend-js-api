import {
  getJson,
  createCommunityUrl,
  post,
  getApiUrl,
  XcapJsonResult,
  Order,
  invertOrder,
  Thunk,
  XcapOptionalParameters,
} from '../api';
import { Request } from '../request';
import { AuthenticationType } from '../login';
import { PaginatedCollection } from '../api/PaginatedCollection';
import moment from 'moment';
import _ from 'lodash';
import { CurrentUserType } from '../login/loginReducer';
import { Community } from '../stackend';
import { AuthObject, PrivilegeTypeId, PrivilegeTypeIds } from './privileges';

export const TYPE_USER = 'net.josh.community.user.backend.xcap.XcapUser';

/**
 * Definition of a user
 */
export interface User {
  id: number;
  __type: 'net.josh.community.user.backend.xcap.XcapUser';
  name: string;

  /**
   * Url safe version of name
   */
  permalink: string;
  createdDate: number;
  obfuscatedReference: string;

  alias: string;
  firstName: string;
  lastName: string;
  userName: string;

  /** Full name, or the alias if not set */
  nameOrAlias: string;

  /** Birth date or null if not set*/
  birthDate: number | null;
  cityId: number;

  /** City name, if set */
  city: string | null;
  online: boolean;

  /** Profile image url, or null if not set */
  profileImage: string | null;

  /** Additional profile data */
  profile: {
    [key: string]: string;
  };

  /** Privileges. using the format: context,componentName,privilegeType */
  privileges: Array<string>;

  /* Gender. Not present if unknown */
  gender?: GenderType | null;
}

/**
 * User fields only available to privileged users
 */
export interface UserPrivateDataType extends User {
  email: string;
  status?: StatusIdType;
  zipCode?: string | null;
  nrOfLogins?: number | null;
}

/**
 * User status
 * @type {{OK: number, NOT_VERIFIED: number, BLOCKED: number, DELETED_BY_USER: number, DELETED_BY_ADMIN: number}}
 */
export enum Status {
  OK = 0,
  NOT_VERIFIED = 5,
  BLOCKED = 10,
  DELETED_BY_USER = 15,
  DELETED_BY_ADMIN = 20,
}

/**
 * Valid Statuses
 */
export type StatusIdType = 0 | 5 | 10 | 15 | 20;

const STATUS_NAMES = {
  [Status.BLOCKED]: 'Blocked',
  [Status.DELETED_BY_ADMIN]: 'Deleted by admin',
  [Status.DELETED_BY_USER]: 'Deleted',
  [Status.NOT_VERIFIED]: 'Not verified',
  [Status.OK]: 'OK',
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
export enum GenderId {
  UNKNOWN = 0,
  FEMALE = 1,
  MALE = 2,
}

export type GenderIdType = 0 | 1 | 2;

/**
 * Gender constants
 */
export const Gender: any = {
  UNKNOWN: 'UNKNOWN',
  FEMALE: 'FEMALE',
  MALE: 'MALE',

  // TODO: Better alternative? Typescript does not support functions in enums like java

  getByGenderId: function (id: GenderIdType): typeof Gender {
    switch (id) {
      case GenderId.FEMALE:
        return Gender.FEMALE;
      case GenderId.MALE:
        return Gender.MALE;
      default:
        return Gender.UNKNOWN;
    }
  },

  getGenderId: function (gender: string | null): GenderIdType {
    switch (gender) {
      case Gender.FEMALE:
        return GenderId.FEMALE;
      case Gender.MALE:
        return GenderId.MALE;
      default:
        return GenderId.UNKNOWN;
    }
  },
};

export type GenderType = 'FEMALE' | 'MALE' | 'UNKNOWN';

/**
 * User context-type
 * @type {string}
 */
export const CONTEXT = 'members';

/**
 * User Component name
 * @type {string}
 */
export const COMPONENT_NAME = 'user';

/**
 * User manager component class
 * @type {string}
 */
export const COMPONENT_CLASS = 'net.josh.community.user.UserManager';

/**
 * Sort order for user search
 */
export enum OrderBy {
  ALIAS = 'ALIAS',
  CREATED = 'CREATED',
  CITY = 'CITY',
  AGE = 'AGE',
  LAST_LOGIN = 'LAST_LOGIN',
  GENDER = 'GENDER',
  LAST_MODIFIED = 'LAST_MODIFIED',
  STATUS = 'STATUS',
}

export interface GetUserResult extends XcapJsonResult {
  user: User | null;
}

/**
 * Get the current user in the current community, or null if not authorized.
 * This involves a server request.
 * @see index.ts:getCurrentStackendUser()
 * @return {Thunk}
 */
export function getCurrentUser(): Thunk<Promise<GetUserResult>> {
  // TODO: Implement caching here
  return getJson({
    url: '/user/get',
    componentName: COMPONENT_NAME,
    context: CONTEXT,
  });
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
  absolute,
}: {
  request: Request;
  userId: number;
  userName: string;
  absolute?: boolean;
}): string {
  return createCommunityUrl({
    request,
    path: `/user/${userId}/${encodeURIComponent(userName)}`,
    absolute,
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
  community: Community | null
): {
  url: string;
  isRemote: boolean;
} {
  const useRemoteProfileLink = _.get(community, 'settings.useRemoteProfileLink', false);
  let profileLink = null;
  let isRemote = false;
  if (useRemoteProfileLink && user.profile && user.profile.remoteProfileUrl) {
    profileLink = user.profile.remoteProfileUrl;
    isRemote = true;
  }

  if (!profileLink) {
    profileLink = getProfilePageUrl({
      request,
      userId: user.id,
      userName: user.userName,
    });
  }

  return {
    url: profileLink,
    isRemote,
  };
}

/**
 * Check if the current user has elevated privileges (does not include rules etc).
 *
 * @param currentUser
 * @param componentContext {String} Context name, for example "members", "news", "cms"
 * @param componentClass {String} Component, for example "net.josh.community.user.UserManager", "net.josh.community.blog.BlogManager",
 *  "se.josh.xcap.cms.CmsManager", "net.josh.community.forum.ForumManager"
 * @param privilegeType {number} Minimum required privilege
 */
export function hasElevatedPrivilege(
  currentUser: CurrentUserType | User | null,
  componentContext: string,
  componentClass: string,
  privilegeType: PrivilegeTypeId
): boolean {
  if (!currentUser) {
    return false;
  }

  let privs: Array<string> | null = null;
  if (typeof (currentUser as User).privileges !== 'undefined') {
    privs = (currentUser as User).privileges;
  } else if ((currentUser as CurrentUserType).user) {
    const user = (currentUser as CurrentUserType).user;
    if (!user) {
      return false;
    }
    privs = user.privileges;
  }

  if (typeof privs === 'undefined' || !privs) {
    return false;
  }

  const prefix = componentContext + ',' + componentClass;
  for (let i = 0; i < privs.length; i++) {
    const p = privs[i];
    if (!p.startsWith(prefix)) {
      continue;
    }

    const pt = parseInt(p.split(',')[2]);
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
export function getUser({
  id,
  alias,
}: {
  id?: number;
  alias?: string;
} & XcapOptionalParameters): Thunk<Promise<GetUserResult>> {
  return getJson({ url: '/user/get', parameters: arguments });
}

export interface GetUsersResult extends XcapJsonResult {
  users: Array<User>;
}

/**
 * Get multiple users by id
 * @param id
 * @returns {Promise}
 */
export function getUsers({ id }: { id: Array<number> } & XcapOptionalParameters): Thunk<Promise<GetUsersResult>> {
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

  const profileEntries = _.get(user, 'profile', {});
  if (user && user.birthDate) {
    const d = moment(user.birthDate);
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
    ...profileEntries,
  };
}

export interface StoreUserResult extends XcapJsonResult {
  user: User | null;
}

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
  id?: number;
  alias?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  cityId?: number;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  showBirthDay?: boolean;
  zipCode?: number;
  termsAccept?: boolean;
  profileEntries?: any;
} & XcapOptionalParameters): Thunk<Promise<StoreUserResult>> {
  return post({ url: '/user/store', parameters: arguments });
}

export interface GetUserPrivilegesResult extends XcapJsonResult {
  auth: AuthObject;
  privilegeType: PrivilegeTypeIds;
}

/**
 * Get the current users privileges for a given component/context
 * @param componentContext {String} Context name, for example "members", "news", "cms"
 * @param componentClass {String} Component, for example "net.josh.community.user.UserManager", "net.josh.community.blog.BlogManager",
 *  "se.josh.xcap.cms.CmsManager", "net.josh.community.forum.ForumManager"
 * @param externalTypeId {number}
 * @returns {Promise}
 */
export function getUserPrivileges({
  componentContext,
  componentClass,
  externalTypeId,
}: {
  componentContext: string;
  componentClass: string;
  externalTypeId: number;
} & XcapOptionalParameters): Thunk<Promise<GetUserPrivilegesResult>> {
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
  [OrderBy.STATUS + Order.ASCENDING]: 14,
};

/**
 * Maps order by and order to xcap values
 * @param orderBy
 * @param order
 * @returns {number}
 */
function convertSortOrder(orderBy: OrderBy | null, order: Order | null): number {
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

export interface SearchResult extends XcapJsonResult {
  users: PaginatedCollection<User>;
}

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
  community,
}: {
  q?: any;
  allowEmptySearch?: boolean;
  excludeCurrentUser?: boolean;
  p?: number;
  pageSize?: number;
  orderBy?: OrderBy | null;
  order?: Order | null;
  community?: string;
} & XcapOptionalParameters): Thunk<Promise<SearchResult>> {
  const sortOrder = convertSortOrder(orderBy, order);

  return getJson({
    url: '/user/search',
    parameters: {
      q,
      allowEmptySearch,
      excludeCurrentUser,
      p,
      pageSize,
      orderBy: sortOrder,
    },
    community,
  });
}

export interface SetProfileImageResult extends XcapJsonResult {
  imageId: number;
}

/**
 * Set profile image of the current user
 *
 * @param imageId Image id (from the members context)
 * @param community
 * @returns {Promise}
 */
export function setProfileImage({
  imageId,
  community,
}: {
  imageId: number;
  community?: string;
} & XcapOptionalParameters): Thunk<Promise<SetProfileImageResult>> {
  return post({
    url: '/user/set-profile-image',
    parameters: { imageId: imageId },
    community,
  });
}

/**
 * Remove profile image of the current user
 *
 * @returns {Promise}
 */
export function removeProfileImage({
  community,
}: {
  community?: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/remove-profile-image',
    community,
  });
}

/**
 * Get the url to a users feed.
 * @param userId optional, defaults to current user
 * @returns {String}
 */
export function getUserFeedUrl({ userId }: { userId: number }): Thunk<string> {
  return getApiUrl({
    url: '/user/feed',
    parameters: arguments,
  });
}

export interface IsEmailFreeResult extends XcapJsonResult {
  email: string | null;
  isEmailFree: boolean;
}

/**
 * Check if the email is free for registration
 * @param email
 */
export function isEmailFree({
  email,
}: {
  email: string;
} & XcapOptionalParameters): Thunk<Promise<IsEmailFreeResult>> {
  return getJson({
    url: '/user/register/is-email-free',
    parameters: arguments,
  });
}

export interface IsAliasFreeResult extends XcapJsonResult {
  alias: string | null;
  isAliasFree: boolean;
}

/**
 * Check if the alias is free for registration
 * @param email
 */
export function isAliasFree({
  alias,
}: {
  alias: string;
} & XcapOptionalParameters): Thunk<Promise<IsAliasFreeResult>> {
  return getJson({
    url: '/user/register/is-alias-free',
    parameters: arguments,
  });
}

export interface GetRegistrationDataResult extends XcapJsonResult {
  /** Email, if available */
  email: string | null;

  /** Should the user be able to edit the email? */
  isEmailEditable: boolean;

  /** Unique alias (generated) */
  alias: string | null;

  /** Non unique user name */
  username: string | null;

  /** Should the user be able to edit the user name? */
  isUsernameEditable: boolean;

  /** Id in the remote system */
  referenceId: number;

  /** */
  authenticationType: AuthenticationType;

  cityId: number;

  /** Gender  */
  gender: GenderIdType | null;

  /** First name */
  firstName: string | null;

  /** Last name */
  lastName: string | null;

  /** Birth date, if available */
  birthDate: number | null;
}

/**
 * Get data needed to make a registration.
 *
 * @returns {Thunk<GetRegistrationDataResult>}
 */
export function getFacebookRegistrationData({}: XcapOptionalParameters): Thunk<
  Promise<GetRegistrationDataResult>
> {
  return getJson({
    url: '/user/register/facebook',
    parameters: arguments,
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
  returnUrl,
}: {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: GenderIdType;
  birthDate?: string;
  termsAccept?: boolean;
  returnUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/register/facebook/save',
    parameters: arguments,
  });
}

/**
 * Remove a facebook login reference
 * @param facebookId
 * @returns {Thunk<XcapJsonResult>}
 */
export function removeFacebookReference({
  facebookId,
}: {
  facebookId?: string | null;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/auth/facebook/remove',
    parameters: arguments,
  });
}

/**
 * Remove a Google login reference
 * @param userReferenceId
 * @returns {Thunk<XcapJsonResult>}
 */
export function removeGoogleReference({
  userReferenceId,
}: {
  userReferenceId?: string | null;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/auth/google/remove',
    parameters: arguments,
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
  returnUrl,
}: {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: GenderIdType;
  birthDate?: string;
  termsAccept?: boolean;
  returnUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/register/google',
    parameters: arguments,
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
  returnUrl,
}: {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: GenderIdType;
  birthDate?: string;
  termsAccept?: boolean;
  returnUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/register/oauth2',
    parameters: arguments,
  });
}

export interface VerifyEmailResult extends XcapJsonResult {
  /** Was the validation successful? */
  valid: boolean;

  /** Does the user need to enter additional data? */
  register: boolean;
  returnUrl: string | null;

  /** Permalink of the users first, automatically created community */
  firstCommunityPermalink?: string | null;
}

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
  returnUrl,
}: {
  email: string;
  authenticationType?: string;
  returnUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<VerifyEmailResult>> {
  return post({
    url: '/user/register/send-verification-email',
    parameters: arguments,
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
  returnUrl,
}: {
  email: string;
  code: string;
  login?: boolean;
  returnUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<VerifyEmailResult>> {
  return post({
    url: '/user/register/verify-email',
    parameters: arguments,
  });
}

export interface RegisterUserResult extends XcapJsonResult {
  user: User;
}

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
  returnUrl,
}: {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: GenderIdType;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  showBirthDay?: boolean;
  termsAccept?: boolean;
  returnUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<RegisterUserResult>> {
  return post({
    url: '/user/register/email',
    parameters: arguments,
  });
}

/**
 * Activity statistics for a user. If any of the counts equals -1, that feature is disabled.
 */
export interface UserStatistics {
  userId: number;
  numberOfPosts: number;
  numberOfComments: number;
  numberOfForumEntries: number;
  numberOfQuestions: number;
  numberOfAnswers: number;
  numberOfLikes: number;
}

export interface GetUserStatisticsResult extends XcapJsonResult {
  user: User | null;
  userStatistics: UserStatistics | null;
}

/**
 * Get activity counters for a user
 * @param id
 * @returns {*}
 */
export function getStatistics({
  id,
}: {
  id: number;
} & XcapOptionalParameters): Thunk<Promise<GetUserStatisticsResult>> {
  return getJson({
    url: '/user/statistics',
    parameters: { id },
  });
}

/**
 * Check if a password is acceptable
 * @param password
 * @returns {string|boolean|(Array<string>&{index: number, input: string, groups})}
 */
export function isPasswordAcceptable(password: string | null): boolean {
  return !!password && password.length >= 6 && !!password.match(/[0-9]/);
}

export interface ListAuthenticationOptionsResult extends XcapJsonResult {
  user: User | null;
  availableOptions: Array<AuthenticationType>;
  enabledOptions: Array<AuthenticationType>;
}

/**
 * List available and enabled authentication options of the current user.
 * @returns {Thunk<XcapJsonResult>}
 */
export function listAuthenticationOptions({}: XcapOptionalParameters): Thunk<Promise<ListAuthenticationOptionsResult>> {
  return getJson({
    url: '/user/auth/list-options',
    parameters: arguments,
  });
}

/**
 * Block/unblock a user. Requires stackend community admin status.
 * @param id
 * @param block
 * @param comment
 */
export function setBlocked({
  id,
  block,
  comment,
}: {
  id: number;
  block: boolean;
  comment?: string | null;
} & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/set-blocked',
    parameters: arguments,
  });
}

export function listOnline({}: XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  return getJson({
    url: '/user/list-online',
    parameters: arguments,
  });
}
