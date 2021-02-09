//@flow

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
import { loadCommunity, receiveResourceUsage, ResourceUsage } from '../stackend/communityAction';
import { XCAP_INITIAL_STORE_DATA_RECEIVED } from './configReducer';
import { setRequestInfo } from '../request/requestActions';
import { receiveModules } from '../stackend/moduleAction';
import { receiveContents } from '../cms/cmsActions';
import { receivePages, receiveSubSites } from '../cms/pageActions';
import { AnyAction } from 'redux';
import { Page, Content, PageContent } from '../cms';
import { ModuleType } from '../stackend/modules';
import { Community } from '../stackend';
import { RECEIVE_COLLECTIONS, RECEIVE_LISTINGS, RECEIVE_MULTIPLE_PRODUCTS } from '../shop/shopReducer';
import Logger from '../util/Logger';

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
  productHandles,
  productCollectionHandles,
  productListings,
  shopImageMaxWidth,
  shopListingImageMaxWidth
}: GetInitialStoreValuesRequest): Thunk<Promise<GetInitialStoreValuesResult>> {
  return async (dispatch: any): Promise<GetInitialStoreValuesResult> => {
    const r: GetInitialStoreValuesResult = await dispatch(
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
        productHandles,
        productCollectionHandles,
        productListings,
        shopImageMaxWidth,
        shopListingImageMaxWidth
      })
    );

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
        allCmsContents[y.id] = y;
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
    dispatch(loadCommunity(r.stackendCommunity as Community));
    //dispatch(receiveNotificationCounts({ numberOfUnseen: r.numberOfUnseen }));

    dispatch(receiveResourceUsage((r as any) as ResourceUsage)); // fields not documented

    if (r.shopData) {
      const { products, collections, listings } = r.shopData;
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
    }

    /* TODO: Handle this
		if (r.data)
		{

		}
		*/

    return r;
  };
}
