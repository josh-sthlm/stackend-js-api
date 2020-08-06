//@flow

import {
	XCAP_MODAL_THROBBER_INCREASE,
	XCAP_MODAL_THROBBER_DECREASE,
	XCAP_LOADING_THROBBER_INCREASE,
	XCAP_LOADING_THROBBER_DECREASE
} from './throbberReducer';
import { Thunk } from '../api';

/**
 * Show/hide the modal throbber
 * @param visible
 */
export function setModalThrobberVisible(visible: boolean): Thunk<void> {
	return async (dispatch) => {
		dispatch({
			type: visible ? XCAP_MODAL_THROBBER_INCREASE : XCAP_MODAL_THROBBER_DECREASE
		});
	};
}

/**
 * Show/hide the unobtrusive loading throbber
 * @param visible
 * @returns {Function}
 */
export function setLoadingThrobberVisible(visible: boolean): Thunk<void> {
	return async (dispatch) => {
		dispatch({
			type: visible ? XCAP_LOADING_THROBBER_INCREASE : XCAP_LOADING_THROBBER_DECREASE
		});
	};
}
