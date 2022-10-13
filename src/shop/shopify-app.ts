import {
  COMMUNITY_PARAMETER,
  DEFAULT_COMMUNITY,
  getJson,
  StackendApiKeyParameters,
  Thunk,
  XcapJsonResult
} from '../api';
import { Community } from '../stackend';
import { User } from '../user';

export type SaveStoreFrontAccessTokenRequest = StackendApiKeyParameters & {
  shop: string;
  at: string;
};

/**
 * Save the storefront access token for use when connecting the shop.
 * Requires stackend appid and api key.
 */
export function saveStoreFrontAccessToken(params: SaveStoreFrontAccessTokenRequest): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      getJson({
        url: '/shop/app/save-store-front-access-token',
        parameters: { ...params, [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY }
      })
    );
  };
}

export type ConnectStoreRequest = StackendApiKeyParameters & {
  shop: string;
  email: string;
  communityId: string;
};

/**
 * Connect an existing shop with a community. The storefront access token must first be saved
 * Requires stackend appid and api key.
 */
export function connectStore(params: ConnectStoreRequest): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      getJson({
        url: '/shop/app/connect-store',
        parameters: { ...params, [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY }
      })
    );
  };
}

export type DisconnectStoreRequest = StackendApiKeyParameters & {
  shop: string;
  communityId?: number;
  email?: string;
};

/**
 * Disconnect a shop existing from a community.
 * Supply either communityId or ownerEmail.
 * Requires stackend appid and api key.
 */
export function disconnectStore(params: DisconnectStoreRequest): Thunk<Promise<XcapJsonResult>> {
  return (dispatch: any): Promise<XcapJsonResult> => {
    return dispatch(
      getJson({
        url: '/shop/app/disconnect-store',
        parameters: { ...params, [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY }
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
  emailVerified?: boolean;
  pictureUrl?: string;
  userIp?: string;
  locale?: string;
}

export interface CreateStackAndConnectStoreRequest extends ShopifyUserInfo, StackendApiKeyParameters {
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

  /** The login token */
  loginToken?: string;

  /** Credentials to be set in the user session, if logged in */
  credentials?: string;

  /** If non-null, then the user already exists and this is the list of connectable communities */
  userCommunities?: Array<Community>;

  /** If non-null, then this community is already connected with the shop, but the user is not an admin */
  conflictsWithCommunity?: Community;
}

/**
 * Create a new community, user and connect it to a shop.
 * If the loginToken is supplied, the user is authenticated with an existing community and that
 * community will be connected to the shop.
 * For backend use only. The loginToken should not be shared with users.
 * Requires stackend appid and api key.
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

export interface AuthenticateShopifyUserRequest extends ShopifyUserInfo, StackendApiKeyParameters {
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
 * Requires stackend appid and api key.
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

export type RemoveShopifyUserRequest = StackendApiKeyParameters & {
  shop: string;
  communityId: number;
  loginToken: string;
  email: string;
};

/**
 * Remove a previously created shopify user
 * Requires stackend appid and api key.
 * @param params
 */
export function removeShopifyUser(params: RemoveShopifyUserRequest): Thunk<Promise<XcapJsonResult>> {
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

export type ListConnectableCommunitiesRequest = StackendApiKeyParameters & {
  email: string;
};

export type ListConnectableCommunities = XcapJsonResult & {
  communities: Array<Community>;
};

/**
 * List connectable communities: Unconnected communities where the user is admin.
 * Requires stackend appid and api key.
 * @param params
 */
export function listConnectableCommunities(
  params: ListConnectableCommunitiesRequest
): Thunk<Promise<ListConnectableCommunities>> {
  return (dispatch: any): Promise<ListConnectableCommunities> => {
    return dispatch(
      getJson({
        url: '/shop/app/list-connectable-communities',
        parameters: {
          ...params,
          [COMMUNITY_PARAMETER]: DEFAULT_COMMUNITY
        }
      })
    );
  };
}
