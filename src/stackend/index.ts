//@flow
import { Request } from '../request';
import {
  getJson,
  post,
  getCurrentCommunityPermalink,
  XcapJsonResult,
  Order,
  XcapObject,
  ModerationStatus,
  Thunk,
} from '../api';
import { fetchModules } from './moduleAction';
import { hasElevatedPrivilege, User } from '../user';
import { PaginatedCollection } from '../api/PaginatedCollection';
import { CurrentUserType } from '../login/loginReducer';
import { PrivilegeTypeId, PrivilegeTypeIds } from '../user/privileges';
import { Image } from '../media';

/**
 * Stackend API constants and methods.
 *
 * @since 20 apr 2017
 */

/**
 *  CommunityStatus
 * @type {{VISIBLE: string, HIDDEN: string, REMOVED: string}}
 */
export enum CommunityStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  REMOVED = 'REMOVED',
}

/**
 * Xcap community name for stackend.
 * @type {string}
 */
export const STACKEND_COMMUNITY = 'stackend';

/**
 * Commmunity permalink used for stackend.com news and examples
 * @type {string}
 */
export const STACKEND_DOT_COM_COMMUNITY = 'stackend-com';

/**
 * Definition of a community
 */
export interface Community extends XcapObject {
  __type: 'se.josh.xcap.community.Community';
  permalink: string;
  name: string;
  description: string;
  status: string /** CommunityStatus */;
  logotype: Image | null;
  domains: Array<string>;
  adminUserIds: Array<number>;
  moderatorUserIds: Array<number>;
  locale: string;
  xcapCommunityName: string;
  creatorUserId: number;
  creatorUserRef: User | null;
  createdDate: number;
  modStatus: string;
  expiresDate: number;
  theme: string;
  settings: any;
  style: any;
}

/**
 * Community setting keys
 */
export const CommmunitySettings = {
  LOGIN_ENABLED: 'loginEnabled',
  REGISTER_ENABLED: 'registerEnabled',
  TERMS_AND_CONDITIONS_LINK: 'termsAndConditionsLink',
  FACEBOOK_LOGIN: 'facebookLogin',
  GOOGLE_LOGIN: 'googleLogin',
  OAUTH2_LOGIN: 'oauth2Login',
};

export interface Module {
  id: number;
  communityId: number;
  name: string;
  enabled: boolean;
  componentContext: string;
  componentClass: any;
  componentName: string;
  hasCategories: boolean;
  objectReference: string;
  objectRef: any;
  ruleTypeId: number;
  settings: string;
  style: string;
}

export interface ModuleRule {
  /** Create privilege */
  createPrivilege: PrivilegeTypeIds;
  moderationStatus: ModerationStatus;
  postModerationTtlMinutes: number;
  contentFiltering: boolean;
  trustedUsers: Array<User>;
}

export interface ModuleStats {
  numberOfMembers: number /** -1 for unknown */;
  numberOfPosts: number /** -1 for unknown */;
  numberOfComments: number /** -1 for unknown */;
}

export interface CommunityStats {
  numberOfModules: number;
  objectsAwaitingModeration: number;
  numberOfUsers: number;
  numberOfActiveUsers: number;
  mediaFileSize: number;
  numberOfPosts: number;
}

/**
 * A community theme
 */
export const Theme = {
  STACKEND: 'stackend',
};

/**
 * Community search sort ordering
 */
export enum OrderBy {
  NAME = 'NAME',
  CREATED_DATE = 'CREATED_DATE',
}

/**
 * Given a theme, get a human readable label
 * @param theme
 * @returns {string}
 */
export function getThemeLabel(theme: string): string {
  if (!theme || theme.length === 0) {
    return '';
  }

  const r = theme.replace(/_/g, ' ');
  return r.charAt(0).toUpperCase() + r.substring(1).toLowerCase();
}

/**
 * CommunityManager context
 * @type {string}
 */
export const COMMUNITY_MANAGER_CONTEXT = 'community';

/**
 * CommunityManager component class
 * @type {string}
 */
export const COMPONENT_CLASS = 'se.josh.xcap.community.CommunityManager';

/**
 * Community permalink reserverd for news and documentation on stackend.com
 * @type {string}
 */
export const STACKEND_COM_COMMUNITY_PERMALINK = 'stackend-com';

export interface GetCommunityResult extends XcapJsonResult {
  communityFromDomain: boolean;
  stackendCommunity: Community | null;
  /**
   * Number of objects waiting for moderation. Available to admins only.
   */
  objectsRequiringModeration: number;
}

/**
 * Get a community.
 * If no parameter is present, the domain is taken from the referer header.
 *
 * @param id {String}
 * @param permalink {String}
 * @param domain {String}
 *
 */
export function getCommunity({
  id,
  permalink,
  domain,
}: {
  id?: number;
  permalink?: string;
  domain?: string;
}): Thunk<Promise<GetCommunityResult>> {
  return getJson({
    url: '/stackend/community/get',
    parameters: {
      id,
      permalink,
      domain,
    },
    community: STACKEND_COMMUNITY,
  });
}

export interface ValidateCommunityPermalinkResult extends XcapJsonResult {
  valid: boolean;
  suggestions: Array<string>;
}

/**
 * Validate a community permalink and get suggestions based on the permalink/name.
 *
 * @param permalink {String}
 * @param name {String} generate permalink suggestions based on this name (Optional)
 *
 */
export function validateCommunityPermalink({
  permalink,
  name,
}: {
  permalink: string;
  name?: string;
}): Thunk<Promise<ValidateCommunityPermalinkResult>> {
  return getJson({
    url: '/stackend/community/validate-permalink',
    parameters: {
      permalink,
      name,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Create, but do not store a new community object that can be used to store
 * @param name
 * @param permalink
 */
export function newCommunity(name: string, permalink: string): any {
  return {
    id: 0,
    permalink,
    name,
    description: '',
    status: CommunityStatus.VISIBLE,
    locale: 'en_US',
    domains: [],
    logotypeId: 0,
    admins: [],
    moderators: [],
    theme: Theme.STACKEND,
  };
}

export interface StoreCommunityResult extends XcapJsonResult {
  storedCommunity: Community;
}

/**
 * Edit/create a community.
 *
 * @param id {String} (optional, only when editing)
 * @param permalink {String} Required
 * @param name {String} Name
 * @param description {String}
 * @param status {CommunityStatus}
 * @param locale {String} Locale (default: en_US)
 * @param domains {string[]} List of valid domains
 * @param settings {String} Implementation specific settings data (typically JS) for front end.
 * @param logotypeId {number} Media id of logotype image
 * @param admins {number[]} List of admin user ids
 * @param moderators {number[]} List of moderator user ids
 * @param theme {String} Name of theme to use
 * @param style {String} Implementation specific style data (typically CSS) for front end.
 */
export function storeCommunity({
  id,
  permalink,
  name,
  description,
  status = CommunityStatus.VISIBLE,
  locale = 'en_US',
  domains = [],
  settings,
  logotypeId,
  admins = [],
  moderators = [],
  theme,
  style = undefined,
}: {
  id?: number;
  permalink?: string;
  name?: string;
  description?: string;
  status?: any;
  locale?: string;
  domains?: Array<string>;
  settings?: any;
  logotypeId?: number;
  admins?: Array<number>;
  moderators?: Array<number>;
  theme?: string;
  style?: any;
}): Thunk<Promise<StoreCommunityResult>> {
  return post({
    url: '/stackend/community/store',
    parameters: {
      id,
      permalink,
      name,
      description,
      status,
      locale,
      domains,
      logotypeId,
      admins,
      moderators,
      theme,
      style: style ? JSON.stringify(style) : '{}',
      settings: settings ? JSON.stringify(settings) : '{}',
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Set all community settings without affecting anything else.
 *
 * @param id {number}
 * @param settings {any} Settings
 */
export function setCommunitySettings({
  id,
  settings,
}: {
  id: number;
  settings: any;
}): Thunk<Promise<StoreCommunityResult>> {
  return post({
    url: '/stackend/community/set-settings',
    parameters: { id, settings: JSON.stringify(settings) },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Set a single community setting without affecting anything else.
 *
 * @param id {number}
 * @param name {string}
 * @param value {any}
 */
export function setCommunitySetting({
  id,
  name,
  value,
}: {
  id: number;
  name: string;
  value: any;
}): Thunk<Promise<StoreCommunityResult>> {
  return post({
    url: '/stackend/community/set-setting',
    parameters: { id, name, value: JSON.stringify(value) },
    community: STACKEND_COMMUNITY,
  });
}

export type GetCommunityPrivateSettingsResult = XcapJsonResult;

/**
 * Get the community's private settings that are not exposed to the frontend
 * @param key Get a specific setting
 * @param prefix Get settings with a specific prefix ("" for all)
 * @param community
 */
export function getCommunityPrivateSettings({
  key,
  prefix,
  community,
}: {
  key?: string | null;
  prefix?: string | null;
  community?: string | null;
}): Thunk<Promise<GetCommunityPrivateSettingsResult>> {
  return getJson({
    url: '/stackend/community/private/get-settings',
    parameters: { key, prefix },
    community: community,
  });
}

/**
 * Store the communitys private settings that are not exposed to the frontend.
 * Store a single key/value or a set of values.
 * @param key
 * @param value
 * @param values
 * @param community
 * @returns {Thunk<XcapJsonResult>}
 */
export function storeCommunityPrivateSettings({
  key,
  value,
  values,
  community,
}: {
  key?: string | null;
  value?: any | null;
  values?: { [name: string]: any };
  community?: string | null;
}): Thunk<Promise<XcapJsonResult>> {
  const x = {
    key: key,
    values: values ? JSON.stringify(values) : null,
  };

  return post({
    url: '/stackend/community/private/store-settings',
    parameters: x,
    community: community,
  });
}

/**
 * Set visible / hidden status of a community
 */
export function setCommunityStatus({
  id,
  status,
}: {
  id?: number;
  status: CommunityStatus.VISIBLE | CommunityStatus.HIDDEN;
}): Thunk<Promise<StoreCommunityResult>> {
  return post({
    url: '/stackend/community/set-status',
    parameters: { id, status },
    community: STACKEND_COMMUNITY,
  });
}

export interface RemoveCommunityResult extends XcapJsonResult {
  dataRemoved: boolean;
}

/**
 * Remove a community. If new or empty, the data will also be removed.
 * You can force data to be removed by setting removeData. That requires back office access however.
 *
 * @param id {String}
 * @param removeData {boolean} Remove the data, even if the community is not empty. Requires back office access.
 */
export function removeCommunity({
  id,
  removeData,
}: {
  id: number;
  removeData: boolean;
}): Thunk<Promise<RemoveCommunityResult>> {
  return post({
    url: '/stackend/community/remove',
    parameters: { id, removeData },
    community: STACKEND_COMMUNITY,
  });
}

export interface SearchCommunityResult extends XcapJsonResult {
  results: PaginatedCollection<Community>;
  statistics: { [id: string]: CommunityStats };
}

/**
 * Search for a communities.
 * @param myCommunities {boolean} Search the current users communities only
 * @param creatorUserId {number} find communities created by this user only
 * @param status
 * @param q Search string
 * @param p
 * @param pageSize
 * @param orderBy
 * @param order
 */
export function searchCommunity({
  myCommunities = true,
  creatorUserId,
  status = CommunityStatus.VISIBLE,
  q,
  p = 1,
  pageSize,
  orderBy = OrderBy.NAME,
  order = Order.ASCENDING,
}: {
  myCommunities?: boolean;
  creatorUserId?: number;
  status?: any;
  q?: number;
  p?: number;
  pageSize?: number;
  orderBy?: OrderBy;
  order?: Order;
}): Thunk<Promise<SearchCommunityResult>> {
  return getJson({
    url: '/stackend/community/search',
    parameters: {
      myCommunities,
      creatorUserId,
      status,
      q,
      p,
      pageSize,
      orderBy,
      order,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Get the current user (with privileges from stackend rather than the current community)
 */
export function getCurrentStackendUser(): Thunk<Promise<XcapJsonResult>> {
  return getJson({
    url: '/user/get',
    community: STACKEND_COMMUNITY,
  });
}

/**
 * In a list of communities, find the one that matches the permalink
 * @return {Community} may return null,
 */
export function getCurrentCommunity(communities: Array<Community>): Thunk<Community | null> {
  return (dispatch: any): Community | null => {
    if (typeof communities === 'undefined' || communities === null || communities.length === 0) {
      return null;
    }

    const currentCommunityPermalink = dispatch(getCurrentCommunityPermalink());
    if (currentCommunityPermalink === null) {
      // FIXME: Fall back to url like _getCurrentCommunity
      return null;
    }

    for (let i = 0; i < communities.length; i++) {
      const community = communities[i];
      if (community.permalink === currentCommunityPermalink) {
        return community;
      }
    }

    return null;
  };
}

/**
 * Check if the potential community url permalink is blocked.
 * @param communityUrl
 * @returns {boolean}
 */
export function isCommunityUrlBlocked(communityUrl: string): boolean {
  const blockedUrls: { [url: string]: boolean } = {
    create: true,
    'my-settings': true,
    contact: true,
    stacks: true,
    user: true,
    register: true,
    billing: true,
    oauth2: true,
    google: true,
    facebook: true,
  };

  // Remove inital /
  let u = communityUrl;
  if (u.startsWith('/')) {
    u = u.substring(1);
  }

  // Remove extra path
  const i = u.indexOf('/');
  if (i !== -1) {
    u = u.substring(0, i);
  }

  const t = blockedUrls[u];

  return typeof t === 'undefined' ? false : t;
}

/**
 * From the request url try to get the communityPermalink
 * @return {Community} may return null,
 */
export function _getCurrentCommunityPermalinkFromUrl(request: Request): any {
  const p = request.location.pathname;
  // Needs to work with:
  // - /XXX
  // - /stacks/XXX
  // - /contextPath/XXX
  // - /contextPath/stacks/XXX
  const re = new RegExp('^' + request.contextPath + '(:?/stacks)?/([^/]+).*');
  const r = re.exec(p);
  if (!r) {
    return null;
  }

  const currentCommunityPermalink = r[2];

  if (isCommunityUrlBlocked(currentCommunityPermalink)) {
    return null;
  }

  // FIXME: Fall back to domain

  return currentCommunityPermalink;
}

/**
 * In a list of communities, find the one that matches the permalink
 * @return {Community} may return null,
 */
export function _getCurrentCommunity(communities: Array<Community>, request: Request): Community | null {
  if (typeof communities === 'undefined' || communities === null || communities.length === 0) {
    return null;
  }

  const currentCommunityPermalink = _getCurrentCommunityPermalinkFromUrl(request);
  if (currentCommunityPermalink === null) {
    return null;
  }

  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    if (community.permalink === currentCommunityPermalink) {
      return community;
    }
  }

  return null;
}

/**
 * Check if the user is a community moderator, but not admin
 * @param community
 * @param userId
 * @returns {boolean}
 */
export function isCommunityModerator(community: Community | null, userId: number): boolean {
  if (!(community && community.id)) {
    return false;
  }

  if (!userId) {
    return false;
  }

  if (typeof community.moderatorUserIds !== 'undefined' && community.moderatorUserIds.includes(userId)) {
    return true;
  }

  return false;
}

/**
 * Check if a user is admin
 * @param community
 * @param userId
 * @returns {boolean}
 */
export function isCommunityAdmin(community: Community | null, userId?: number | null): boolean {
  if (typeof community === 'undefined' || community === null || !!userId || userId === null || userId === 0) {
    return false;
  }

  if (userId === community.creatorUserId) {
    return true;
  }

  return typeof community.adminUserIds !== 'undefined' && community.adminUserIds.includes(userId as number);
}
/**
 * Check if the user has stackend admin access (any community/stack).
 * @param currentUser
 * @returns {boolean}
 */
export function hasStackendAdminAccess(currentUser: CurrentUserType): boolean {
  return hasElevatedPrivilege(currentUser, COMMUNITY_MANAGER_CONTEXT, COMPONENT_CLASS, PrivilegeTypeId.ADMIN);
}

/**
 * Check if there is any way a user may see the current community
 * @param community
 * @param currentUser
 */
export function hasCommunityAdminOrModeratorAccess(community: Community | null, currentUser: CurrentUserType): boolean {
  if (!(community && community.id)) {
    return false;
  }

  if (!(currentUser && currentUser.user)) {
    return false;
  }

  const userId = currentUser.user.id;
  if (userId === community.creatorUserId) {
    return true;
  }

  if (typeof community.adminUserIds !== 'undefined' && community.adminUserIds.includes(userId)) {
    return true;
  }

  if (typeof community.moderatorUserIds !== 'undefined' && community.moderatorUserIds.includes(userId)) {
    return true;
  }

  return hasStackendAdminAccess(currentUser);
}

/**
 * Check if the current user has community admin access
 * @param community
 * @param currentUser
 * @returns {boolean}
 */
export function hasCommunityAdminAccess(community: Community | null, currentUser: CurrentUserType): boolean {
  if (!(currentUser && currentUser.user)) {
    return false;
  }

  if (hasStackendAdminAccess(currentUser)) {
    return true;
  }

  return isCommunityAdmin(community, currentUser.user.id);
}

/**
 * Check if the user has stackend access and may create new stacks.
 * @param currentUser
 * @returns {boolean}
 */
export function hasStackendCreateAccess(currentUser: CurrentUserType): boolean {
  return hasElevatedPrivilege(currentUser, COMMUNITY_MANAGER_CONTEXT, COMPONENT_CLASS, PrivilegeTypeId.TRUSTED);
}

export interface GetModulesResult extends XcapJsonResult {
  modules: Array<Module>;

  supportedModuleContexts: Array<{
    context: string;
    componentClass: string;
    supportsMultipleModules: boolean;
  }>;

  stats: { [id: string]: ModuleStats };
}

/**
 * Get the modules of a community.
 *
 * @param communityId
 * @returns {Promise}
 */
export function getModules({ communityId }: { communityId: number }): Thunk<Promise<GetModulesResult>> {
  return getJson({
    url: '/stackend/module/list',
    parameters: {
      communityId,
      pageSize: 1000,
    },
    community: STACKEND_COMMUNITY,
  });
}

export interface GetModuleResult extends XcapJsonResult {
  module: Module | null;
  rule: ModuleRule | null;
  commentRule: ModuleRule | null;
  stats: ModuleStats | null;
}

/**
 * Get a module of a community.
 *
 * @param communityId
 * @param moduleId
 * @returns {Thunk<GetModuleResult>}
 */
export function getModule({
  communityId,
  moduleId,
}: {
  communityId: number;
  moduleId: number;
}): Thunk<Promise<GetModuleResult>> {
  return getJson({
    url: '/stackend/module/get',
    parameters: {
      communityId,
      moduleId,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Get a singleton module given it's component class
 * @param communityId
 * @param componentClass
 * @param componentContext
 * @returns {Thunk<GetModuleResult>}
 */
export function getSingletonModule({
  communityId,
  componentClass,
  componentContext,
}: {
  communityId: number;
  componentClass: string;
  componentContext: string;
}): Thunk<Promise<GetModuleResult>> {
  return getJson({
    url: '/stackend/module/get-singleton',
    parameters: {
      communityId,
      singletonComponentClass: componentClass,
      singletonComponentContext: componentContext,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Construct the object that can be passed to storeModule()
 * @param communityId
 * @param componentClass
 * @param componentContext
 * @param name
 */
export function newModule({
  communityId,
  componentClass,
  componentContext,
  name,
}: {
  communityId: number;
  componentClass: string;
  componentContext: string;
  name: string;
}): any {
  if (!communityId) {
    throw Error('communityId required');
  }

  if (!componentClass) {
    throw Error('componentClass required');
  }

  if (!componentContext) {
    throw Error('componentContext required');
  }

  return {
    id: 0,
    communityId,
    name,
    enabled: true,
    componentClass,
    componentContext,
    ruleTypeId: 0,
    settings: {},
    style: {},
    extraData: {},
  };
}

export interface StoreModuleResult extends XcapJsonResult {
  module: Module | null;
}

/**
 * Store a module of a community.
 *
 * When creating a new module, this will also set up the module data, for example the blog.
 *
 * @param id
 * @param communityId
 * @param name
 * @param enabled
 * @param componentClass
 * @param componentContext
 * @param ruleTypeId
 * @param settings Implementation specific (js) string (Max 64KB)
 * @param style Implementation specific (css) string (Max 64KB)
 * @param extraData Component specific extra JSON data.
 *
 * Supported optional extra data:
 * <dl>
 * 	<dt>permalink</dt>
 * 	<dt>description</dt>
 * 	<dt>forumAnonymity</dt><dd>ForumAnonymityLevel</dd>
 * 	<dt>groupVisibile</dt><dd>true/false</dd>
 * 	<dt>groupContentVisibile</dt><dd>true/false</dd>
 *  <dt>body<dt>
 *  <dt>teaser</dt>
 * <dl>
 * @returns {Promise}
 */
export function storeModule({
  id,
  communityId,
  name,
  enabled,
  componentClass,
  componentContext,
  ruleTypeId,
  settings,
  style,
  extraData,
}: {
  id?: number;
  communityId: number;
  name?: string;
  enabled?: boolean;
  componentClass?: string;
  componentContext?: string;
  ruleTypeId?: number;
  settings?: any;
  style?: any;
  extraData?: any;
}): Thunk<Promise<StoreModuleResult>> {
  return async (dispatch: any): Promise<StoreModuleResult> => {
    const module = await dispatch(
      post({
        url: '/stackend/module/store',
        parameters: {
          id,
          communityId,
          name,
          enabled,
          componentClass,
          componentContext,
          ruleTypeId,
          settings: settings ? JSON.stringify(settings) : '{}',
          style: style ? JSON.stringify(style) : '{}',
          extraData: extraData ? JSON.stringify(extraData) : '{}',
        },
        community: STACKEND_COMMUNITY,
      })
    );
    dispatch(fetchModules({ communityId })); // FIXME: Update state without re-fetch
    return module;
  };
}

interface RuleSetup {
  createPrivilege: PrivilegeTypeIds;
  moderationStatus: ModerationStatus;
  contentFiltering: boolean;
  postModerationTtlMinutes: number;
}

/**
 * Store rules for a module
 * @param moduleId
 * @param communityId
 * @param rule
 * @param commentRule
 * @param trustedUsers
 */
export function storeModuleRules({
  communityId,
  moduleId,
  rule,
  commentRule,
  trustedUsers,
}: {
  communityId: number;
  moduleId: number;
  rule: RuleSetup;
  commentRule: RuleSetup;
  trustedUsers: Array<number>;
}): Thunk<Promise<XcapJsonResult>> {
  const r = {
    createPrivilege: rule.createPrivilege,
    moderationStatus: rule.moderationStatus,
    contentFiltering: rule.contentFiltering,
    postModerationTtlMinutes: rule.postModerationTtlMinutes,
  };

  let cr = null;

  if (commentRule) {
    cr = {
      createPrivilege: commentRule.createPrivilege,
      moderationStatus: commentRule.moderationStatus,
      contentFiltering: commentRule.contentFiltering,
      postModerationTtlMinutes: commentRule.postModerationTtlMinutes,
    };
  }

  return post({
    url: '/stackend/module/rules/store',
    parameters: {
      communityId,
      moduleId,
      trustedUsers,
      rule: JSON.stringify(r),
      commentRule: JSON.stringify(cr),
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Remove a module.
 *
 * @param id
 * @param communityId
 */
export function removeModule({ id, communityId }: { id: number; communityId: number }): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/stackend/module/remove',
    parameters: {
      id,
      communityId,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Detect modules by inspecting existing data. Developer tool.
 * @param communityId
 */
export function detectModules({ communityId }: { communityId: number }): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/stackend/modules/update',
    parameters: {
      communityId,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Translates component class names to human readable names.
 */
const COMPONENT_CLASS_TO_MODULE_NAME: { [name: string]: string } = {
  'se.josh.xcap.comment.impl.CommentManagerImpl': 'Comments',
  'se.josh.xcap.comment.CommentManager': 'Comments',
  'net.josh.community.blog.BlogManager': 'Blog',
  'net.josh.community.forum.impl.ForumManagerImpl': 'Forum',
  'net.josh.community.forum.ForumManager': 'Forum',
  'se.josh.xcap.cms.CmsManager': 'CMS',
  'se.josh.xcap.cms.impl.CmsManagerImpl': 'CMS',
  'se.josh.xcap.like.impl.LikeManagerImpl': 'Like',
  'net.josh.community.group.GroupManager': 'Group',
  'net.josh.community.category.CategoryManager': 'Page',
};

const MODULE_TYPE_TO_COMPONENT_CLASS: { [name: string]: string } = {
  comment: 'se.josh.xcap.comment.impl.CommentManagerImpl',
  blog: 'net.josh.community.blog.BlogManager',
  forum: 'net.josh.community.forum.impl.ForumManagerImpl',
  cms: 'se.josh.xcap.cms.impl.CmsManagerImpl',
  group: 'net.josh.community.group.GroupManager',
  page: 'net.josh.community.category.CategoryManager',
};

/**
 * Get a human readable component name
 * @param componentClass class
 */
export function getComponentLabel(componentClass: string): string {
  const t = COMPONENT_CLASS_TO_MODULE_NAME[componentClass];
  if (typeof t === 'undefined') {
    return 'Unknown';
  }

  return t;
}

/**
 * Get a component class
 * @param moduleType
 */
export function getComponentClassFromModuleType(moduleType: string): string {
  const t = MODULE_TYPE_TO_COMPONENT_CLASS[moduleType];
  if (typeof t === 'undefined') {
    return 'Unknown';
  }

  return t;
}

export interface ListAdminUsersResult extends XcapJsonResult {
  users: Array<User>;
}

/**
 * List users with stackend admin status.
 * Requires stackend admin status.
 * @param privilege {number} PrivilegeType
 */
export function listAdminUsers({ privilege }: { privilege: number }): Thunk<Promise<ListAdminUsersResult>> {
  return getJson({
    url: '/stackend/user/list-admins',
    parameters: {
      privilege,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Grant/revoke stackend admin status for a user.
 * Requires stackend admin status.
 * Any privilegeType lower than PrivilegeType.VERIFIED will remove the grants.
 * @param userId {number} User id
 * @param privilege {number} PrivilegeType
 */
export function setAdminStatus({
  userId,
  privilege,
}: {
  userId: number;
  privilege: number;
}): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/stackend/user/set-admin-status',
    parameters: {
      userId,
      privilege,
    },
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Make a user moderator or admin status from a community. Or remove that status
 * @param communityId
 * @param userId
 * @param communityPrivilegeType Privilege: ADMIN for admins, TRUSTED for moderators. All other privs will revoke the access.
 */
export function setCommunityAccess({
  communityId,
  userId,
  privilegeType,
}: {
  communityId: number;
  userId: number;
  privilegeType: number;
}): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/stackend/user/set-community-access',
    parameters: arguments,
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Invite a user as administrator or moderator of this community.
 * The user may or may not already be registered. If not, an email is sent inviting the user to manage the community.
 *
 * @param email Users email
 * @param communityId Id of community
 * @param communityPrivilegeType Privilege. Supports PrivilegeType.ADMIN (admin) and PrivilegeType.TRUSTED (moderator)
 * @param message Optional welcome message
 */
export function inviteUserToCommunity({
  email,
  communityId,
  communityPrivilegeType,
  message,
}: {
  email: string;
  communityId: number;
  communityPrivilegeType: PrivilegeTypeIds;
  message: string;
}): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/stackend/user/invite',
    parameters: arguments,
    community: STACKEND_COMMUNITY,
  });
}

/**
 * Get the domain (excluding www) and path of an url.
 * "http://www.josh.se/test" would return "josh.se/test"
 * "/test" would return "/test"
 * @param url
 * @returns {*|string}
 */
export function getReferenceUrl(url: string): string {
  const r = /(?:https|http)?(?::\/\/)?(?:www\.)?([^?#]*)/.exec(url);
  return r ? r[1] : url;
}

/**
 * Get the url to a stackend community and module
 * @param request
 * @param community
 * @param module
 * @param path
 * @returns {string}
 */
export function getStackendUrl({
  request,
  community,
  module,
  path,
}: {
  request: Request;
  community?: Community | null;
  module?: Module | null;
  path: string;
}): string {
  let s: string = request.contextPath;
  if (community) {
    s += '/stacks/' + community.permalink;

    if (module) {
      s += '/module/' + module.id;
    }
  }

  if (path) {
    if (!s.endsWith('/') && !path.startsWith('/')) {
      s += '/';
    }
    s += path;
  }

  return s;
}

/**
 * Remove a user. Requires stackend admin status. Fails if the user has communities.
 * @param userId
 * @returns {Thunk<XcapJsonResult>}
 */
export function removeUser({ userId }: { userId: number }): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/stackend/user/remove',
    parameters: arguments,
  });
}
