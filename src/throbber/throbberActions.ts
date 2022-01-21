import {
  XCAP_MODAL_THROBBER_INCREASE,
  XCAP_MODAL_THROBBER_DECREASE,
  XCAP_LOADING_THROBBER_INCREASE,
  XCAP_LOADING_THROBBER_DECREASE,
  ThrobberActions,
  ThrobberState,
  XCAP_LOADING_COMPLETE
} from './throbberReducer';
import { Thunk } from '../api';

/**
 * Show/hide the modal throbber
 * @param visible
 */
export function setModalThrobberVisible(visible: boolean): Thunk<void> {
  return (dispatch): ThrobberActions => {
    return dispatch({
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
  return (dispatch, getState): void => {
    dispatch({
      type: visible ? XCAP_LOADING_THROBBER_INCREASE : XCAP_LOADING_THROBBER_DECREASE
    });

    if (!visible) {
      const throbber: ThrobberState = getState().throbber;
      if (!throbber.loading) {
        dispatch({
          type: XCAP_LOADING_COMPLETE
        });
      }
    }
  };
}
