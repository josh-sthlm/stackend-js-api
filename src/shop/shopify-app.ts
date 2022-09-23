import { COMMUNITY_PARAMETER, DEFAULT_COMMUNITY, getJson, post, Thunk, XcapJsonResult } from '../api';
import { Community } from '../stackend';
import { User } from '../user';

/**
 * Save the storefront access token for use when connecting the shop
 * @param params string
 * @param at string
 */
export function saveStoreFrontAccessToken({ shop, at }: { shop: string; at: string }): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      getJson({
        url: '/shop/app/save-store-front-access-token',
        parameters: { shop, at, [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY }
      })
    );
  };
}

/**
 * Connect an existing shop with a community. The storefront access token must first be saved
 * @param shop string
 */
export function connectStore({ shop }: { shop: string }): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      post({
        url: '/shop/app/connect-store',
        parameters: { shop }
      })
    );
  };
}

/**
 * Describes a shopify user
 */
export interface ShopifyUserInfo {
  firstName: string;
  lastName: string;
  email: string;
  pictureUrl?: string;
  userIp?: string;
}

export interface CreateStackAndConnectStoreRequest extends ShopifyUserInfo {
  /** Shop id or domain */
  shop: string;
  /** Optional login token used to authenticate the user to an existing community */
  loginToken?: string;
}

export interface CreateStackAndConnectStoreResult extends XcapJsonResult {
  /** If true, the shop was successfully registered */
  shopRegistered: boolean;

  /** The community, or null if not available */
  stackendCommunity?: Community;

  /** The user, or null if not available */
  user?: User;

  /** True if an existing user was used */
  usingExistingUser: boolean;

  /** True if an existing community was used */
  usingExistingCommunity: boolean;

  /** If non-null, then the user already exists and this is the list of connectable communities */
  userCommunities?: Array<Community>;

  /** The login token */
  loginToken?: string;
}

/**
 * Create a new community, user and connect it to a shop.
 * If the loginToken is supplied, the user is authenticated with an existing community and that
 * community will be connected to the shop.
 * For backend use only. The loginToken should not be shared with users.
 */
export function createStackAndConnectStore(
  params: CreateStackAndConnectStoreRequest
): Thunk<Promise<CreateStackAndConnectStoreResult>> {
  return (dispatch: any): Promise<CreateStackAndConnectStoreResult> => {
    return dispatch(
      getJson({
        url: '/shop/app/create-stack-and-connect-store',
        parameters: {
          ...params,
          [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY
        }
      })
    );
  };
}

export interface AuthenticateShopifyUserRequest extends ShopifyUserInfo {
  /** Shop id or domain */
  shop: string;

  /** The connected community id */
  communityId: number;

  /** Previously acquired login token */
  loginToken: string;
}

export interface AuthenticateShopifyUserResult extends XcapJsonResult {
  /** The connected community */
  stackendCommunity?: Community;

  /** The associated user  */
  user?: User;

  /** Credentials to be set in the user session */
  credentials?: string;
}

/**
 * Authenticate a shopify user.
 * Supply the shopify user info to update or automatically create a new user if needed.
 * For backend use only. The loginToken should not be shared with users.
 * @param params
 */
export function authenticateShopifyUser(
  params: AuthenticateShopifyUserRequest
): Thunk<Promise<AuthenticateShopifyUserResult>> {
  return (dispatch: any): Promise<AuthenticateShopifyUserResult> => {
    return dispatch(
      getJson({
        url: '/shop/app/authenticate-shopify-user',
        parameters: {
          ...params,
          [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY
        }
      })
    );
  };
}

/**
 * Remove a previously created shopify user
 * @param params
 */
export function removeShopifyUser(params: { shop: string; communityId: number; loginToken: string; email: string }) {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      getJson({
        url: '/shop/app/remove-shopify-user',
        parameters: {
          ...params,
          [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY
        }
      })
    );
  };
}
