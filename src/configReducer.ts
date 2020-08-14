//@flow
import _ from 'lodash';
import { Config, DeployProfile, STACKEND_DEFAULT_CONTEXT_PATH, STACKEND_DEFAULT_SERVER } from './api';
import { Action } from 'redux';

export const XCAP_INITIAL_STORE_DATA_RECIEVED = 'XCAP_INITIAL_STORE_DATA_RECIEVED';
export const XCAP_SET_CONFIG = 'XCAP_SET_CONFIG';

type InitialDataAction = Action & {
  json: {
    xcapApiConfiguration: Config;
  };
};

type SetConfigAction = Action & {
  config: Config;
};

type Actions = InitialDataAction | SetConfigAction;

const configReducer = (
  state: Config = {
    apiUrl: STACKEND_DEFAULT_SERVER + '/api',
    contextPath: STACKEND_DEFAULT_CONTEXT_PATH,
    server: STACKEND_DEFAULT_SERVER,
    deployProfile: DeployProfile.STACKEND,
    gaKey: null,
    recaptchaSiteKey: null,
  },
  action: Actions
): Config => {
  switch (action.type) {
    case XCAP_INITIAL_STORE_DATA_RECIEVED:
      return _.get(action, 'json.xcapApiConfiguration', {});

    case XCAP_SET_CONFIG:
      return Object.assign({}, state, (action as SetConfigAction).config);

    default:
      return state;
  }
};

export default configReducer;
