//@flow

import {
  Basket,
  getProduct,
  GetProductRequest,
  GetProductResult,
  listProducts,
  listProductsAndTypes,
  ListProductsAndTypesResult,
  ListProductsRequest,
  ListProductsResult,
  listProductTypes,
  ListProductTypesRequest,
  ListProductTypesResult,
  Product,
  ProductSortKeys
} from './index';
import { CLEAR_CACHE, RECEIVE_PRODUCT, RECEIVE_PRODUCT_TYPES, RECEIVE_PRODUCTS, ShopState } from './shopReducer';
import { isRunningServerSide, logger, Thunk } from '../api';
import get from 'lodash/get';

/**
 * Load product types into store
 * @param req
 */
export const requestProductTypes = (req: ListProductTypesRequest): Thunk<Promise<ListProductTypesResult>> => async (
  dispatch: any
): Promise<ListProductTypesResult> => {
  const r = await dispatch(listProductTypes(req));
  await dispatch({ type: RECEIVE_PRODUCT_TYPES, json: r });
  return r;
};

/**
 * Load products into store
 * @param req
 */
export const requestProducts = (req: ListProductsRequest): Thunk<Promise<ListProductsResult>> => async (
  dispatch: any
): Promise<ListProductsResult> => {
  const r = await dispatch(listProducts(req));
  await dispatch({ type: RECEIVE_PRODUCTS, json: r, request: req });
  return r;
};

/**
 * Load products and product types into store
 * @param req
 */
export const requestProductsAndProductTypes = (
  req: ListProductsRequest
): Thunk<Promise<ListProductsAndTypesResult>> => async (dispatch: any): Promise<ListProductsAndTypesResult> => {
  const r = await dispatch(listProductsAndTypes(req));
  await dispatch({ type: RECEIVE_PRODUCTS, json: r, request: req });
  await dispatch({ type: RECEIVE_PRODUCT_TYPES, json: r });
  return r;
};

/**
 * Load a single product into store
 * @param req
 */
export const requestProduct = (req: GetProductRequest): Thunk<Promise<GetProductResult>> => async (
  dispatch: any
): Promise<GetProductResult> => {
  const r = await dispatch(getProduct(req));
  await dispatch({ type: RECEIVE_PRODUCT, json: r });
  return r;
};

/**
 * Get the basket from local storage
 */
export const getBasket = (): Thunk<Basket> => (dispatch: any, getState: any): Basket => {
  if (isRunningServerSide()) {
    return new Basket();
  }

  const state = getState();
  const cpl = get(state, 'communities.community.permalink', '');
  const json = localStorage.getItem(cpl + '-basket');
  if (!json) {
    return new Basket();
  }

  return Basket.fromString(json);
};

/**
 * Persist the basket in local storage
 * @param basket
 */
export const storeBasket = (basket: Basket): Thunk<void> => (dispatch: any, getState: any): void => {
  if (isRunningServerSide()) {
    return;
  }

  const state = getState();
  const cpl = get(state, 'communities.community.permalink', '');
  localStorage.setItem(cpl + '-basket', basket.toString());
};

/**
 * Clear the basket from local storage
 */
export const clearBasket = (): Thunk<void> => (dispatch: any, getState: any): void => {
  if (isRunningServerSide()) {
    return;
  }
  const state = getState();
  const cpl = get(state, 'communities.community.permalink', '');
  localStorage.removeItem(cpl + '-basket');
};

/**
 * Get the key used to index the product listings in ShopState
 * @param req
 */
export function getProductListKey(req: ListProductsRequest): string {
  let s = '';
  s += (req.q || '') + ';';
  s += (req.productTypes ? req.productTypes.join(',') : '') + ';';
  s += (req.tags ? req.tags?.join(',') : '') + ';';
  s += (req.sort || ProductSortKeys.RELEVANCE) + ';';
  s += (req.first || '') + ';';
  s += (req.after || '') + ';';
  return s;
}

/**
 * Get products from the store
 * @param shop
 * @param req
 */
export function getProductHandles(shop: ShopState, req: ListProductsRequest): Array<string> | undefined {
  const key = getProductListKey(req);
  return shop.productListings[key];
}

/**
 * Clear store cache. Does not empty basket or product types
 */
export const clearCache = (): Thunk<Promise<void>> => async (dispatch: any): Promise<void> => {
  await dispatch({ type: CLEAR_CACHE });
};

/**
 * Get products from a listing
 * @param shop
 * @param key
 */
export function getProductListingByKey(shop: ShopState, key: string): Array<Product> | null {
  const handles = shop.productListings[key];
  if (!handles) {
    return null;
  }

  const products: Array<Product> = [];

  handles.forEach(handle => {
    const p = shop.products[handle];
    if (p) {
      products.push(p);
    } else {
      logger.warn('Product ' + handle + ' is missing for ' + key);
    }
  });

  return products;
}

/**
 * Get products from a listing
 * @param shop
 * @param req
 */
export function getProductListing(shop: ShopState, req: ListProductsRequest): Array<Product> | null {
  const key = getProductListKey(req);
  return getProductListingByKey(shop, key);
}

/**
 * List the products in the basket
 * @param shop
 */
export function getBasketListing(shop: ShopState, basket: Basket): Array<Product> {
  const products: Array<Product> = [];

  basket.items.forEach(i => {
    const p = shop.products[i.handle];
    if (p) {
      products.push(p);
    } else {
      logger.warn('Product ' + i.handle + ' in basket is missing');
    }
  });

  products.sort((a, b) => {
    const i = a.title.localeCompare(b.title);
    if (i != 0) {
      return i;
    }
    return a.id.localeCompare(b.id);
  });

  return products;
}
