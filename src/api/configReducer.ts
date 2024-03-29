import get from 'lodash/get';
import { Config, DeployProfile, STACKEND_DEFAULT_CONTEXT_PATH, STACKEND_DEFAULT_SERVER } from './index';
import { Action } from 'redux';

export const XCAP_INITIAL_STORE_DATA_RECEIVED = 'XCAP_INITIAL_STORE_DATA_RECEIVED';
export const XCAP_SET_CONFIG = 'XCAP_SET_CONFIG';

type InitialDataAction = Action & {
  type: typeof XCAP_INITIAL_STORE_DATA_RECEIVED;
  json: {
    xcapApiConfiguration: Config;
  };
};

type SetConfigAction = Action & {
  type: typeof XCAP_SET_CONFIG;
  config: Partial<Config>;
};

export type ConfigActions = InitialDataAction | SetConfigAction;

const configReducer = (
  state: Config = {
    apiUrl: STACKEND_DEFAULT_SERVER + STACKEND_DEFAULT_CONTEXT_PATH + '/api',
    contextPath: STACKEND_DEFAULT_CONTEXT_PATH,
    server: STACKEND_DEFAULT_SERVER,
    deployProfile: DeployProfile.STACKEND,
    gaKey: null,
    recaptchaSiteKey: null
  },
  action: ConfigActions
): Config => {
  switch (action.type) {
    case XCAP_INITIAL_STORE_DATA_RECEIVED:
      return get(action, 'json.xcapApiConfiguration', state);

    case XCAP_SET_CONFIG: {
      const c = (action as SetConfigAction).config;
      if (c.server) {
        let cp = c.contextPath;
        if (typeof cp !== 'string') {
          cp = state.contextPath || '';
        }
        if (c.server.endsWith('/')) {
          cp = cp.replace(/^\//, '');
        }
        if (cp.endsWith('/')) cp = cp.replace(/\/$/, '');
        c.apiUrl = c.server + cp + '/api';
      }

      return Object.assign({}, state, c);
    }
    default:
      return state;
  }
};

export default configReducer;
