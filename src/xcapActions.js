//@flow

import { getInitialStoreValues, type GetInitialStoreValuesResult } from './api.js';
import { recieveLoginData } from '../login/loginAction.js';
import { loadCommunity, receiveResourceUsage } from '../stackend/communityAction.js';
import { receiveNotificationCounts } from '../notifications/notificationActions.js';
import { XCAP_INITIAL_STORE_DATA_RECIEVED } from './configReducer.js';
import type { Thunk } from '../types/store.js';
import { setRequestInfo } from '../requestActions.js';
import { recieveModules } from '../stackend/moduleAction.js';
import { recieveContents } from '../cms/cmsActions.js';
import { recievePages, recieveSubSites } from '../cms/pageActions.js';

/*
 * Populate the initial redux store.
 */
export function loadInitialStoreValues({
	permalink,
	domain,
	cookie,
	communityId,
	moduleIds,
	contentIds,
	pageIds,
	subSiteIds,
	referenceUrl,
	stackendMode = false
}: {
	permalink?: string,
	domain?: string,
	cookie?: string,
	communityId?: number,
	moduleIds?: Array<number>,
	contentIds?: Array<number>,
	pageIds?: Array<number>,
	subSiteIds?: Array<number>,
	referenceUrl?: string,
	stackendMode?: boolean
}): Thunk<GetInitialStoreValuesResult> {
	return async (dispatch: any) => {
		const r = await dispatch(
			getInitialStoreValues({
				permalink,
				domain,
				cookie,
				communityId,
				moduleIds,
				contentIds,
				pageIds,
				subSiteIds,
				referenceUrl,
				stackendMode
			})
		);

		if (typeof r === 'undefined' || r === null || r.error) {
			return r;
		}

		if (Object.keys(r.modules).length !== 0) {
			dispatch(recieveModules({ modules: r.modules }));
		}

		if (r.cmsContents && Object.keys(r.cmsContents).length !== 0) {
			dispatch(recieveContents(r.cmsContents));
		}

		if (r.cmsPages && Object.keys(r.cmsPages).length !== 0) {
			dispatch(recievePages({ pages: r.cmsPages }));
		}

		if (r.subSites && Object.keys(r.subSites).length !== 0) {
			dispatch(recieveSubSites({ subSites: r.subSites }));
		}

		dispatch(recieveInitialStoreValues(r));
		dispatch(setRequestInfo({ referenceUrlId: r.referenceUrlId }));
		dispatch(recieveLoginData({ user: r.user }));
		dispatch(loadCommunity(r.stackendCommunity));
		dispatch(receiveNotificationCounts({ numberOfUnseen: r.numberOfUnseen }));

		dispatch(receiveResourceUsage(r));

		/* TODO: Handle this
		if (r.data)
		{
			if (r.data.comments)
			{
				console.log("Recieved comments", r.data.comments);
			}

			if (r.data.group)
			{
				console.log("Recieved feeds", r.data.group);
			}
		}
		*/

		return r;
	};
}

function recieveInitialStoreValues(json) {
	return {
		type: XCAP_INITIAL_STORE_DATA_RECIEVED,
		json
	};
}
