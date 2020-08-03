//@flow
import _ from 'lodash/object';
import type { Thunk } from '../types/store.js';
import { type Request } from '../request.js';
import {
	type XcapJsonResult,
	_getServerWithContextPath,
	type Config,
	post,
	_getApiUrl
} from '../xcap/api.js';

import { browserHistory } from 'react-router';

declare var xcapModuleSettings: any; // FIXME: For backward compatibility

/**
 * Ways to log in.
 */
export const AuthenticationType = {
	/**
	 * Login using facebook
	 */
	FACEBOOK: 'FACEBOOK',

	/**
	 * Login using email+password
	 */
	XCAP: 'XCAP',

	/**
	 * Login using google token
	 */
	GOOGLE: 'GOOGLE',

	/**
	 * Custom oauth solution
	 */
	OAUTH2: 'OAUTH2'
};

export type AuthenticationTypeId = $Values<typeof AuthenticationType>;

const AUTH_NAMES = {
	[AuthenticationType.FACEBOOK]: 'Facebook',
	[AuthenticationType.GOOGLE]: 'Google',
	[AuthenticationType.XCAP]: 'E-mail & password',
	[AuthenticationType.OAUTH2]: 'OAuth2'
};

export function getAuthenticationTypeName(type: AuthenticationTypeId) {
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
export function getAuthenticationTypeByUserPermalink(permalink: string): AuthenticationTypeId {
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
	config: Config,
	request?: ?Request,
	returnUrl?: ?string,
	communityPermalink?: ?string,
	provider: AuthenticationTypeId
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
			let parameters = {};
			if (returnUrl) {
				parameters.returnUrl = returnUrl;
			}

			if (communityPermalink) {
				parameters.c = communityPermalink;
			}

			parameters.email = _.get(arguments[0], 'email');
			parameters.password = _.get(arguments[0], 'password');

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
			throw '_getLoginUrl() provider "' + provider + '" not supported';
	}
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
	config: Config,
	request: Request,
	returnUrl?: string
}): string {
	const ru = _getReturnUrl({ request, returnUrl });

	const l = _getApiUrl({
		state: { request, config, communities: {} },
		url: '/user/logout',
		parameters: { redirectUrl: ru }
	});

	return l;

	//const pfx = _getServerWithContextPath(config);
	//return pfx + '/logout?redirectUrl=' + ru;
}

function _getReturnUrl({ request, returnUrl }: { request: Request, returnUrl?: string }): string {
	let pfx = '';
	if (!returnUrl) {
		// FIXME: Old stuff
		if (xcapModuleSettings && xcapModuleSettings.qna && xcapModuleSettings.qna.loginRedirectUrl) {
			return encodeURIComponent(xcapModuleSettings.qna.loginRedirectUrl);
		} else {
			returnUrl = '';
			returnUrl += _.get(request, 'location.href', '');
			returnUrl += _.get(request, 'location.search', '');
			return encodeURIComponent(returnUrl);
		}
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
 * Logout
 * @param redirectUrl
 * @returns {Thunk<XcapJsonResult>}
 */
export function logout({ redirectUrl }: { redirectUrl?: ?string }): Thunk<XcapJsonResult> {
	return post({
		url: '/user/logout',
		parameters: arguments
	});
}

export type LoginResult = XcapJsonResult & {
	loginFailed: boolean,
	redirectUrl: string,
	email?: ?string,
	firstName?: ?string,
	lastName?: ?string,
	provider?: ?string
};

/**
 * Login.
 * This will redirect the user to the provider specific login url.
 * Client side only!
 * Some login providers may have extra parameters.
 * The email provider requires email and password to be supplied.
 */
export function login({
	provider,
	returnUrl,
	config,
	request,
	communityPermalink,
	...any
}: {
	provider: AuthenticationTypeId,
	returnUrl?: string,
	config: Config,
	request: Request,
	communityPermalink?: string
}): Thunk<LoginResult> {
	switch (provider) {
		case AuthenticationType.XCAP: {
			let p = arguments[0];
			let xcap_email = p.email;
			let xcap_password = p.password;

			return post({
				url: '/user/login',
				parameters: {
					returnUrl,
					c: communityPermalink,
					xcap_email,
					xcap_password
				},
				community: communityPermalink
			});
		}

		case AuthenticationType.FACEBOOK:
		case AuthenticationType.GOOGLE:
		case AuthenticationType.OAUTH2: {
			let url = _getLoginUrl({ provider, returnUrl, config, request, communityPermalink });
			window.location = url;
			return () => url;
		}

		default:
			throw 'login(): provider "' + provider + '" not supported';
	}
}

/**
 * Handle the redirects when loggin in.
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
	loginResult: LoginResult,
	request: Request,
	email?: string,
	returnUrl?: string
}): boolean {
	if (loginResult.error || loginResult.loginFailed) {
		return false;
	}

	switch (loginResult.__resultCode) {
		case 'verify':
			browserHistory.push(
				request.contextPath +
					'/register/verify?email=' +
					encodeURIComponent(email) +
					'&provider=' +
					encodeURIComponent(loginResult.provider ? loginResult.provider : AuthenticationType.XCAP)
			);
			break;

		case 'none': // Already logged in
			break;

		case 'register':
			browserHistory.push(
				request.contextPath +
					'/register/details?email=' +
					encodeURIComponent(loginResult.email) +
					'&provider=' +
					encodeURIComponent(loginResult.provider) +
					(loginResult.firstName ? '&firstName=' + encodeURIComponent(loginResult.firstName) : '') +
					(loginResult.lastName ? '&lastName=' + encodeURIComponent(loginResult.lastName) : '') +
					(returnUrl ? '&returnUrl=' + encodeURIComponent(returnUrl) : '') +
					(loginResult.userReferenceId
						? '&userReferenceId=' + encodeURIComponent(loginResult.userReferenceId)
						: '')
			);
			break;

		case 'blocked':
			browserHistory.push(request.contextPath + '/user/blocked');
			break;

		case 'inactive':
			//browserHistory.push(request.contextPath + '/user/removed');
			return false;

		default: {
			// Reload desired
			let r = typeof returnUrl === 'string' ? returnUrl : request.absoluteCommunityUrl;

			if (window.location.href === r) {
				window.location.reload();
			} else {
				window.location = r;
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
export function sendPasswordChangeToken({ email }: { email: string }): Thunk<XcapJsonResult> {
	return post({
		url: '/user/send-password-change-token',
		parameters: arguments
	});
}

export type ChangePasswordResult = XcapJsonResult & {
	returnUrl: ?string
};

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
	email: string,
	checkCode?: string,
	oldPassword?: string,
	password: string,
	returnUrl?: string
}): Thunk<ChangePasswordResult> {
	return post({
		url: '/user/change-password',
		parameters: arguments
	});
}
