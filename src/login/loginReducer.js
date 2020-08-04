//@flow
import _ from 'lodash/object';
import { type User } from '../user/user.js';

export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const UPDATE_LOGIN_DATA = 'UPDATE_LOGIN_DATA';
export const REQUEST_LOGIN_DATA = 'REQUEST_LOGIN_DATA';

export type CurrentUserType = {
	isLoggedIn: boolean,
	lastUpdated: number,
	user: ?User
};

const loginReducer = (
	state: CurrentUserType = { isLoggedIn: false, lastUpdated: 0 },
	action: any
) => {
	let now = new Date().getTime();
	switch (action.type) {
		case LOGIN:
			return (state = { isLoggedIn: true, lastUpdate: now });
		case LOGOUT:
			return (state = { isLoggedIn: false, lastUpdate: now });
		case REQUEST_LOGIN_DATA:
			return state;
		case UPDATE_LOGIN_DATA:
			if (_.get(action, 'json.user')) {
				return Object.assign({}, { isLoggedIn: true, lastUpdate: now }, action.json);
			} else return (state = { isLoggedIn: false, lastUpdate: now });
		default:
			return state;
	}
};

export { loginReducer };
