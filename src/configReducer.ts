//@flow
import _ from 'lodash';
import { Config, DeployProfile, STACKEND_DEFAULT_SERVER } from './api'

export const XCAP_INITIAL_STORE_DATA_RECIEVED = 'XCAP_INITIAL_STORE_DATA_RECIEVED';

const initialState: Config = {
  apiUrl: STACKEND_DEFAULT_SERVER + "/api",
  contextPath: "",
  server: STACKEND_DEFAULT_SERVER,
  deployProfile: DeployProfile.STACKEND,
  gaKey: null,
  recaptchaSiteKey: null
}

const configReducer = (state: Config = initialState, action: any) => {
	switch (action.type) {
		case XCAP_INITIAL_STORE_DATA_RECIEVED:
			return _.get(action, 'json.xcapApiConfiguration', {});
		default:
			return state;
	}
};

export default configReducer;
