//@flow
import { LOGIN, LOGOUT, REQUEST_LOGIN_DATA, UPDATE_LOGIN_DATA } from './loginReducer';
import { getCurrentUser, User } from '../user';
import { Thunk } from '../api';
import _ from 'lodash';

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
    type: LOGIN,
  };
}

export function reduxLogout(): LoginActions {
  return {
    type: LOGOUT,
  };
}

//Action Creator
function requestLoginData(): LoginActions {
  return {
    type: REQUEST_LOGIN_DATA,
  };
}

//Action Creator
/**
 * Refresh the current user. Cached 1 minute.
 * @param params { force?:boolean }
 * @returns
 */
export function refreshLoginData(params?: any): Thunk<any> {
  return async (dispatch: any, getState): Promise<any> => {
    try {
      const { currentUser } = getState();

      const useCache = !_.get(params, 'force', false);

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
    json,
  };
}
