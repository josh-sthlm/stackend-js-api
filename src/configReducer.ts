//@flow
import _ from 'lodash';
import { Config, DeployProfile, STACKEND_DEFAULT_CONTEXT_PATH, STACKEND_DEFAULT_SERVER } from './api';
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
  config: Config;
};

export type ConfigActions = InitialDataAction | SetConfigAction;

const configReducer = (
  state: Config = {
    apiUrl: STACKEND_DEFAULT_SERVER + '/api',
    contextPath: STACKEND_DEFAULT_CONTEXT_PATH,
    server: STACKEND_DEFAULT_SERVER,
    deployProfile: DeployProfile.STACKEND,
    gaKey: null,
    recaptchaSiteKey: null,
  },
  action: ConfigActions
): Config => {
  switch (action.type) {
    case XCAP_INITIAL_STORE_DATA_RECEIVED:
      return _.get(action, 'json.xcapApiConfiguration', {});

    case XCAP_SET_CONFIG:
      return Object.assign({}, state, (action as SetConfigAction).config);

    default:
      return state;
  }
};

export default configReducer;
