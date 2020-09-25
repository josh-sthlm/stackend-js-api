//@flow

import {
  Basket,
  getProduct,
  GetProductRequest,
  GetProductResult,
  getProducts,
  GetProductsResult,
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
import {
  CLEAR_CACHE,
  RECEIVE_PRODUCT,
  RECEIVE_PRODUCT_TYPES,
  RECEIVE_PRODUCTS,
  BASKET_UPDATED,
  ShopState,
  RECEIVE_MULTIPLE_PRODUCTS
} from './shopReducer';
import { isRunningServerSide, logger, newXcapJsonResult, Thunk } from '../api';
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
 * Request a product listing
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
 * Request multiple products
 * @param handles
 */
export const requestMultipleProducts = (handles: Array<string>): Thunk<Promise<GetProductsResult>> => async (
  dispatch: any
): Promise<GetProductsResult> => {
  const r = await dispatch(getProducts({ handles }));
  await dispatch({ type: RECEIVE_MULTIPLE_PRODUCTS, json: r });
  return r;
};

/**
 * Request missing products
 * @param handles
 */
export const requestMissingProducts = (handles: Array<string>): Thunk<Promise<GetProductsResult>> => async (
  dispatch: any,
  getState: () => any
): Promise<GetProductsResult> => {
  const shop: ShopState = getState().shop;

  const fetchHandles: Array<string> = [];
  for (const h of handles) {
    if (!shop.products[h]) {
      fetchHandles.push(h);
    }
  }

  if (fetchHandles.length == 0) {
    return newXcapJsonResult('success', { products: {} }) as GetProductsResult;
  }

  const r = await dispatch(getProducts({ handles: fetchHandles }));
  await dispatch({ type: RECEIVE_MULTIPLE_PRODUCTS, json: r });
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
  dispatch({ type: BASKET_UPDATED });
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

export interface ProductTypeTreeNode {
  /**
   * Simple name
   */
  name: string;

  /**
   * Full name
   */
  productType: string;

  /**
   * Child nodes
   */
  children: Array<ProductTypeTreeNode>;
}

/**
 * Construct a new product type tree node
 * @param productType
 */
export function newProductTypeTreeNode(productType: string): ProductTypeTreeNode {
  let name = productType;
  const i = name.lastIndexOf('/');
  if (i !== -1) {
    name = name.substring(i + 1);
  }

  return {
    productType,
    name,
    children: []
  };
}

/**
 * Get the parent product type
 * @param n
 */
export function getParentProductType(n: ProductTypeTreeNode | string): string | null {
  let pt: string;
  if (typeof n === 'object') {
    pt = n.productType;
  } else {
    pt = n;
  }

  const i = pt.lastIndexOf('/');
  if (i === -1) {
    return null;
  }

  return pt.substring(0, i);
}

/**
 * Is the product type a root type?
 * @param n
 */
export function isRoot(n: ProductTypeTreeNode): boolean {
  return n.productType.indexOf('/') === -1;
}

export function hasChildren(n: ProductTypeTreeNode): boolean {
  return n.children.length !== 0;
}

export function addNode(parent: ProductTypeTreeNode, node: ProductTypeTreeNode): void {
  if (parent && node) {
    parent.children.push(node);
  }
}

/**
 * Get all product types under a tree node as a flat list
 * @param p
 * @param result
 */
export function getAllProductTypes(p: ProductTypeTreeNode, result?: Array<string>): Array<string> {
  if (typeof result === 'undefined') {
    result = [];
  }

  result.push(p.productType);
  for (const c of p.children) {
    getAllProductTypes(c, result);
  }

  return result;
}

/**
 * Get the last part of the product type
 * @param productType
 */
export function getProductTypeLabel(productType: string): string {
  if (!productType) {
    return '';
  }

  const i = productType.lastIndexOf('/');
  if (i === -1) {
    return productType;
  }

  return productType.substring(i + 1);
}
