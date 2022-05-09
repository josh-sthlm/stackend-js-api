import {
  Config,
  getInitialStoreValues,
  GetInitialStoreValuesRequest,
  GetInitialStoreValuesResult,
  newXcapJsonResult,
  setConfigDefaults,
  setConfiguration,
  setLogger,
  Thunk
} from './index';
import { receiveLoginData } from '../login/loginAction';
import { receiveResourceUsage, ResourceUsage, setCurrentCommunity } from '../stackend/communityAction';
import { XCAP_INITIAL_STORE_DATA_RECEIVED } from './configReducer';
import { setRequestInfo } from '../request/requestActions';
import { receiveModules } from '../stackend/moduleAction';
import { receiveContents } from '../cms/cmsActions';
import { receivePages, receiveSubSites } from '../cms/pageActions';
import { AnyAction } from 'redux';
import { Page, Content, PageContent } from '../cms';
import { ModuleType } from '../stackend/modules';
import { Community } from '../stackend';
import {
  RECEIVE_COLLECTIONS,
  RECEIVE_LISTINGS,
  RECEIVE_MULTIPLE_PRODUCTS,
  RECEIVE_SHOPIFY_DOMAIN_REFERENCE_URL_ID
} from '../shop/shopReducer';
import Logger from '../util/Logger';
import { LoadJsonResult } from './LoadJson';
import { setCommunityVATS } from '../shop/shopActions';

export interface InitializeRequest extends GetInitialStoreValuesRequest {
  config?: Partial<Config>;
  logger?: Logger;
}

/**
 * Initialize the stackend API.
 * Supply either communityId or permalink
 * @param props
 */
export function initialize(props: InitializeRequest): Thunk<Promise<GetInitialStoreValuesResult>> {
  return async (dispatch: any): Promise<GetInitialStoreValuesResult> => {
    if (!props.communityId && !props.permalink) {
      throw Error('Supply communityId or permalink');
    }

    if (props.logger) {
      setLogger(props.logger);
    }

    if (props.config) {
      setConfigDefaults(props.config);
      dispatch(setConfiguration(props.config));
    }

    return dispatch(loadInitialStoreValues(props));
  };
}

function receiveInitialStoreValues(json: any): AnyAction {
  return {
    type: XCAP_INITIAL_STORE_DATA_RECEIVED,
    json
  };
}

/**
 * @deprecated Use GetInitialStoreValuesRequest instead
 */
export type LoadInitialStoreValuesRequest = GetInitialStoreValuesRequest;

/*
 * Populate the initial redux store.
 */
export function loadInitialStoreValues(
  params: GetInitialStoreValuesRequest
): Thunk<Promise<GetInitialStoreValuesResult>> {
  return async (dispatch: any): Promise<GetInitialStoreValuesResult> => {
    const r: GetInitialStoreValuesResult = await dispatch(getInitialStoreValues(params));

    if (typeof r === 'undefined' || r === null || r.error) {
      return r;
    }
    if (Object.keys(r.modules).length !== 0) {
      dispatch(receiveModules({ modules: r.modules }));
    }

    const allCmsContents: { [id: string]: Content } = {};

    if (r.cmsPages && Object.keys(r.cmsPages).length !== 0) {
      dispatch(receivePages(newXcapJsonResult('success', { pages: r.cmsPages })));

      // Add content
      Object.values(r.cmsPages).forEach(p => {
        const page: Page = p as Page;
        page.content.forEach((pc: PageContent) => {
          if (pc.type === ModuleType.CMS) {
            if (pc.referenceRef) {
              allCmsContents[pc.referenceRef.id] = pc.referenceRef;
            } else {
              console.warn('Stackend: cms content ' + pc.name + ' of page ' + page.id + ' is missing');
            }
          }
        });
      });
    }

    if (r.cmsContents && Object.keys(r.cmsContents).length !== 0) {
      Object.values(r.cmsContents).forEach(c => {
        const y = c as Content;
        if (y) {
          allCmsContents[y.id] = y;
        }
      });
    }

    if (Object.keys(allCmsContents).length !== 0) {
      dispatch(receiveContents(allCmsContents));
    }

    if (r.subSites && Object.keys(r.subSites).length !== 0) {
      dispatch(receiveSubSites({ subSites: r.subSites }));
    }

    dispatch(receiveInitialStoreValues(r));
    dispatch(setRequestInfo({ referenceUrlId: r.referenceUrlId }));
    dispatch(receiveLoginData({ user: r.user }));
    dispatch(setCurrentCommunity(r.stackendCommunity as Community));
    dispatch(setCommunityVATS(r.stackendCommunity as Community));
    //dispatch(receiveNotificationCounts({ numberOfUnseen: r.numberOfUnseen }));

    dispatch(receiveResourceUsage(r as any as ResourceUsage)); // fields not documented

    if (r.shopData) {
      const { products, collections, listings, shopifyDomainReferenceUrlId } = r.shopData;
      if (Object.keys(products).length !== 0) {
        dispatch({
          type: RECEIVE_MULTIPLE_PRODUCTS,
          json: {
            products
          }
        });
      }

      if (Object.keys(collections).length !== 0) {
        dispatch({ type: RECEIVE_COLLECTIONS, collections });
      }

      if (Object.keys(listings).length !== 0) {
        dispatch({ type: RECEIVE_LISTINGS, listings });
      }

      if (shopifyDomainReferenceUrlId !== 0) {
        dispatch({ type: RECEIVE_SHOPIFY_DOMAIN_REFERENCE_URL_ID, shopifyDomainReferenceUrlId });
      }
    }

    /* TODO: Handle this
		if (r.data)
		{

		}
		*/

    return r;
  };
}

/**
 * Signals that an api access has failed due to some error, for example server down or insufficient privileges.
 * A custom reducer could set up logic to handle re-authentication
 */
export const XCAP_API_ACCESS_FAILED = 'XCAP_API_ACCESS_FAILED';

export type ApiAccessFailedAction = AnyAction & {
  url: string;
  result: LoadJsonResult;
};

/**
 * Signals that an api access has failed due to some error, for example server down or insufficient privileges
 *
 * @param url
 * @param result
 */
export function signalApiAccessFailed(url: string, result: LoadJsonResult): ApiAccessFailedAction {
  return {
    type: XCAP_API_ACCESS_FAILED,
    url,
    result
  };
}
