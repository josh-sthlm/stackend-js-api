//@flow
import { LOGIN, LOGOUT, REQUEST_LOGIN_DATA, UPDATE_LOGIN_DATA } from './loginReducer';
import { getCurrentUser, User } from '../user';
import { newXcapJsonResult, post, Thunk, XcapJsonResult } from '../api';
import get from 'lodash/get';
import { getAccessTokenValue, getPersistentData, PersistentData } from '../api/AccessToken';

const LOGIN_TTL: number = 60 * 1000;

export type LoginActions =
  | {
      type: typeof LOGIN;
    }
  | {
      type: typeof LOGOUT;
    }
  | {
      type: typeof REQUEST_LOGIN_DATA;
    }
  | {
      type: typeof UPDATE_LOGIN_DATA;
      json: {
        user: User | null;
        [rest: string]: any;
      };
    };

//Action Creator
export function reduxLogin(): LoginActions {
  return {
    type: LOGIN
  };
}

export function reduxLogout(): LoginActions {
  return {
    type: LOGOUT
  };
}

//Action Creator
function requestLoginData(): LoginActions {
  return {
    type: REQUEST_LOGIN_DATA
  };
}

//Action Creator
/**
 * Refresh the current user. Cached 1 minute.
 * @param params { force?:boolean }
 * @returns
 */
export function refreshLoginData(params?: { force?: boolean }): Thunk<Promise<any>> {
  return async (dispatch: any, getState): Promise<any> => {
    try {
      const { currentUser } = getState();

      const useCache = !get(params, 'force', false);

      // Don't refresh more than once a minute if logged in
      if (useCache && typeof currentUser !== 'undefined' && currentUser.isLoggedIn) {
        const now = new Date().getTime();
        if (now - currentUser.lastUpdate < LOGIN_TTL) {
          return;
        }
      }

      dispatch(requestLoginData());
      const json = await dispatch(getCurrentUser());
      return dispatch(receiveLoginData(json));
    } catch (e) {
      console.error("Couldn't refreshLoginData: ", e);
    }
  };
}

export function receiveLoginData(json: { user: User | null }): LoginActions {
  return {
    type: UPDATE_LOGIN_DATA,
    json
  };
}

export interface AuthenticateUsingCredentialsResult extends XcapJsonResult {
  /**
   * The current user
   */
  user: User | null;

  /**
   * Additional communities the user was authenticated to
   */
  authenticatedToCommunities: Array<string>;
}

/**
 * Authenticate a user using its credentials.
 * @param credentials optional credentials
 * @param community optional community name
 */
export function authenticateUsingCredentials({
  credentials,
  community
}: {
  credentials?: PersistentData;
  community?: string;
}): Thunk<Promise<AuthenticateUsingCredentialsResult>> {
  return async (dispatch: any, getState): Promise<any> => {
    if (!credentials) {
      credentials = getPersistentData();
    }

    // Skip if no credentials or access token
    const at = getAccessTokenValue();
    if (!at && (!credentials || Object.keys(credentials).length == 0)) {
      return newXcapJsonResult<AuthenticateUsingCredentialsResult>('success', {
        user: null,
        authenticatedToCommunities: []
      });
    }

    // if (credentials && Object.keys(credentials).length != 0) {
    const r: AuthenticateUsingCredentialsResult = await dispatch(
      post({
        url: '/user/get-current',
        community,
        parameters: {
          credentials: JSON.stringify(credentials)
        }
      })
    );

    if (!r.error) {
      dispatch(
        receiveLoginData({
          user: r.user
        })
      );
    }

    return r;
  };
}
