import {
  getJson,
  post,
  XcapJsonResult,
  Thunk,
  XcapOptionalParameters,
  StackendApiKeyParameters,
  COMMUNITY_PARAMETER,
  DEFAULT_COMMUNITY
} from '../api';

export interface GDPRShopRequest extends StackendApiKeyParameters, XcapOptionalParameters {
  shop: string;
}

export interface GDPRCustomerRequest extends GDPRShopRequest {
  customerEmail: string;
  shop: string;
}

/**
 * Request user data to be sent to the users email
 * @param params
 */
export function gdprCustomerDataRequest(params: GDPRCustomerRequest): Thunk<Promise<XcapJsonResult>> {
  return getJson({
    url: '/shop/gdpr/customer-data-request',
    parameters: {
      ...params,
      [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY
    }
  });
}

/**
 * Remove a user and all it's data
 * @param params
 */
export function gdprCustomerRedact(params: GDPRCustomerRequest): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/shop/gdpr/customer-redact',
    parameters: {
      ...params,
      [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY
    }
  });
}

/**
 * Remove shop an all it's data
 * @param params
 */
export function gdprShopRedact(params: GDPRShopRequest): Thunk<Promise<XcapJsonResult>> {
  return post({
    url: '/shop/gdpr/shop-redact',
    parameters: {
      ...params,
      [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY
    }
  });
}
