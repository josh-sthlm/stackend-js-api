//@flow
import { LOGIN, LOGOUT, REQUEST_LOGIN_DATA, UPDATE_LOGIN_DATA } from './loginReducer';
import { getCurrentUser } from '../user/user';
import type { Thunk } from '../store';
import _ from 'lodash';

const LOGIN_TTL: number = 60 * 1000;

//Action Creator
export function reduxLogin() {
	return {
		type: LOGIN
	};
}

export function reduxLogout() {
	return {
		type: LOGOUT
	};
}

//Action Creator
function requestLoginData() {
	return {
		type: REQUEST_LOGIN_DATA
	};
}

//Action Creator
/**
 * Refresh the current user. Cached 1 minute.
 * @param params { force?:boolean }
 * @returns {function(any, any)}
 */
export function refreshLoginData(params?: any): Thunk<any> {
	return async (dispatch: any, getState: any) => {
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

			//const cpl = _.get(getState(),`communities.community.permalink`);
			//const community = !!cpl ? `/${cpl}` : '';
			//let apiUrl = `${api.getServerWithContextPath()+community}/api/user/get`;
			dispatch(requestLoginData());
			const json = await dispatch(getCurrentUser());
			return dispatch(recieveLoginData(json));
		} catch (e) {
			console.error("Couldn't refreshLoginData: ", e);
		}
	};
}

export function recieveLoginData(json: any) {
	return {
		type: UPDATE_LOGIN_DATA,
		json
	};
}
