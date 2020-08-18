//@flow

import { getInitialStoreValues, GetInitialStoreValuesResult, newXcapJsonResult, Thunk } from './api';
import { receiveLoginData } from './login/loginAction';
import { loadCommunity, receiveResourceUsage } from './stackend/communityAction';
import { XCAP_INITIAL_STORE_DATA_RECEIVED } from './configReducer';
import { setRequestInfo } from './request/requestActions';
import { receiveModules } from './stackend/moduleAction';
import { receiveContents } from './cms/cmsActions';
import { receivePages, receiveSubSites } from './cms/pageActions';
import { AnyAction } from 'redux';
//import { receiveNotificationCounts } from './notifications/notificationActions';


function receiveInitialStoreValues(json: any): AnyAction {
  return {
    type: XCAP_INITIAL_STORE_DATA_RECEIVED,
    json,
  };
}

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
  stackendMode = false,
}: {
  permalink?: string;
  domain?: string;
  cookie?: string;
  communityId?: number;
  moduleIds?: Array<number>;
  contentIds?: Array<number>;
  pageIds?: Array<number>;
  subSiteIds?: Array<number>;
  referenceUrl?: string;
  stackendMode?: boolean;
}): Thunk<GetInitialStoreValuesResult> {
  return async (dispatch: any): Promise<GetInitialStoreValuesResult> => {
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
        stackendMode,
      })
    );

    if (typeof r === 'undefined' || r === null || r.error) {
      return r;
    }

    if (Object.keys(r.modules).length !== 0) {
      dispatch(receiveModules({ modules: r.modules }));
    }

    if (r.cmsContents && Object.keys(r.cmsContents).length !== 0) {
      dispatch(receiveContents(r.cmsContents));
    }

    if (r.cmsPages && Object.keys(r.cmsPages).length !== 0) {
      dispatch(receivePages(newXcapJsonResult("success", { pages: r.cmsPages })));
    }

    if (r.subSites && Object.keys(r.subSites).length !== 0) {
      dispatch(receiveSubSites({ subSites: r.subSites }));
    }

    dispatch(receiveInitialStoreValues(r));
    dispatch(setRequestInfo({ referenceUrlId: r.referenceUrlId }));
    dispatch(receiveLoginData({ user: r.user }));
    dispatch(loadCommunity(r.stackendCommunity));
    //dispatch(receiveNotificationCounts({ numberOfUnseen: r.numberOfUnseen }));

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

