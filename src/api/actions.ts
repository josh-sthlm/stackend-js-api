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
import { Logger } from 'winston';
import { Page, Content, PageContent } from '../cms';
import { ModuleType } from '../stackend/modules';
import { Community, Module } from '../stackend';
import { RECEIVE_COLLECTIONS, RECEIVE_LISTINGS, RECEIVE_MULTIPLE_PRODUCTS } from '../shop/shopReducer';

export interface InitializeRequest extends GetInitialStoreValuesRequest {
  config?: Partial<Config>;
  winstonLogger?: Logger;
}

/**
 * Initialize the stackend API.
 * Supply either communityId or permalink
 * @param communityId Community id
 * @param permalink Community permalink
 * @param winstonLoggingConfiguration Optional logging configuration for winston
 */
export function initialize({
  communityId,
  permalink,
  config,
  winstonLogger
}: InitializeRequest): Thunk<Promise<GetInitialStoreValuesResult>> {
  return async (dispatch: any): Promise<GetInitialStoreValuesResult> => {
    if (!communityId && !permalink) {
      throw Error('Supply communityId or permalink');
    }

    if (winstonLogger) {
      setLogger(winstonLogger);
    }

    if (config) {
      setConfigDefaults(config);
      dispatch(setConfiguration(config));
    }

    return dispatch(loadInitialStoreValues({ communityId, permalink }));
  };
}

function receiveInitialStoreValues(json: any): AnyAction {
  return {
    type: XCAP_INITIAL_STORE_DATA_RECEIVED,
    json
  };
}

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
      const modules: Array<Module> = [];
      for (const key of Object.keys(r.modules)) {
        modules.push(r.modules[key]);
      }
      dispatch(receiveModules({ modules }));
      // Used to be. Correct?
      //dispatch(receiveModules({ modules: r.modules }));
    }

    const allCmsContents: { [id: string]: Content } = {};

    if (r.cmsPages && Object.keys(r.cmsPages).length !== 0) {
      dispatch(receivePages(newXcapJsonResult('success', { pages: r.cmsPages })));

      // Add content
      Object.values(r.cmsPages).forEach(p => {
        const page: Page = p as Page;
        page.content.forEach((pc: PageContent) => {
          if (pc.type === ModuleType.CMS) {
            allCmsContents[pc.referenceRef.id] = pc.referenceRef;
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
