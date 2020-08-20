//@flow
import { SET_REQUEST_INFO } from './requestReducers';
import { Location, StackendAnchor } from './index';
import { AnyAction } from 'redux';


/**
 * Sets up an implementation neutral object that keeps track of the current url
 */
export function setRequestInfo(request: {
	location?: Location;
	cookie?: string | null;
	absoluteUrl?: string;
	communityUrl?: string;
	absoluteCommunityUrl?: string;
	communityFromDomain?: boolean;
	referenceUrlId?: number;
	contextPath?: string;
	anchor?: StackendAnchor;
}): AnyAction {
	return {
		type: SET_REQUEST_INFO,
		request
	};
}
