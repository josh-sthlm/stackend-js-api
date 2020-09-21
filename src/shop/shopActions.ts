//@flow

import {
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
  ListProductTypesResult, Product,
  ProductSortKeys
} from "./index";
import {
  ADD_TO_BASKET,
  CLEAR_CACHE,
  RECEIVE_PRODUCT,
  RECEIVE_PRODUCT_TYPES,
  RECEIVE_PRODUCTS,
  REMOVE_FROM_BASKET,
  ShopState
} from './shopReducer';
import { logger, Thunk } from "../api";

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

// FIXME: Should be product variant
/**
 * Add a product to the basket
 * @param handle
 * @param variant
 */
export const addToBasket = (handle: string, variant?: string): Thunk<Promise<void>> => async (
  dispatch: any
): Promise<void> => {
  await dispatch({ type: ADD_TO_BASKET, handle, variant });
};

/**
 * Remove a product from the basket
 * @param handle
 */
export const removeFromBasket = (handle: string): Thunk<Promise<void>> => async (dispatch: any): Promise<void> => {
  await dispatch({ type: REMOVE_FROM_BASKET, handle });
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
 * Clear store cache. Does not empty basket
 */
export const clearCache = (): Thunk<Promise<void>> => async (dispatch: any): Promise<void> => {
  await dispatch({ type: CLEAR_CACHE });
};

/**
 * Find the index of a product in the basket
 * @param shop
 * @param handle
 * @param variant
 */
export function findInBasket(shop: ShopState, handle: string, variant?: string): number {
  return shop.basket.findIndex(i => {
    if (i.handle !== handle) {
      return false;
    }

    if (variant && variant !== i.variant) {
      return false;
    }

    return true;
  });
}

/**
 * Check if the basket contains a product
 * @param shop
 * @param handle
 * @param variant
 */
export function basketContains(shop: ShopState, handle: string, variant?: string): boolean {
  return findInBasket(shop, handle, variant) !== -1;
}

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
      logger.warn("Product " + handle + " is missing for " + key);
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
export function getBasketListing(shop: ShopState): Array<Product> {
  const products: Array<Product> = [];

  shop.basket.forEach(i => {
    const p = shop.products[i.handle];
    if (p) {
      products.push(p);
    } else {
      logger.warn("Product " + i.handle + " in basket is missing");
    }
  });

  products.sort( (a, b) => {
    const i = a.title.localeCompare(b.title);
    if (i != 0) {
      return i;
    }
    return a.id.localeCompare(b.id);
  })

  return products;
}
