//@flow
import get from 'lodash/get';
import { User } from '../user';
import { LoginActions } from './loginAction';
import { clearPersistentData } from '../api/AccessToken';

export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const UPDATE_LOGIN_DATA = 'UPDATE_LOGIN_DATA';
export const REQUEST_LOGIN_DATA = 'REQUEST_LOGIN_DATA';

export interface CurrentUserType {
  isLoggedIn: boolean;
  lastUpdated: number;
  user: User | null;
}

export const loginReducer = (
  state: CurrentUserType = { isLoggedIn: false, lastUpdated: 0, user: null },
  action: LoginActions
): Partial<CurrentUserType> => {
  const now = new Date().getTime();
  switch (action.type) {
    case LOGIN:
      return Object.assign({}, state, { isLoggedIn: true, lastUpdated: now });

    case LOGOUT:
      clearPersistentData();
      return Object.assign({}, state, { isLoggedIn: false, lastUpdated: now });

    case REQUEST_LOGIN_DATA:
      return state;

    case UPDATE_LOGIN_DATA:
      if (get(action, 'json.user')) {
        return Object.assign({}, { isLoggedIn: true, lastUpdate: now }, action.json);
      }
      return Object.assign({}, state, { isLoggedIn: false, lastUpdated: now });

    default:
      return state;
  }
};

export default loginReducer;
