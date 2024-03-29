import { newXcapJsonErrorResult, newXcapJsonResult, Thunk, XcapJsonResult } from '../api';
import {
  CartBuyerIdentity,
  CartBuyerIdentityUpdateRequest,
  CartLinesRemoveRequest,
  CartLinesUpdateRequest,
  CreateCartRequest,
  GetCartRequest,
  GetCartResult,
  GetCheckoutRequest,
  GetCheckoutResult,
  GetCollectionRequest,
  GetCollectionResult,
  GetCollectionsRequest,
  GetCollectionsResult,
  GetProductRequest,
  GetProductResult,
  getShopifyConfig,
  ListProductsAndTypesResult,
  ListProductsRequest,
  ListProductsResult,
  ListProductTypesRequest,
  ListProductTypesResult,
  ModifyCartResult
} from './index';

import collectionQuery from './querries/collectionQuery';
import fullProductQuery from './querries/fullProductQuery';
import checkoutQuery from './querries/checkoutQuery';
import productListingQuery from './querries/productListingQuery';
import productTypesQuery from './querries/productTypesQuery';
import { ShopState } from './shopReducer';
import { toQueryParameters } from '../util/graphql';
import cartQuery from './querries/cartQuery';

export const API_VERSION = '2023-04';

function getImageMaxWidth(shopState: ShopState, value?: number | null | undefined): number {
  if (!value) {
    return shopState.defaults.imageMaxWidth;
  }

  return value > shopState.defaults.imageMaxWidth ? shopState.defaults.imageMaxWidth : value;
}

function getImageListingMaxWidth(shopState: ShopState, value?: number | null | undefined): number {
  if (!value) {
    return shopState.defaults.listingImageMaxWidth;
  }

  return value > shopState.defaults.listingImageMaxWidth ? shopState.defaults.listingImageMaxWidth : value;
}

/**
 * List product types
 * @param req
 * @returns {Thunk<ListProductTypesResult>}
 */
export function listProductTypes(req: ListProductTypesRequest): Thunk<Promise<ListProductTypesResult>> {
  return query({
    query: `${productTypesQuery(req.first || 250)}` /* 250 is max allowed */
  });
}

/**
 * Get a product
 */
export function getProduct(req: GetProductRequest): Thunk<Promise<GetProductResult>> {
  return (dispatch: any, getState): Promise<GetProductResult> => {
    const shopState = getState().shop;
    const imw = getImageMaxWidth(shopState, req.imageMaxWidth);
    return dispatch(
      query<GetProductResult>({
        query: `product (handle: ${escapeQueryTerm(req.handle)}) {
          ${fullProductQuery(imw, true)}
        }`
      })
    );
  };
}

/**
 * List products
 * @param req
 */
export function listProducts(req: ListProductsRequest): Thunk<Promise<ListProductsResult>> {
  return (dispatch: any, getState): Promise<ListProductsResult> => {
    const shopState = getState().shop;
    req.imageMaxWidth = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    return dispatch(
      query({
        query: productListingQuery(req)
      })
    );
  };
}

/**
 * List products and types
 * @param req
 */
export function listProductsAndTypes(req: ListProductsRequest): Thunk<Promise<ListProductsAndTypesResult>> {
  return (dispatch: any, getState): Promise<ListProductsAndTypesResult> => {
    const shopState = getState().shop;
    req.imageMaxWidth = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    return dispatch(
      query({
        query: `${productListingQuery(req)}, ${productTypesQuery(250)}` /* 250 is max allowed */
      })
    );
  };
}

/**
 * Get a collection
 * @param req
 */
export function getCollection(req: GetCollectionRequest): Thunk<Promise<GetCollectionResult>> {
  return (dispatch: any, getState): Promise<GetCollectionResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    return dispatch(
      query({
        query: `collection (handle: ${escapeQueryTerm(req.handle)}) {
        ${collectionQuery(imw)}
      }`
      })
    );
  };
}

/**
 * List collections
 * @param req
 */
export function getCollections(req: GetCollectionsRequest): Thunk<Promise<GetCollectionsResult>> {
  return query({
    query: `collections (first: 100, sortKey: TITLE) {
      edges {
        node {
          id,
          handle,
          title,
          description
        }
      }
    }`
  });
}

/**
 * Get a cart
 * @param req
 */
export function getCart(req: GetCartRequest): Thunk<Promise<GetCartResult>> {
  return (dispatch: any, getState: any): Promise<GetCartResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    return dispatch(
      query({
        query: `cart (id: ${toQueryParameters(req.cartId)}) {
          ${cartQuery(true, imw)}
        }`
      })
    );
  };
}

/**
 * Create a cart.
 * @param req
 */
export function createCart(req: CreateCartRequest): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any, getState: any): Promise<ModifyCartResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    const r = await dispatch(
      mutation({
        mutation: `mutation {
            cartCreate ( input: {
                lines: ${toQueryParameters(req.lines || [])}
                ${req.buyerIdentity ? ', buyerIdentity: ' + buyerIdentityToQueryParameters(req.buyerIdentity) : ''}
             }) {
              cart { ${cartQuery(req.lines.length !== 0, imw)} },
              userErrors { code, field, message }
            }
          }`
      })
    );

    return newModifyCartResult(r, 'cartCreate');
  };
}

/**
 * Convert to ModifyCartResult
 * @param r
 * @param pfx
 */
function newModifyCartResult(r: XcapJsonResult, pfx: string): ModifyCartResult {
  r.cart = null;
  if (r[pfx]) {
    if (r[pfx].cart) {
      r.cart = r[pfx].cart;
    }
    if (r[pfx].userErrors) {
      r.userErrors = r[pfx].userErrors;
    }
    delete r[pfx];
  }

  return r as ModifyCartResult;
}

export function cartLinesUpdate(req: CartLinesUpdateRequest): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any, getState: any): Promise<GetCartResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    const r = await dispatch(
      mutation({
        mutation: `mutation {
            cartLinesUpdate(cartId: ${JSON.stringify(req.cartId)}, lines: ${toQueryParameters(req.lines)}) {
              cart { ${cartQuery(true, imw)} },
              userErrors { code, field, message }
            }
          }`
      })
    );

    return newModifyCartResult(r, 'cartLinesUpdate');
  };
}

export function cartLinesAdd(req: CartLinesUpdateRequest): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any, getState: any): Promise<GetCartResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    const r = await dispatch(
      mutation({
        mutation: `mutation {
          cartLinesAdd(cartId: ${JSON.stringify(req.cartId)}, lines: ${toQueryParameters(req.lines)}
           ) {
              cart { ${cartQuery(true, imw)} },
              userErrors { code, field, message }
            }
          }`
      })
    );

    return newModifyCartResult(r, 'cartLinesAdd');
  };
}

export function cartLinesRemove(req: CartLinesRemoveRequest): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any, getState: any): Promise<GetCartResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    const r = await dispatch(
      mutation({
        mutation: `mutation {
          cartLinesRemove(cartId: ${JSON.stringify(req.cartId)}, lineIds: ${JSON.stringify(req.lineIds)}) {
              cart { ${cartQuery(false, imw)} },
              userErrors { code, field, message }
            }
          }`
      })
    );

    return newModifyCartResult(r, 'cartLinesRemove');
  };
}

export function cartBuyerIdentityUpdate(req: CartBuyerIdentityUpdateRequest): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any, getState: any): Promise<GetCartResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);

    const r = await dispatch(
      mutation({
        mutation: `mutation {
          cartBuyerIdentityUpdate(
            cartId: ${JSON.stringify(req.cartId)}
            ${req.buyerIdentity && ', buyerIdentity: ' + buyerIdentityToQueryParameters(req.buyerIdentity)}
          ) {
              cart { ${cartQuery(false, imw)} },
              userErrors { code, field, message }
            }
          }`
      })
    );

    return newModifyCartResult(r, 'cartBuyerIdentityUpdate');
  };
}

function buyerIdentityToQueryParameters(buyerIdentity: CartBuyerIdentity): string {
  let r = '{';
  let i = 0;
  for (const k of Object.keys(buyerIdentity)) {
    if (i !== 0) {
      r += ',';
    }
    const v = (buyerIdentity as any)[k];
    if (k === 'countryCode') {
      r += k + ':' + v;
    } else {
      r += k + ':' + JSON.stringify(v);
    }
    i++;
  }

  r += '}';
  return r;
}

/**
 * Get a checkout
 * @param req
 */
export function getCheckout(req: GetCheckoutRequest): Thunk<Promise<GetCheckoutResult>> {
  return (dispatch: any, getState): Promise<GetCheckoutResult> => {
    const shopState = getState().shop;
    const imw = getImageListingMaxWidth(shopState, req.imageMaxWidth);
    // FIXME: handle getShippingRates and getProductData
    const getProductData = true;
    const x: any = req;

    return dispatch(
      query({
        query: `node (id: ${escapeQueryTerm(req.checkoutId)}) {
          ... on Checkout {
            ${checkoutQuery(x.getShippingRates || false, getProductData, imw)}
          }
        }`,
        aliases: {
          node: 'checkout'
        }
      })
    );
  };
}

/**
 * Construct pagination args
 * @param req
 * @param args
 * @returns {string|string}
 */
export function paginationArgs(req: any, args?: string): string {
  let r = args || '';

  let first = req.first;
  if (typeof req.first === 'undefined' && typeof req.last === 'undefined') {
    first = 10;
  }

  if (first) {
    r = appendArg(r, 'first', String(parseInt(first)));
  }
  if (req.after) {
    r = appendArg(r, 'after', escapeQueryTerm(req.after));
  }
  if (req.last) {
    r = appendArg(r, 'last', String(parseInt(req.last)));
  }
  if (req.before) {
    r = appendArg(r, 'before', escapeQueryTerm(req.before));
  }
  return r;
}

function appendArg(args: string, name: string, value: string): string {
  if (args.length !== 0) {
    args += ',';
  }

  args += name + ':' + value;
  return args;
}

/**
 * Escape and quote a query term
 * @param s
 * @returns {string}
 */
export function escapeQueryTerm(s: string): string {
  return JSON.stringify(s);
}

/**
 * Perform a shopify query
 * @param query
 * @param headers
 * @param aliases change names of returned data
 * @returns {(function(*): Promise<XcapJsonResult>)|*}
 */
export function query<T extends XcapJsonResult>({
  query,
  headers,
  aliases
}: {
  query: string;
  headers?: { [key: string]: string };
  aliases?: { [name: string]: string };
}): Thunk<Promise<T>> {
  return doPost({ query, isMutation: false, headers, aliases });
}

/**
 * Perform a shopify mutation
 * @param mutation
 * @param headers
 * @param aliases change names of returned data
 * @returns {(function(*): Promise<XcapJsonResult>)|*}
 */
export function mutation<T extends XcapJsonResult>({
  mutation,
  headers,
  aliases
}: {
  mutation: string;
  headers?: { [key: string]: string };
  aliases?: { [name: string]: string };
}): Thunk<Promise<T>> {
  return doPost({ query: mutation, isMutation: true, headers, aliases });
}

/**
 * Perform a shopify query or mutation
 * @param query
 * @param headers
 * @param aliases change names of returned data
 * @param isMutation
 * @returns {(function(*): Promise<XcapJsonResult>)|*}
 */
function doPost<T extends XcapJsonResult>({
  query,
  isMutation,
  headers,
  aliases
}: {
  query: string;
  isMutation?: boolean;
  headers?: { [key: string]: string };
  aliases?: { [name: string]: string };
}): Thunk<Promise<T>> {
  return async (dispatch: any): Promise<T> => {
    const cfg = dispatch(getShopifyConfig());
    if (!cfg) {
      console.warn('Stackend: Shop not configured');
      return newXcapJsonErrorResult<T>('Shop not configured');
    }

    const url = 'https://' + cfg.domain + '/api/' + cfg.apiVersion + '/graphql.json';
    const q = isMutation ? query : '{' + query + '}';
    const body = JSON.stringify({ query: q, variables: null });

    const h = new Headers();
    h.set('content-type', 'application/json');
    h.set('x-shopify-storefront-access-token', cfg.accessToken);
    if (headers) {
      Object.keys(headers).forEach(k => {
        h.set(k, headers[k]);
      });
    }

    const r = await fetch(
      new Request(url, {
        body,
        headers: h,
        method: 'POST'
      })
    );

    if (!r.ok) {
      console.error('Stackend: shopify query failed: ' + r.status + ' ' + r.statusText, q);
      return newXcapJsonErrorResult<T>(r.status + ' ' + r.statusText);
    }

    const json: any = await r.json();
    if (json.errors) {
      console.error('Stackend: shopify query failed: ', json.errors, q);
      return newXcapJsonErrorResult<T>(json.errors);
    }

    if (aliases) {
      Object.keys(aliases).forEach(key => {
        const newKey = aliases[key];
        json.data[newKey] = json.data[key];
        delete json.data[key];
      });
    }

    return newXcapJsonResult<T>('success', json.data);
  };
}
