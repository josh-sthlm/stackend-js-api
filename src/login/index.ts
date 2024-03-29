import get from 'lodash/get';
import { Request } from '../request';
import {
  XcapJsonResult,
  _getServerWithContextPath,
  Config,
  post,
  _getApiUrl,
  Thunk,
  isRunningInBrowser,
  XcapOptionalParameters,
  COMMUNITY_PARAMETER
} from '../api';
import { clearAccessToken, clearPersistentData } from '../api/AccessToken';

declare let browserHistory: { push: (location: string) => any }; // FIXME: for backward compatibility with react-router
declare let window: any; // FIXME: For client side stuff

/**
 * Ways to log in.
 */
export enum AuthenticationType {
  /**
   * Login using facebook
   */
  FACEBOOK = 'FACEBOOK',

  /**
   * Login using email+password
   */
  XCAP = 'XCAP',

  /**
   * Login using google token
   */
  GOOGLE = 'GOOGLE',

  /**
   * Custom oauth solution
   */
  OAUTH2 = 'OAUTH2'
}

const AUTH_NAMES: { [key: string]: string } = {
  [AuthenticationType.FACEBOOK]: 'Facebook',
  [AuthenticationType.GOOGLE]: 'Google',
  [AuthenticationType.XCAP]: 'E-mail & password',
  [AuthenticationType.OAUTH2]: 'OAuth2'
};

export function getAuthenticationTypeName(type: AuthenticationType): string {
  if (AUTH_NAMES[type]) {
    return AUTH_NAMES[type];
  }

  return AUTH_NAMES[AuthenticationType.XCAP];
}

/**
 * Given a user permalink, get the authentication type
 * @param permalink
 * @returns {string}
 */
export function getAuthenticationTypeByUserPermalink(permalink: string): AuthenticationType {
  let provider = AuthenticationType.XCAP;
  if (permalink.startsWith('g_')) {
    provider = AuthenticationType.GOOGLE;
  } else if (permalink.startsWith('fb_')) {
    provider = AuthenticationType.FACEBOOK;
  } else if (permalink.startsWith('o_')) {
    provider = AuthenticationType.OAUTH2;
  }

  return provider;
}

/**
 * Get the login url.
 *
 * @param config
 * @param request
 * @param returnUrl
 * @param communityPermalink
 * @param provider
 * @returns string
 */
export function _getLoginUrl({
  config,
  request,
  returnUrl,
  communityPermalink,
  provider
}: {
  config: Config;
  request?: Request | null;
  returnUrl?: string | null;
  communityPermalink?: string | null;
  provider: AuthenticationType;
}): string {
  const pfx = _getServerWithContextPath(config);

  switch (provider) {
    case AuthenticationType.FACEBOOK:
      return (
        pfx +
        '/facebook/?login=true' +
        (returnUrl ? '&returnurl=' + encodeURIComponent(returnUrl) : '') +
        (communityPermalink ? '&c=' + encodeURIComponent(communityPermalink) : '')
      );

    case AuthenticationType.XCAP: {
      const parameters: any = {};
      if (returnUrl) {
        parameters.returnUrl = returnUrl;
      }

      if (communityPermalink) {
        parameters.c = communityPermalink;
      }

      parameters.email = get(arguments[0], 'email');
      parameters.password = get(arguments[0], 'password');

      return _getApiUrl({
        state: { request, config, communities: {} },
        url: '/user/login',
        parameters
      });
    }

    case AuthenticationType.GOOGLE:
      return (
        pfx +
        '/google?login=true' +
        (returnUrl ? '&r=' + encodeURIComponent(returnUrl) : '') +
        (communityPermalink ? '&c=' + encodeURIComponent(communityPermalink) : '')
      );

    case AuthenticationType.OAUTH2:
      return (
        pfx +
        '/oauth2?login=true' +
        (returnUrl ? '&r=' + encodeURIComponent(returnUrl) : '') +
        (communityPermalink ? '&c=' + encodeURIComponent(communityPermalink) : '')
      );

    default:
      throw Error('_getLoginUrl() provider "' + provider + '" not supported');
  }
}

function _getReturnUrl({ request, returnUrl }: { request: Request; returnUrl?: string }): string {
  let pfx = '';
  if (!returnUrl) {
    returnUrl = '';
    returnUrl += get(request, 'location.href', '');
    returnUrl += get(request, 'location.search', '');
    return encodeURIComponent(returnUrl);
  } else {
    // No proto
    if (returnUrl.indexOf('//') === -1) {
      // Special case for /stacks
      if (request.location.pathname.indexOf('/stacks/') !== -1) {
        pfx = request.absoluteUrl + request.contextPath;
      } else {
        pfx = request.absoluteCommunityUrl;
      }
    } else {
      pfx = '';
    }
  }

  return encodeURIComponent(pfx + returnUrl);
}

/**
 * Get the logout url.
 * @param config
 * @param request
 * @param returnUrl
 * @returns {string}
 * @deprecated Should not link directly to logout. It requires a post with a token.
 */
export function _getLogoutUrl({
  config,
  request,
  returnUrl
}: {
  config: Config;
  request: Request;
  returnUrl?: string;
}): string {
  const ru = _getReturnUrl({ request, returnUrl });

  return _getApiUrl({
    state: { request, config, communities: {} },
    url: '/user/logout',
    parameters: { redirectUrl: ru }
  });

  //const pfx = _getServerWithContextPath(config);
  //return pfx + '/logout?redirectUrl=' + ru;
}

/**
 * Logout
 * @param redirectUrl
 * @returns {Thunk<XcapJsonResult>}
 */
export function logout({
  redirectUrl
}: { redirectUrl?: string | null } & XcapOptionalParameters): Thunk<Promise<XcapJsonResult>> {
  const r = post({
    url: '/user/logout',
    parameters: arguments
  });

  clearPersistentData();
  clearAccessToken();

  return r;
}

export interface LoginResult extends XcapJsonResult {
  loginFailed: boolean;
  redirectUrl: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  provider?: string | null;
}

/**
 * Login.
 * This will redirect the user to the provider specific login url.
 * Client side only!
 * Some login providers may have extra parameters.
 * The email provider requires email and password to be supplied.
 */
export function login(
  props: {
    provider: AuthenticationType;
    email?: string;
    password?: string;
    returnUrl?: string;
    config: Config;
    request: Request;
  } & XcapOptionalParameters
): Thunk<Promise<XcapJsonResult> | string> {
  // FIXME: return type
  const { provider, email, password, returnUrl, config, request } = props;
  const communityPermalink = props[COMMUNITY_PARAMETER];

  switch (provider) {
    case AuthenticationType.XCAP: {
      return post({
        url: '/user/login',
        parameters: {
          returnUrl,
          c: communityPermalink,
          xcap_email: email,
          xcap_password: password,
          [COMMUNITY_PARAMETER]: communityPermalink
        }
      });
    }

    case AuthenticationType.FACEBOOK:
    case AuthenticationType.GOOGLE:
    case AuthenticationType.OAUTH2: {
      const url = _getLoginUrl({ provider, returnUrl, config, request, communityPermalink });
      if (isRunningInBrowser()) {
        window.location = url;
      }
      return (): string => url;
    }

    default:
      throw Error('login(): provider "' + provider + '" not supported');
  }
}

/**
 * Handle the redirects when logging in.
 * @param loginResult Response from the login or verifyEmail method.
 * @param request
 * @param email
 * @param returnUrl
 * @returns {boolean}
 */
export function performLoginRedirect({
  loginResult,
  request,
  email,
  returnUrl
}: {
  loginResult: LoginResult;
  request: Request;
  email?: string;
  returnUrl?: string;
}): boolean {
  // FIXME: Move this browser functionality to frontend project

  if (loginResult.error || loginResult.loginFailed) {
    return false;
  }

  switch (loginResult.__resultCode) {
    case 'verify':
      browserHistory.push(
        request.contextPath +
          '/register/verify?email=' +
          (email ? encodeURIComponent(email) : '') +
          '&provider=' +
          encodeURIComponent(loginResult.provider ? loginResult.provider : AuthenticationType.XCAP)
      );
      break;

    case 'register':
      browserHistory.push(
        request.contextPath +
          '/register/details?email=' +
          (loginResult.email ? encodeURIComponent(loginResult.email) : '') +
          '&provider=' +
          (loginResult.provider ? encodeURIComponent(loginResult.provider) : '') +
          (loginResult.firstName ? '&firstName=' + encodeURIComponent(loginResult.firstName) : '') +
          (loginResult.lastName ? '&lastName=' + encodeURIComponent(loginResult.lastName) : '') +
          (returnUrl ? '&returnUrl=' + encodeURIComponent(returnUrl) : '') +
          (loginResult.userReferenceId ? '&userReferenceId=' + encodeURIComponent(loginResult.userReferenceId) : '')
      );
      break;

    case 'blocked':
      browserHistory.push(request.contextPath + '/user/blocked');
      break;

    case 'inactive':
      //browserHistory.push(request.contextPath + '/user/removed');
      return false;

    case 'none': // Already logged in
    default: {
      // Reload desired
      const r = typeof returnUrl === 'string' ? returnUrl : request.absoluteCommunityUrl;

      if (isRunningInBrowser()) {
        if (window.location.href === r) {
          window.location.reload();
        } else {
          window.location = r;
        }
      }
      break;
    }
  }

  return true;
}

/**
 * Send a token to the email address that will allow the user to change password.
 * @param email
 */
export function sendPasswordChangeToken({ email }: { email: string }): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/user/send-password-change-token',
    parameters: arguments
  });
}

export interface ChangePasswordResult extends XcapJsonResult {
  returnUrl: string | null;
}

/**
 * Change password.
 *
 * This method has two ways of operation:
 *
 * - When not logged in, supply a code to change the password
 * - When logged in, supply the old password
 *
 * @param email User email adress
 * @param checkCode Verification code (optional)
 * @param oldPassword Old password as verification (optional)
 * @param password The new password
 * @param returnUrl The url to return to when the password is changed
 */
export function changePassword({
  email,
  checkCode,
  oldPassword,
  password,
  returnUrl
}: {
  email: string;
  checkCode?: string;
  oldPassword?: string;
  password: string;
  returnUrl?: string;
} & XcapOptionalParameters): Thunk<Promise<ChangePasswordResult>> {
  return post({
    url: '/user/change-password',
    parameters: arguments
  });
}
