//@flow
import { SET_REQUEST_INFO } from './requestReducers.js';
import { type Location } from './request.js';
import { type StackendAnchor } from './request.js';

/**
 * Sets up an implementaion neutral object that keeps track of the current url
 */
export function setRequestInfo(request: {
	location?: Location,
	cookie?: string | null,
	absoluteUrl?: string,
	communityUrl?: string,
	absoluteCommunityUrl?: string,
	communityFromDomain?: boolean,
	contextPath?: string,
	anchor?: StackendAnchor
}) {
	return {
		type: SET_REQUEST_INFO,
		request
	};
}
