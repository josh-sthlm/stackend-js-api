export const XCAP_MODAL_THROBBER_INCREASE = 'XCAP_MODAL_THROBBER_INCREASE';
export const XCAP_MODAL_THROBBER_DECREASE = 'XCAP_MODAL_THROBBER_DECREASE';
export const XCAP_LOADING_THROBBER_INCREASE = 'XCAP_LOADING_THROBBER_INCREASE';
export const XCAP_LOADING_THROBBER_DECREASE = 'XCAP_LOADING_THROBBER_DECREASE';

/**
 * Dispatched when the number of requests reaches 0
 */
export const XCAP_LOADING_COMPLETE = 'XCAP_LOADING_COMPLETE';

export interface ThrobberState {
  /** Is the modal throbber visible? */
  visible: boolean;

  /** Number of modal requests */
  n: number;

  /** Is the loading throbber visible? */
  loading: boolean;

  /** Number of loading requests */
  requests: number;
}

export type ThrobberActions =
  | {
      type: typeof XCAP_MODAL_THROBBER_INCREASE;
    }
  | {
      type: typeof XCAP_MODAL_THROBBER_DECREASE;
    }
  | {
      type: typeof XCAP_LOADING_THROBBER_INCREASE;
    }
  | {
      type: typeof XCAP_LOADING_THROBBER_DECREASE;
    };

const throbberReducer = (
  state: ThrobberState = { visible: false, n: 0, loading: false, requests: 0 },
  action: ThrobberActions
): ThrobberState => {
  switch (action.type) {
    case XCAP_MODAL_THROBBER_INCREASE: {
      const n = state.n + 1;
      return {
        visible: n > 0,
        n,
        loading: state.loading,
        requests: state.requests
      };
    }

    case XCAP_MODAL_THROBBER_DECREASE: {
      const m = Math.max(state.n - 1, 0);
      return {
        visible: m > 0,
        n: m,
        loading: state.loading,
        requests: state.requests
      };
    }

    case XCAP_LOADING_THROBBER_INCREASE: {
      const requests = state.requests + 1;
      return {
        visible: state.visible,
        n: state.n,
        loading: requests > 0,
        requests: requests
      };
    }

    case XCAP_LOADING_THROBBER_DECREASE: {
      const x = Math.max(state.requests - 1, 0);
      return {
        visible: state.visible,
        n: state.n,
        loading: x > 0,
        requests: x
      };
    }

    default:
      return state;
  }
};

export default throbberReducer;
