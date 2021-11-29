import { appendQueryString, LoadJson, LoadJsonResult, urlEncodeParameters } from './LoadJson';
import get from 'lodash/get';
import forIn from 'lodash/forIn';
import { receiveReferences } from './referenceActions';
import { Request, getRequest } from '../request';
import { Community, Module, STACKEND_COMMUNITY } from '../stackend';
import { User } from '../user';
import { setLoadingThrobberVisible } from '../throbber/throbberActions';
import { Content, Page, SubSite } from '../cms';
import { Privilege } from '../user/privileges';

import { XCAP_SET_CONFIG } from './configReducer';
import { Dispatch } from 'redux';
import { ListProductsQuery, ShopDataResult } from '../shop';
import Logger, { ConsoleLogger } from '../util/Logger';
import { appendAccessToken, handleAccessToken } from './AccessToken';
import { signalApiAccessFailed } from './actions';
import XcapObject from './XcapObject';

function createDefaultLogger(): Logger {
  return new ConsoleLogger('stackend');
}

/**
 * Stackend logger
 */
export let logger: Logger = createDefaultLogger();

/**
 * Get the stackend logger
 */
export function getLogger(): Logger {
  if (!logger) {
    logger = createDefaultLogger();
  }
  return logger;
}

/**
 * Set the default logger
 * @param newLogger
 */
export function setLogger(newLogger: Logger): void {
  logger = newLogger;
}

export const STACKEND_DEFAULT_SERVER = 'https://api.stackend.com';
export const STACKEND_DEFAULT_CONTEXT_PATH = '';

/**
 * Xcap API configuration
 */
export interface Config {
  /** Absolute url to the api server*/
  server: string;

  /** Context path on the api server */
  contextPath: string;

  /** Absolute url to the api server including context path and /api */
  apiUrl: string;

  /** Deploy profile */
  deployProfile: DeployProfile;

  /** Recaptcha site key */
  recaptchaSiteKey: string | null;

  /** Google Analytics key */
  gaKey: string | null;

  /** Other configuration properties */
  [propName: string]: any;
}

/**
 * Known deploy profiles
 */
export enum DeployProfile {
  STACKEND = 'stackend'
}

export let configDefaults: Partial<Config> = {
  server: STACKEND_DEFAULT_SERVER,
  contextPath: '',
  apiUrl: STACKEND_DEFAULT_SERVER + STACKEND_DEFAULT_CONTEXT_PATH + '/api',
  recaptchaSiteKey: null,
  gaKey: null,
  deployProfile: DeployProfile.STACKEND
};

/**
 * Set default configuration options
 * @param defaults
 */
export function setConfigDefaults(defaults: Partial<Config>): void {
  configDefaults = defaults;
}

let __xcapRunningServerSide = false;

/**
 * Is the app running server side?
 */
export function isRunningServerSide(): boolean {
  return __xcapRunningServerSide;
}

/**
 * Is the app running in the browser
 */
export function isRunningInBrowser(): boolean {
  return !__xcapRunningServerSide && typeof window !== 'undefined';
}

export function setRunningServerSide(ssr: boolean): void {
  __xcapRunningServerSide = ssr;
}

/**
 * The default community ("stackend")
 * @type {string}
 */
export const DEFAULT_COMMUNITY = 'stackend';

/**
 * Key holding related objects in the json response.
 * @type {string}
 */
export const RELATED_OBJECTS = '__relatedObjects';

/**
 * Key holding related likes in the json response.
 * @type {string}
 */
export const LIKES = 'likes';

/**
 * Key holding related votes in the json response.
 * @type {string}
 */
export const VOTES = 'votes';

/**
 * Parameter name holding the community
 * @type {string}
 */
export const COMMUNITY_PARAMETER = '__community';

/**
 * Parameter specifying an alternative rich content chain used to serialize the result
 * @type {string}
 */
export const RICH_CONTENT_CHAIN_PARAMETER = 'xcap.rich-content-chain';

/**
 * API errors
 */
export interface XcapJsonErrors {
  /**
   * Error messages from the API
   */
  actionErrors: Array<string>;

  /**
   * Field errors. Maps from a field (parameter) name to validation error messages for that parameter.
   */
  fieldErrors: {
    [fieldName: string]: Array<string>;
  };
}

/**
 * Base type for API results
 */
export interface XcapJsonResult {
  /**
   * Action specific result code.
   * Common codes includes: "success", "input", "notfound" etc.
   */
  __resultCode: string;

  /**
   * Error messages. Not present if the API call was successful
   */
  error?: XcapJsonErrors;

  /**
   * Additional debug messages (non errors) from the API
   */
  __messages?: Array<string>;

  /**
   * Related objects mapped from a hash string to the actual object.
   * Present only when a call is successful.
   */
  __relatedObjects?: { [ref: string]: XcapObject };

  /** Additional properties specific to the called API method  */
  [propName: string]: any;
}

/**
 * Redux store state
 */
export type State = { [key: string]: any };

/**
 * Function that dispatches actions against the store
 */
//export type Thunk<A> = (dispatch: Dispatch, getState: () => State) => Promise<A> | A | any;
export type Thunk<A> = (dispatch: Dispatch, getState: () => State) => A;

/**
 * Xcap types and their names
 */
const typeNames: { [type: string]: string } = {
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
 * Construct basic configuration from the environment.
 */
export function _constructConfig(): Config {
  const c: Config = Object.assign(
    {
      server: STACKEND_DEFAULT_SERVER,
      contextPath: STACKEND_DEFAULT_CONTEXT_PATH,
      deployProfile: DeployProfile.STACKEND,
      apiUrl: null,
      gaKey: null,
      recaptchaSiteKey: null
    },
    configDefaults
  );

  if (!c.apiUrl) {
    c.apiUrl = c.server + c.contextPath + '/api';
  }

  return c;
}

/**
 * Get the API configuration object
 * @type {Thunk<Config>}
 */
export function getConfiguration(): Thunk<Config> {
  return (dispatch, getState): Config => {
    const c = get(getState(), 'config');
    if (c) {
      return c;
    }
    // FIXME: Push to store?
    return _constructConfig();
  };
}

/**
 * Set the API configuration
 * @param config
 */
export function setConfiguration(config: Partial<Config>): Thunk<any> {
  return (dispatch, _getState): any => {
    return dispatch({
      type: XCAP_SET_CONFIG,
      config
    });
  };
}

/**
 * Reset the API configuration to the defaults
 */
export function resetConfiguration(): Thunk<any> {
  return setConfiguration({
    server: STACKEND_DEFAULT_SERVER,
    contextPath: STACKEND_DEFAULT_CONTEXT_PATH,
    deployProfile: DeployProfile.STACKEND,
    gaKey: null,
    recaptchaSiteKey: null
  });
}

/**
 * Server domain enabling CORS calls
 * @type {string}
 */
export function getServer(): Thunk<string> {
  return (dispatch, getState): string => {
    let s = undefined;
    if (typeof getState !== 'function') {
      logger.error('getServer: Wrong invocation');
    } else {
      s = get(getState(), 'config.server');
      if (s) {
        return s;
      }
    }

    return _constructConfig().server;
  };
}

/**
 * Server domain enabling CORS calls
 * @type {string}
 */
export function _getServer(config: Config | null): string {
  const s = get(config, 'server');
  if (s) {
    return s;
  }
  return _constructConfig().server;
}

/**
 * @deprecated bad practise to dispatch getters which doesn't set any state, use api._getDeployProfile instead
 * Get the deploy profile name. Allows customized styling for different deployments
 * @return a profile name, or the empty string.
 */
export function getDeployProfile(): Thunk<string> {
  return (dispatch, getState): string => {
    if (typeof getState !== 'function') {
      logger.error('getDeployProfile: Wrong invocation');
    } else {
      const s = get(getState(), 'config.deployProfile');
      if (s) {
        return s;
      }
    }

    return _constructConfig().deployProfile;
  };
}

/**
 * Get the deploy profile name. Allows customized styling for different deployments
 * @return a profile name, or the empty string.
 */
export function _getDeployProfile(config: Config | null): string {
  const s = get(config, 'deployProfile');
  if (s) {
    return s;
  }
  return _constructConfig().deployProfile;
}

/**
 * ContextPath of Api server
 * @return {Thunk<string>}
 */
export function getContextPath(): Thunk<string> {
  return (dispatch, getState): string => {
    if (typeof getState !== 'function') {
      logger.error('getContextPath: Wrong invocation');
    } else {
      const s = get(getState(), 'config.contextPath');
      if (s) {
        return s;
      }
    }

    return _constructConfig().contextPath;
  };
}

/**
 * ContextPath of Api server
 * @type {string}
 */
export function _getContextPath(config: Config | null): string {
  const s = get(config, 'contextPath');
  if (s) {
    return s;
  }
  return _constructConfig().contextPath;
}

/**
 * Server domain address with ContextPath
 * @return {Thunk<string>}
 */
export function getServerWithContextPath(): Thunk<string> {
  return (dispatch, getState): string => {
    let server, contextPath;

    if (typeof getState !== 'function') {
      logger.error('getServerWithContextPath: Wrong invocation');
    } else {
      const state = getState();
      server = get(state, 'config.server');
      contextPath = get(state, 'config.contextPath');
    }

    if (!server || !contextPath) {
      const c = _constructConfig();
      server = server || c.server;
      contextPath = contextPath || c.contextPath;
    }

    return server + contextPath;
  };
}

/**
 * Server domain address with ContextPath from redux store
 */
export function getServerWithContextPathFromStore(config: Config): string {
  // FIXME: Duplicate of nex function
  let c = config;
  if (!config.server || !config.contextPath) {
    c = _constructConfig();
  }

  return c.server + c.contextPath;
}

/**
 * Server domain address with ContextPath
 */
export function _getServerWithContextPath(config: Config): string {
  let c = config;
  if (!config.server || !config.contextPath) {
    c = _constructConfig();
  }

  return c.server + c.contextPath;
}

/**
 * Get the path to the current community.
 * For example "/stackend/test"
 * @return never null
 */
export function getCommunityPath(): Thunk<string> {
  return (dispatch, getState): string => {
    if (typeof getState !== 'function') {
      throw Error('getCommunityPath : Wrong invocation');
    }
    return get(getState(), 'request.communityUrl', '');
  };
}

/**
 * Get the path to the current community.
 * For example "/stackend/test"
 * @return never null
 */
export function getCommunityPathFromStore({ request }: { request: Request }): string {
  return get(request, 'communityUrl', '');
}

/**
 * Get the absolute path to the current community, including host name.
 * For example "stackend.com/stackend/test"
 * Same as request.absoluteCommunityUrl.
 * @return {Thunk<string>}
 */
export function getAbsoluteCommunityPath(): Thunk<string> {
  return (dispatch, getState): string => {
    if (typeof getState !== 'function') {
      throw Error('getAbsoluteCommunityPath: Wrong invocation');
    }
    return get(getState(), 'request.absoluteCommunityUrl', '');
  };
}

/**
 * Get the community path. In stackend /stacks/, return the context path, not the current community path.
 * @return {Thunk<string>}
 */
export function getEffectiveCommunityPath(): Thunk<string> {
  return (dispatch, getState): string => {
    const state = getState();
    if (/\/stacks\//.exec(get(state, 'request.location.pathname', ''))) {
      // Ignore /stacks/xxx
      return _getContextPath(state.config);
    }

    // Outside stackend
    const p = get(state, 'request.communityPath', null);
    if (p !== null) {
      return p;
    }

    return _getContextPath(state.config);
  };
}

/**
 * Api url containing server and ContextPath if necessary.
 * @param community Optional community
 * @return {Thunk<string>}
 */
export function getAbsoluteApiBaseUrl(community: string): Thunk<string> {
  return (dispatch, getState): string => {
    const state = getState();

    const server = _getServer(state.config);
    const contextPath = _getContextPath(state.config);

    const pfx = server + contextPath;

    // The default community does not use a prefix
    if (typeof community === 'undefined' || community === null || community === DEFAULT_COMMUNITY || community === '') {
      return pfx + '/api';
    }

    return pfx + '/' + community + '/api';
  };
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
  config: Config;
  communityPermalink?: string;
}): string {
  const server = _getServer(config);
  const contextPath = _getContextPath(config);

  const pfx = server + contextPath;

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
export function getCurrentCommunity(): Thunk<Community | null> {
  return (dispatch, getState): Community | null => {
    return get(getState(), 'communities.community', null);
  };
}

/**
 * Get the current community permalink as used in name (For example "test").
 *
 * @return May return null
 */
export function getCurrentCommunityPermalink(): Thunk<string | null> {
  return (dispatch, getState): string | null => {
    return get(getState(), 'communities.community.permalink', null);
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
  state: State;
  url: string; //extra url
  parameters?: any; //extra parameters
  notFromApi?: boolean; //if the url is not in the api
  community?: string | null; //community name
  componentName?: string | null; //Component name used to look up config
  context?: string | null; //Context name used to look up config
}): string {
  //the api url
  const params = argsToObject(parameters);

  if (typeof community === 'undefined') {
    if (params) {
      community = (params as any)[COMMUNITY_PARAMETER];
      delete (params as any)[COMMUNITY_PARAMETER];
    }
    if (typeof community === 'undefined') {
      community = get(state, 'communities.community.permalink', DEFAULT_COMMUNITY);
    }
  }

  let path = '';

  if (notFromApi) {
    path = url;
  } else {
    /* Calls to /api/*  */

    const server = _getConfig({
      config: state.config || {},
      componentName,
      context,
      key: 'server',
      defaultValue: _getServer(state.config)
    });

    const contextPath = _getConfig({
      config: state.config || {},
      componentName,
      context,
      key: 'contextPath',
      defaultValue: _getContextPath(state.config)
    });

    const apiUrlOverride = _getConfig({
      config: state.config || {},
      componentName,
      context,
      key: 'api-url'
    });

    let pfx = server + contextPath;

    if (apiUrlOverride) {
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
    path = appendAccessToken(path);
  }

  const args = urlEncodeParameters(params);
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
  url: string;
  parameters?: any;
  notFromApi?: boolean;
  community?: string | null;
  componentName?: string | null;
  context?: string | null;
}): Thunk<string> {
  return (dispatch, getState): string => {
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
 * Add any related objects received to the store
 * @param dispatch
 * @param json
 */
export function addRelatedObjectsToStore(dispatch: Dispatch, json: any): void {
  if (!!json[RELATED_OBJECTS] && Object.keys(json[RELATED_OBJECTS]).length > 0) {
    const relatedObjects = json[RELATED_OBJECTS];
    dispatch(receiveReferences({ entries: relatedObjects }));
  }
}

export type XcapOptionalParameters = {
  [COMMUNITY_PARAMETER]?: string | null | undefined;
};

export type ParameterValue = string | number | boolean | null | undefined | Array<string | number | boolean | null>;
export type Parameters = (XcapOptionalParameters & { [name: string]: ParameterValue }) | string;

export interface XcapJsonRequest {
  /** Path on the api server */
  url: string;
  /** Parameters as a js object */
  parameters?: Parameters | IArguments;
  /** Community permalink */
  community?: string | null;
  /** Component name used for config (for example "like") */
  componentName?: string | null;
  /** Community context used for config (for example "forum") */
  context?: string | null;
  /** Optional cookie string to pass on */
  cookie?: string | null;
  /** if the url is not in the api
   * @deprecated
   */
  notFromApi?: boolean;
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
 * @param cookie Optional cookie string to pass on. Typically used for SSR only
 * @returns {Thunk}
 */
export function getJson<T extends XcapJsonResult>({
  url,
  parameters,
  notFromApi = false,
  community,
  componentName,
  context,
  cookie
}: XcapJsonRequest): Thunk<Promise<T>> {
  return async (dispatch: any): Promise<T> => {
    let p = url;
    try {
      dispatch(setLoadingThrobberVisible(true));

      p = await dispatch(
        getApiUrl({
          url,
          parameters: argsToObject(parameters),
          notFromApi,
          community,
          componentName,
          context
        })
      );

      let c: string | undefined | null = cookie;

      const runningServerSide = isRunningServerSide();

      // The client will supply the cookie automatically. Server side will not, so pass it along
      if ((typeof c === 'undefined' || c == null) && runningServerSide) {
        const request: Request = await dispatch(getRequest());
        c = request.cookie;
      }

      const requestStartTime = Date.now();
      logger.debug('GET ' + p);
      const result: LoadJsonResult = await LoadJson({ url: p, cookie: c });

      const t = Date.now() - requestStartTime;
      if (t > 500 && runningServerSide) {
        logger.warn('Slow API request: ' + t + 'ms:' + p);
      }

      if (result.json) {
        handleAccessToken(result.json);

        if (result.error) {
          logger.error(getJsonErrorText(result.json) + ' ' + p);
          dispatch(setLoadingThrobberVisible(false));
          dispatch(signalApiAccessFailed(p, result));

          if (result.status === 403) {
            // Unauthorized
            logger.warn('Session has expired: ' + p);
            /* FIXME: At this point the user should be prompted to login again. Preferably using a popup
						dispatch(refreshLoginData({ force : true })); // Breaks because of circular dependencies
						*/
          }

          return result.json as T;
        }

        const r = postProcessApiResult(result.json);
        addRelatedObjectsToStore(dispatch, r);
        dispatch(setLoadingThrobberVisible(false));
        return r as T;
      }

      logger.error('No result received: ' + p);
      dispatch(setLoadingThrobberVisible(false));
      return newXcapJsonErrorResult('No result received') as T;
    } catch (e) {
      // 404, connection refused etc
      logger.error("Couldn't getJson: " + p, e);
      dispatch(setLoadingThrobberVisible(false));
      return newXcapJsonErrorResult("Couldn't getJson: " + e) as T;
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
  url: string;
  parameters?: any;
}): Thunk<Promise<XcapJsonResult>> {
  return async (dispatch): Promise<XcapJsonResult> => {
    const p = appendQueryString(url, urlEncodeParameters(argsToObject(parameters)));
    const result = await LoadJson({ url: p });

    if (result) {
      if (result.error) {
        logger.warn(result.error + p);
        return newXcapJsonErrorResult(result.error);
      }

      if (result.json) {
        if (result.json.error) {
          logger.warn(getJsonErrorText(result.json) + p);
          return result.json;
        }

        const r = postProcessApiResult(result.json);
        addRelatedObjectsToStore(dispatch, r);
        return r as XcapJsonResult;
      }
    }

    return newXcapJsonErrorResult('No result received');
    // TODO: Used to return empty
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
export function post<T extends XcapJsonResult>({
  url,
  parameters,
  community,
  componentName,
  context
}: {
  url: string;
  parameters?: Parameters | IArguments;
  community?: string | null;
  componentName?: string | null;
  context?: string | null;
}): Thunk<Promise<T>> {
  return async (dispatch: any): Promise<T> => {
    // Must get token before constructing the url, because session may be established when requesting the token
    const xpressToken = await dispatch(getXpressToken({ community, componentName, context }));

    const params = argsToObject(parameters);

    if (typeof community === 'undefined' && params && typeof (params as any)[COMMUNITY_PARAMETER] !== 'undefined') {
      community = (params as any)[COMMUNITY_PARAMETER];
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

    const result = await LoadJson({
      url: p,
      method: 'POST',
      parameters: params,
      xpressToken: xpressToken.xpressToken
    });

    if (result) {
      if (result.error) {
        logger.warn(result.error + ': ' + p);
        return newXcapJsonErrorResult('Post failed: ' + result.error) as T;
      }

      if (result.json) {
        handleAccessToken(result.json);

        if (result.json.error) {
          logger.warn(getJsonErrorText(result.json) + ': ' + p);
        }
        const r = postProcessApiResult(result.json);
        addRelatedObjectsToStore(dispatch, r);
        return r as T;
      }
    }

    return newXcapJsonErrorResult('Post failed: no response') as T;
  };
}

export interface GetExpressTokenResult extends XcapJsonResult {
  xpressToken: string;
  xcapAjaxToken: string;
}

/**
 * Get a token used for CSRF prevention.
 */
export function getXpressToken({
  community,
  componentName,
  context
}: {
  community?: string | null;
  componentName?: string | null;
  context?: string | null;
}): Thunk<Promise<GetExpressTokenResult>> {
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
 * <p>When looking up a key, the following order is used:</p>
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
  key: string;
  componentName?: string;
  context?: string;
  defaultValue?: any;
}): Thunk<any> {
  return (dispatch: any, getState: any): any => {
    const config = get(getState(), 'config');
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
  config: Config;
  key: string;
  componentName?: string | null;
  context?: string | null;
  defaultValue?: any;
}): any {
  if (typeof config === 'undefined') {
    logger.warn('getConfig: config is not present in store');
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
export function createUrl({ path, params, hash }: { path: string; params?: any; hash?: string }): string {
  let loc = path;

  if (params) {
    let hasQ = loc.indexOf('?') !== -1;
    for (const p in params) {
      if (Object.prototype.hasOwnProperty.call(params, p)) {
        loc += hasQ ? '&' : '?';
        const v = params[p];
        if (!v) {
          loc += encodeURIComponent(p);
        } else {
          if (typeof v === 'object') {
            for (let i = 0; i < v.length; i++) {
              const w = v[i];
              loc += (i > 0 ? '&' : '') + encodeURIComponent(p) + '=' + encodeURIComponent(w);
            }
          } else {
            loc += encodeURIComponent(p) + '=' + encodeURIComponent(v);
          }
        }
        hasQ = true;
      }
    }
  }

  if (hash) {
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
  request?: Request;
  path: string;
  params?: any;
  hash?: string;
  absolute?: boolean;
}): string {
  let pfx = '';
  if (!!absolute && absolute) {
    if (request) {
      pfx = request.absoluteCommunityUrl;
    } else {
      //pfx = getAbsoluteCommunityPath();
      pfx = 'FIXME';
    }
  } else {
    if (request) {
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
export function argsToObject(args: Parameters | IArguments | undefined | null): null | Parameters {
  if (typeof args === 'string') {
    return {
      [args]: args
    };
  }

  if (!args) {
    return null;
  }

  let r: Parameters = {};
  if (typeof args.length === 'undefined') {
    r = args as any; // Plain object
  } else {
    // Arguments or Arguments object
    for (let i = 0; i < (args as IArguments).length; i++) {
      Object.assign(r, (args as IArguments)[i]);
    }
  }

  // Remove undefined values
  const o = r as any;
  for (const k in o) {
    if (Object.prototype.hasOwnProperty.call(o, k) && typeof o[k] === 'undefined') {
      delete o[k];
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
export function postProcessApiResult(result: XcapJsonResult): XcapJsonResult | null {
  const likes = result[LIKES] ? result[LIKES] : undefined;
  const votes = result[VOTES] ? result[VOTES] : undefined;
  return _postProcessApiResult(result, result[RELATED_OBJECTS] || {}, likes, votes);
}

function _postProcessApiResult(
  result: XcapJsonResult | null,
  relatedObjects: any,
  likes?: any,
  votes?: any
): XcapJsonResult | null {
  if (result === null) {
    return null;
  }

  if (!relatedObjects) {
    logger.error('No related objects in result: ' + JSON.stringify(result));
  }

  const d = result;
  for (const n in result) {
    if (!Object.prototype.hasOwnProperty.call(result, n) || n === RELATED_OBJECTS) {
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
      const v = result[n];
      if (typeof v === 'string') {
        const r = relatedObjects[v];
        result[n] = r;
        if (r === null) {
          logger.error('Could not resolve related object ' + n + '=' + v);
        } else {
          result[n] = _postProcessApiResult(r, relatedObjects, likes);
        }
      } else if (typeof v === 'object' && v !== null && v.constructor === Array) {
        for (let i = 0; i < v.length; i++) {
          const ref = v[i];
          const r = relatedObjects[ref] || ref;
          v[i] = r;
          if (r === null) {
            logger.error('Could not resolve related object ' + ref);
          }
        }
      }
    } else if (n === 'obfuscatedReference') {
      //Check for likes
      const likeObject = get(likes, `[${result[n]}]`, undefined);
      if (likeObject) {
        result.likedByCurrentUser = likeObject;
      }
      //Check for votes
      const voteObject = get(votes, `[${result[n]}].voteByCurrentUser`, undefined);
      if (voteObject) {
        result.voteByCurrentUser = voteObject;
      }
    } // Objects, arrays
    else {
      const v = result[n];
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

  const t = typeof response.error;

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

  forIn(response.error.fieldErrors, (value, key) => {
    if (m.length > 0) {
      m += '\n';
    }

    m += key + ': ' + value;
  });

  return m;
}

/**
 * Construct a new XcapJsonResult
 * @param resultCode
 * @param actionErrors
 * @param fieldErrors
 * @param data
 */
export function _newXcapJsonResult<T extends XcapJsonResult>(
  resultCode: string,
  actionErrors: undefined | string | Array<string>,
  fieldErrors: undefined | { [fieldName: string]: string },
  data?: any
): T {
  const x = {
    __resultCode: resultCode,
    ...data
  };

  if (actionErrors || fieldErrors) {
    let ae: Array<string>;
    if (typeof actionErrors === 'undefined') {
      ae = [];
    } else if (typeof actionErrors === 'string') {
      ae = [actionErrors];
    } else {
      ae = actionErrors;
    }

    x.error = {
      actionErrors: ae,
      fieldErrors: fieldErrors || {}
    };
  } else if (resultCode === 'error') {
    x.error = {
      actionErrors: ['error']
    };
  }

  return x;
}

/**
 * Construct a new API result
 * @param resultCode
 * @param data
 */
export function newXcapJsonResult<T extends XcapJsonResult>(resultCode: string, data?: any): T {
  return _newXcapJsonResult(resultCode, undefined, undefined, data);
}

/**
 * Construct a new API result
 * @param actionErrors
 * @param fieldErrors
 */
export function newXcapJsonErrorResult<T extends XcapJsonResult>(
  actionErrors: string | Array<string>,
  fieldErrors?: { [fieldName: string]: string }
): T {
  return _newXcapJsonResult('error', actionErrors, fieldErrors);
}

/**
 * Get a human readable type of an xcap object
 * @param objectOrClassName
 * @return {String}
 */
export function getTypeName(objectOrClassName: string | XcapObject): string {
  if (typeof objectOrClassName === 'string') {
    return typeNames[objectOrClassName];
  } else {
    const tn = objectOrClassName['__type'];
    if (typeof tn === 'string') {
      const n = typeNames[tn];
      if (n) {
        return n;
      }

      const i = tn.lastIndexOf('.');
      return i === -1 ? tn : tn.substring(i + 1);
    }
  }

  return 'Unknown type';
}

/**
 * Translations
 */
export interface Translations {
  /** Language code */
  lang: string;
  messages: {
    [key: string]: string;
  };
}

/**
 * Extra data required by some modules, like for example comment listings for comment modules
 */
export interface ModuleExtraData {
  [moduleType: string]: {
    [referenceOrModuleId: number]: any;
  };
}

export interface GetInitialStoreValuesResult extends XcapJsonResult {
  /** Was the community determined from the domain rather that from the permalink? */
  communityFromDomain: boolean;

  /** Permalink of community */
  permalink: string;

  /** Current community. may be null */
  stackendCommunity: Community | null;

  /** Privilege of current community (when running in /stacks) */
  communityPrivilegeType: Privilege;
  domain: string | null;

  /** Current user. Stackend user when running in /stacks */
  user: User | null;
  xcapApiConfiguration: { [key: string]: any };
  numberOfUnseen: number;
  modules: { [id: string]: Module };

  /** Maps from id to content */
  cmsContents: { [id: string]: Content };

  /** Maps from id to  Page */
  cmsPages: { [id: string]: Page };

  /** Maps from id to  SubSite */
  subSites: { [id: string]: SubSite };

  /** Maps the referenceUrl parameter to an id */
  referenceUrlId: number;

  /** Shop data, if requested */
  shopData: ShopDataResult | null;

  /** Translation data, if not stackend.com */
  translations: Translations | null;

  /** Extra data for modules */
  data: ModuleExtraData;
}

/**
 * Extra module specific parameters
 */
export interface ModuleExtraParameters {
  /**
   * Key given by module handler, for example comments
   */
  [moduleHandlerKey: string]: {
    /**
     * Key: moduleId + "_" + referenceId
     */
    [moduleId_referenceId: string]: {
      /**
       * Parameter names and values
       */
      [name: string]: any;
    };
  };
}

/**
 * Add all extra parameters
 * @param params
 * @param moduleKey
 * @param moduleId (may be 0 if not used)
 * @param referenceId (may be 0 if not used)
 * @param values
 */
export function addModuleExtraParameters(
  params: ModuleExtraParameters,
  moduleKey: string,
  moduleId: number,
  referenceId: number,
  values: { [name: string]: any }
): void {
  let mk = moduleKey;
  if (mk.startsWith('stackend-')) {
    mk = mk.substring('stackend-'.length);
  }
  let x = params[mk];
  if (!x) {
    x = {};
    params[mk] = x;
  }

  const key = moduleId + '_' + referenceId;
  let y = x[key];
  if (!y) {
    y = {};
    x[key] = y;
  }
  Object.assign(y, values);
}

export interface GetInitialStoreValuesRequest {
  permalink?: string;
  domain?: string;
  communityId?: number;
  moduleIds?: Array<number>;
  contentIds?: Array<number>;
  pageIds?: Array<number>;
  subSiteIds?: Array<number>;
  cookie?: string;
  referenceUrl?: string;
  stackendMode?: boolean;
  productHandles?: Array<string>;
  productCollectionHandles?: Array<string>;
  productListings?: Array<ListProductsQuery>;
  shopImageMaxWidth?: number;
  shopListingImageMaxWidth?: number;
  /**
   * Module specific parameters
   */
  moduleExtraParameters?: ModuleExtraParameters;
}

/**
 * Load the initial store values
 */
export function getInitialStoreValues(
  params: GetInitialStoreValuesRequest
): Thunk<Promise<GetInitialStoreValuesResult>> {
  let pl: Array<string> | undefined = undefined;
  if (params.productListings && params.productListings.length !== 0) {
    pl = params.productListings.map(q => JSON.stringify(q));
  }

  let d = undefined;
  if (params.moduleExtraParameters) {
    d = JSON.stringify(params.moduleExtraParameters);
  }
  const q = Object.assign({}, params, {
    productListings: pl,
    d
  });
  delete q.moduleExtraParameters;

  const p = q as unknown as Parameters;

  return getJson({
    url: '/init',
    parameters: p,
    community: DEFAULT_COMMUNITY,
    cookie: params.cookie
  });
}

/**
 * Log a javascript error
 * @param error Browser Error object
 * @param store
 */
export async function logJsError(error: any /* Error */, store?: any): Promise<any> {
  if (!error) {
    return;
  }

  const communityId = 0;

  /* FIXME: Re add this
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
	 */

  // Produces the best error message in all browsers.
  // Safari, however does not include the stacktrace
  const message = error.toString() + (error.stack ? '\n' + error.stack : '');

  const params = {
    communityId,
    store,
    error: error.name + (error.number ? ' (' + error.number + ')' : ''),
    message,
    line: error.lineNumber || -1,
    column: error.columnNumber || -1,
    url: error.fileName || '',
    pageUrl: document.location.href
  };

  let url = null;
  if (store) {
    url = await store.dispatch(
      getApiUrl({
        url: '/js-log',
        community: STACKEND_COMMUNITY
      })
    );
  } else {
    url = _getServer(null) + _getContextPath(null) + '/api/js-log';
    url = appendAccessToken(url);
  }

  let r = null;
  try {
    r = await LoadJson({
      url,
      method: 'POST',
      parameters: params
    });
  } catch (e) {
    logger.error('Failed to log: ' + JSON.stringify(params), '\nCause: ' + JSON.stringify(e));
  }
  return r;
}

/**
 * Create a hash code of a string. Roughly the same impl as java.
 * @param str
 * @returns {number}
 */
export function getHashCode(str: string): number {
  if (!str) {
    return 0;
  }
  return str.split('').reduce((prevHash, currVal) => ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0, 0);
}
