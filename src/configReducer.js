//@flow
import _ from 'lodash/object';

export const XCAP_INITIAL_STORE_DATA_RECIEVED = 'XCAP_INITIAL_STORE_DATA_RECIEVED';

const configReducer = (state: any = {}, action: any) => {
	switch (action.type) {
		case XCAP_INITIAL_STORE_DATA_RECIEVED:
			return _.get(action, 'json.xcapApiConfiguration', {});
		default:
			return state;
	}
};

export default configReducer;
