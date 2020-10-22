//@flow

import {
  Basket,
  CheckoutResult,
  DEFAULT_IMAGE_MAX_WIDTH,
  getProduct,
  GetProductRequest,
  GetProductResult,
  getProducts,
  GetProductsRequest,
  GetProductsResult,
  getProductVariant,
  listProducts,
  listProductsAndTypes,
  ListProductsAndTypesResult,
  ListProductsRequest,
  ListProductsResult,
  listProductTypes,
  ListProductTypesRequest,
  ListProductTypesResult,
  Product,
  ProductSortKeys,
  ProductVariant,
  createCheckout as doCreateCheckout,
  CreateCheckoutRequest,
  selectShipping as doSelectShipping,
  SelectShippingRequest
} from './index';
import {
  CLEAR_CACHE,
  RECEIVE_PRODUCT,
  RECEIVE_PRODUCT_TYPES,
  RECEIVE_LISTING,
  BASKET_UPDATED,
  ShopState,
  RECEIVE_MULTIPLE_PRODUCTS,
  ADD_TO_BASKET,
  REMOVE_FROM_BASKET,
  SlimProductListing,
  RECEIVE_CHECKOUT,
  RECEIVE_COUNTRIES,
  RECEIVE_ADDRESS_FIELDS
} from './shopReducer';
import { isRunningServerSide, logger, newXcapJsonResult, Thunk } from '../api';
import get from 'lodash/get';
import AddressFormatter, { Country } from '@shopify/address';
import { FieldName } from '@shopify/address-consts';
import { getStackendLocale } from '../util';
import { setLoadingThrobberVisible, setModalThrobberVisible } from '../throbber/throbberActions';

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
  await dispatch({ type: RECEIVE_LISTING, json: r, request: req });
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
  await dispatch({ type: RECEIVE_LISTING, json: r, request: req });
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

export interface RequestMultipleProductsRequest {
  handles: Array<string>;
  imageMaxWidth?: number;
}

/**
 * Request multiple products
 * @param req
 */
export const requestMultipleProducts = (req: GetProductsRequest): Thunk<Promise<GetProductsResult>> => async (
  dispatch: any
): Promise<GetProductsResult> => {
  const r = await dispatch(getProducts(req));
  await dispatch({ type: RECEIVE_MULTIPLE_PRODUCTS, json: r });
  return r;
};

/**
 * Request missing products
 * @param req
 */
export const requestMissingProducts = (req: GetProductsRequest): Thunk<Promise<GetProductsResult>> => async (
  dispatch: any,
  getState: () => any
): Promise<GetProductsResult> => {
  const shop: ShopState = getState().shop;

  const fetchHandles: Array<string> = [];
  for (const h of req.handles) {
    const p = shop.products[h];
    if (!p) {
      fetchHandles.push(h);
    }
  }

  if (fetchHandles.length == 0) {
    return newXcapJsonResult('success', { products: {} }) as GetProductsResult;
  }

  const r = await dispatch(getProducts({ handles: fetchHandles, imageMaxWidth: req.imageMaxWidth }));
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

  const key = getLocalStorageKey(getState(), BASKET_LOCAL_STORAGE_NAME);
  const json = localStorage.getItem(key);
  if (!json) {
    return new Basket();
  }

  return Basket.fromString(json);
};

export const BASKET_LOCAL_STORAGE_NAME = 'basket';
export const CHECKOUT_ID_LOCAL_STORAGE_NAME = 'checkout';

export function getLocalStorageKey(state: any, name: string): string {
  return get(state, 'communities.community.permalink', 'stackend') + '-' + name;
}
/**
 * Persist the basket in local storage
 * @param basket
 */
export const storeBasket = (basket: Basket): Thunk<void> => (dispatch: any, getState: any): void => {
  if (isRunningServerSide()) {
    return;
  }

  const key = getLocalStorageKey(getState(), BASKET_LOCAL_STORAGE_NAME);
  localStorage.setItem(key, basket.toString());
  dispatch({ type: BASKET_UPDATED });
};

/**
 * Add item(s) to the basket and persist it in local storage
 * @param basket
 * @param product
 * @param variant
 * @param quantity
 */
export const addToBasket = (
  basket: Basket,
  product: Product,
  variant: ProductVariant,
  quantity?: number
): Thunk<void> => (dispatch: any, getState: any): void => {
  if (isRunningServerSide()) {
    return;
  }

  const q = quantity || 1;
  basket.add(product.handle, variant.id, q);

  const key = getLocalStorageKey(getState(), BASKET_LOCAL_STORAGE_NAME);
  localStorage.setItem(key, basket.toString());
  dispatch({ type: ADD_TO_BASKET, product, variant, variantId: variant.id, quantity: q });
};

/**
 * Remove items from the basket and persist it in local storage
 * @param basket
 * @param product
 * @param variant
 * @param variantId
 * @param quantity
 */
export const removeFromBasket = (
  basket: Basket,
  product: Product,
  variant?: ProductVariant | null,
  variantId?: string,
  quantity?: number
): Thunk<void> => (dispatch: any, getState: any): void => {
  if (isRunningServerSide()) {
    return;
  }

  const q = quantity || 1;

  const state = getState();
  let vId = variantId;
  if (!variantId && variant) {
    vId = variant.id;
  }

  if (!vId) {
    return;
  }

  basket.remove(product.handle, vId, q);

  const key = getLocalStorageKey(state, BASKET_LOCAL_STORAGE_NAME);

  let v = variant;
  if (!variant && variantId) {
    v = getProductVariant(product, variantId);
  }

  localStorage.setItem(key, basket.toString());
  dispatch({ type: REMOVE_FROM_BASKET, product, variant: v, variantId, quantity: q });
};

/**
 * Clear the basket from local storage
 */
export const clearBasket = (): Thunk<void> => (dispatch: any, getState: any): void => {
  if (isRunningServerSide()) {
    return;
  }
  const key = getLocalStorageKey(getState(), BASKET_LOCAL_STORAGE_NAME);
  localStorage.removeItem(key);
  dispatch({ type: BASKET_UPDATED });
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
  s += (req.imageMaxWidth || DEFAULT_IMAGE_MAX_WIDTH) + ';';
  return s;
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
export function getProductListingByKey(shop: ShopState, key: string): SlimProductListing | null {
  const listing = shop.productListings[key];
  return listing ? listing : null;
}

/**
 * Get products from a listing
 * @param shop
 * @param req
 */
export function getProductListing(shop: ShopState, req: ListProductsRequest): SlimProductListing | null {
  const key = getProductListKey(req);
  return getProductListingByKey(shop, key);
}

/**
 * Check if there are any kind of errors in the checkout
 * @param result
 */
export function hasCheckoutErrors(result: CheckoutResult): boolean {
  return (
    result &&
    (typeof result.error !== 'undefined' || (result.checkoutUserErrors && result.checkoutUserErrors.length !== 0))
  );
}

/**
 * Create a checkout
 */
export const createCheckout = (req: CreateCheckoutRequest): Thunk<Promise<CheckoutResult>> => async (
  dispatch: any
): Promise<CheckoutResult> => {
  try {
    await dispatch(setModalThrobberVisible(true));
    const r: CheckoutResult = await dispatch(doCreateCheckout(req));
    if (!hasCheckoutErrors(r)) {
      await dispatch({
        type: RECEIVE_CHECKOUT,
        json: r
      });
    }
    return r;
  } finally {
    await dispatch(setModalThrobberVisible(false));
  }
};

/**
 * Select shipping
 * @param req
 */
export const selectShipping = (req: SelectShippingRequest): Thunk<Promise<CheckoutResult>> => async (
  dispatch: any
): Promise<CheckoutResult> => {
  try {
    await dispatch(setModalThrobberVisible(true));
    const r: CheckoutResult = await dispatch(doSelectShipping(req));
    if (!hasCheckoutErrors(r)) {
      await dispatch({
        type: RECEIVE_CHECKOUT,
        json: r
      });
    }
    return r;
  } finally {
    await dispatch(setModalThrobberVisible(false));
  }
};

/**
 * Get the locale, falling back to the community locale if not supplied
 * @param locale
 */
function getLocale(locale?: string | null): Thunk<Promise<string>> {
  return async (dispatch, getState): Promise<string> => {
    let l = locale;
    if (!l) {
      const state = getState();
      l = getStackendLocale(state?.communities?.community?.locale);
    }

    if (!l) {
      throw Error('No locale supplied');
    }
    return l;
  };
}

/**
 * Request the list of countries
 * @param locale
 */
export function requestCountries({ locale }: { locale?: string }): Thunk<Promise<Array<Country>>> {
  return async (dispatch: any, getState: any): Promise<Array<Country>> => {
    const state = getState();
    const shop: ShopState = state.shop;
    if (shop.countryCodes) {
      const a: Array<Country> = [];
      shop.countryCodes.forEach(c => a.push(shop.countriesByCode[c]));
      return a;
    }

    try {
      await dispatch(setLoadingThrobberVisible(true));
      const l = await dispatch(getLocale(locale));
      const addressFormatter = new AddressFormatter(l);
      const countries = await addressFormatter.getCountries();
      await dispatch({
        type: RECEIVE_COUNTRIES,
        countries
      });

      return countries;
    } finally {
      await dispatch(setLoadingThrobberVisible(false));
    }
  };
}

/**
 * Request the required address fields for the country using the specified locale
 * @param locale
 * @param countryCode
 */
export function requestAddressFields({
  locale,
  countryCode
}: {
  locale?: string | null;
  countryCode: string;
}): Thunk<Promise<FieldName[][]>> {
  return async (dispatch: any, getState: any): Promise<FieldName[][]> => {
    countryCode = countryCode.toUpperCase();
    const state = getState();
    const shop: ShopState = state.shop;
    const a = shop.addressFieldsByCountryCode[countryCode];
    if (a) {
      return a;
    }

    try {
      await dispatch(setLoadingThrobberVisible(true));
      const l = await dispatch(getLocale(locale));
      const addressFormatter = new AddressFormatter(l);
      const addressFields = await addressFormatter.getOrderedFields(countryCode);
      await dispatch({
        type: RECEIVE_ADDRESS_FIELDS,
        countryCode,
        addressFields
      });
      return addressFields;
    } finally {
      await dispatch(setLoadingThrobberVisible(false));
    }
  };
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

export type ProductTypeTree = Array<ProductTypeTreeNode>;

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

/**
 * Find a product type tree node given it's productType
 * @param t
 * @param productType
 */
export function findProductTypeTreeNode(
  t: ProductTypeTree | ProductTypeTreeNode,
  productType: string
): ProductTypeTreeNode | null {
  if (Array.isArray(t)) {
    for (const n of t) {
      const x = _findProductTypeTreeNode(n, productType);
      if (x) {
        return x;
      }
    }
  } else {
    return _findProductTypeTreeNode(t as ProductTypeTreeNode, productType);
  }

  return null;
}

function _findProductTypeTreeNode(n: ProductTypeTreeNode, productType: string): ProductTypeTreeNode | null {
  if (n.productType == productType) {
    return n;
  } else if (productType.startsWith(n.productType)) {
    for (const m of n.children) {
      const x = _findProductTypeTreeNode(m, productType);
      if (x) {
        return x;
      }
    }
  }

  return null;
}
