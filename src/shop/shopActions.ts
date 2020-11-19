//@flow

import {
  CheckoutResult,
  DEFAULT_IMAGE_MAX_WIDTH,
  getProduct,
  GetProductRequest,
  GetProductResult,
  getProducts,
  GetProductsRequest,
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
  ProductSortKeys,
  ProductVariant,
  createCheckout as doCreateCheckout,
  CreateCheckoutRequest,
  selectShipping as doSelectShipping,
  checkoutReplaceItems as doCheckoutReplaceItems,
  SelectShippingRequest,
  getAddressFields,
  getCountries,
  GetCheckoutRequest,
  GetCheckoutResult,
  getCheckout,
  setShippingAddress,
  SetShippingAddressRequest,
  CheckoutReplaceItemsRequest,
  mapGraphQLList,
  Checkout,
  LineItemArray,
  LineItem,
  forEachListNode,
  GraphQLListNode,
  CheckoutLineItem,
  GraphQLList,
  SetCheckoutEmailRequest,
  setCheckoutEmail
} from './index';
import {
  CLEAR_CACHE,
  RECEIVE_PRODUCT,
  RECEIVE_PRODUCT_TYPES,
  RECEIVE_LISTING,
  ShopState,
  RECEIVE_MULTIPLE_PRODUCTS,
  ADD_TO_BASKET,
  REMOVE_FROM_BASKET,
  SlimProductListing,
  RECEIVE_CHECKOUT,
  RECEIVE_COUNTRIES,
  RECEIVE_ADDRESS_FIELDS,
  CLEAR_CHECKOUT,
  BASKET_UPDATED
} from './shopReducer';
import { newXcapJsonResult, Thunk } from '../api';
import { Country } from '@shopify/address';
import { FieldName } from '@shopify/address-consts';
import { setModalThrobberVisible } from '../throbber/throbberActions';
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from '../util';

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

export const CHECKOUT_ID_LOCAL_STORAGE_NAME = 'checkout';

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
      if (r.response.checkout) {
        dispatch(setLocalStorageItem(CHECKOUT_ID_LOCAL_STORAGE_NAME, r.response.checkout.id));
      }

      handleCheckoutProductData(dispatch, r.checkout);

      await dispatch({
        type: RECEIVE_CHECKOUT,
        checkoutUserErrors: r.response.checkoutUserErrors,
        checkout: r.response.checkout
      });
    }
    return r;
  } finally {
    await dispatch(setModalThrobberVisible(false));
  }
};

/**
 * If the user has a active checkout set in the local storage, request that checkout to be loaded.
 * If the checkout is turned into an order, the checkout is reset in local storage.
 * @param imageMaxWidth
 */
export const requestOrResetActiveCheckout = ({
  imageMaxWidth
}: {
  imageMaxWidth?: number;
}): Thunk<Promise<GetCheckoutResult>> => async (dispatch: any, getState: any): Promise<GetCheckoutResult> => {
  const checkoutId = dispatch(getLocalStorageItem(CHECKOUT_ID_LOCAL_STORAGE_NAME));
  if (!checkoutId) {
    return newXcapJsonResult<GetCheckoutResult>('success', {
      checkout: null
    });
  }

  const r: GetCheckoutResult = await dispatch(getCheckout({ checkoutId, imageMaxWidth }));
  if (!r.error && r.checkout) {
    if (r.checkout.completedAt) {
      // Checkout is turned into an order. Remove
      dispatch(clearCheckout());
    } else {
      handleCheckoutProductData(dispatch, r.checkout);

      await dispatch({
        type: RECEIVE_CHECKOUT,
        checkoutUserErrors: null,
        checkout: r.checkout
      });
    }
  }

  return r;
};

/**
 * Handle product data received via checkout
 * @param dispatch
 * @param checkout
 */
function handleCheckoutProductData(dispatch: any, checkout: Checkout | null | undefined): boolean {
  if (!checkout || checkout.lineItems.edges.length === 0) {
    return false;
  }

  const products: { [handle: string]: Product } = {};
  const lineItems: GraphQLList<CheckoutLineItem> = { edges: [] };
  forEachListNode(checkout.lineItems, i => {
    const p: any = i.variant.product;

    // Contains extra product data
    if (typeof p['availableForSale'] === 'boolean') {
      const product = p as Product;
      products[product.handle] = product;

      // Remove the extra data
      const li: GraphQLListNode<CheckoutLineItem> = {
        node: {
          id: i.id,
          quantity: i.quantity,
          title: i.title,
          variant: {
            id: i.variant.id,
            product: {
              id: i.variant.product.id,
              handle: i.variant.product.handle
            }
          }
        }
      };
      lineItems.edges.push(li);
    } else {
      lineItems.edges.push({ node: i });
    }
  });

  checkout.lineItems = lineItems;

  if (Object.keys(products).length === 0) {
    return false;
  }

  const json = newXcapJsonResult<GetProductsResult>('success', {
    products
  });

  dispatch({ type: RECEIVE_MULTIPLE_PRODUCTS, json });

  return true;
}

/**
 * Add an item to the checkout. Possibly creating a new checkout.
 * @param product
 * @param variant
 * @param quantity
 */
export const checkoutAdd = (
  product: Product,
  variant: ProductVariant,
  quantity?: number
): Thunk<Promise<CheckoutResult>> => async (dispatch: any, getState: any): Promise<CheckoutResult> => {
  if (!product || !variant) {
    throw new Error('product and variant required');
  }

  const q = quantity || 1;
  const shop: ShopState = getState().shop;
  const lineItems = addItem(toLineItemArray(shop.checkout), variant.id, q);
  const r: CheckoutResult = await dispatch(checkoutUpdateOrCreateNew(shop, lineItems));
  if (!r.error) {
    dispatch({ type: ADD_TO_BASKET, product, variant, variantId: variant.id, quantity: q });
  }

  return r;
};

/**
 * Remove a item from the checkout, possibly creating a new checkout
 * @param product
 * @param variant
 * @param quantity
 */
export const checkoutRemove = (
  product: Product,
  variant: ProductVariant,
  quantity?: number
): Thunk<Promise<CheckoutResult>> => async (dispatch: any, getState: any): Promise<CheckoutResult> => {
  if (!product || !variant) {
    throw new Error('product and variant required');
  }

  const shop: ShopState = getState().shop;
  const q = quantity || 1;
  const lineItems = removeItem(toLineItemArray(shop.checkout), variant.id, q);
  const r: CheckoutResult = await dispatch(checkoutUpdateOrCreateNew(shop, lineItems));
  if (!r.error) {
    dispatch({ type: REMOVE_FROM_BASKET, product, variant, variantId: variant.id, quantity: q });
  }

  return r;
};

/**
 * Set quantity of an item.
 * @param variantId
 * @param quantity
 */
export const checkoutSetQuantity = (variantId: string, quantity: number): Thunk<Promise<CheckoutResult>> => async (
  dispatch: any,
  getState: any
): Promise<CheckoutResult> => {
  const shop: ShopState = getState().shop;
  const lineItems = setItemQuantity(toLineItemArray(shop.checkout), variantId, quantity);
  return dispatch(checkoutUpdateOrCreateNew(shop, lineItems));
};

/**
 * Update the items in the checkout. Create a new checkout if needed.
 * @param shop
 * @param lineItems
 */
export const checkoutUpdateOrCreateNew = (
  shop: ShopState,
  lineItems: LineItemArray
): Thunk<Promise<CheckoutResult>> => async (dispatch: any): Promise<CheckoutResult> => {
  let r: CheckoutResult;
  if (shop.checkout === null || shop.checkout.completedAt !== null) {
    r = await dispatch(
      createCheckout({
        input: {
          lineItems
        }
      })
    );
  } else {
    r = await dispatch(
      checkoutReplaceItems({
        checkoutId: shop.checkout.id,
        lineItems
      })
    );
  }

  if (!r.error) {
    dispatch({ type: BASKET_UPDATED });
  }

  return r;
};

/**
 * Given a CheckoutLineItem, find the corresponding product variant
 * @param shop
 * @param item
 */
export const getProductAndVariant = (
  shop: ShopState,
  item: CheckoutLineItem
): {
  product: Product;
  variant: ProductVariant;
} | null => {
  const products = shop.products;
  const product = products[item.variant.product.handle];
  if (!product) {
    return null;
  }

  const n = product.variants.edges.find(n => n.node.id === item.variant.id);
  if (!n) {
    return null;
  }

  return {
    product,
    variant: n.node
  };
};

/**
 * Convert the line items of the checkout to an array suitable
 * for calling the various functions
 * @param checkout
 */
export function toLineItemArray(checkout: Checkout | null): LineItemArray {
  if (!checkout || !checkout.lineItems) {
    return [];
  }

  const lineItems: LineItemArray = mapGraphQLList(checkout.lineItems, i => {
    return {
      variantId: i.variant.id,
      quantity: i.quantity
    };
  });

  return lineItems;
}

/**
 * Add line items
 * @param items
 * @param variantId
 * @param quantity
 */
export function addItem(items: LineItemArray, variantId: string, quantity?: number): LineItemArray {
  const item: LineItem | undefined = items.find(i => i.variantId == variantId);
  if (item) {
    item.quantity += quantity || 1;
  } else {
    items.push({
      variantId,
      quantity: quantity || 1
    });
  }

  return items.filter(i => i.quantity > 0);
}

/**
 * Remove line items
 * @param items
 * @param variantId
 * @param quantity
 */
export function removeItem(items: LineItemArray, variantId: string, quantity?: number): LineItemArray {
  const item: LineItem | undefined = items.find(i => i.variantId == variantId);
  if (item) {
    item.quantity -= quantity || 1;
  }

  return items.filter(i => i.quantity > 0);
}

/**
 * Set item quantity
 * @param items
 * @param variantId
 * @param quantity
 */
export function setItemQuantity(items: LineItemArray, variantId: string, quantity: number): LineItemArray {
  const item: LineItem | undefined = items.find(i => i.variantId == variantId);
  if (item) {
    item.quantity = quantity;
  } else {
    items.push({
      variantId,
      quantity
    });
  }

  return items.filter(i => i.quantity > 0);
}

/**
 * Replace the items in the checkout
 * @param req
 */
export const checkoutReplaceItems = (req: CheckoutReplaceItemsRequest): Thunk<Promise<CheckoutResult>> => async (
  dispatch: any
): Promise<CheckoutResult> => {
  try {
    await dispatch(setModalThrobberVisible(true));
    const r: CheckoutResult = await dispatch(doCheckoutReplaceItems(req));
    if (!hasCheckoutErrors(r)) {
      await dispatch({
        type: RECEIVE_CHECKOUT,
        checkoutUserErrors: r.response.checkoutUserErrors,
        checkout: r.response.checkout
      });
    }
    return r;
  } finally {
    await dispatch(setModalThrobberVisible(false));
  }
};

/**
 * Update the shipping address
 * @param req
 */
export const updateShippingAddress = (req: SetShippingAddressRequest): Thunk<Promise<CheckoutResult>> => async (
  dispatch: any
): Promise<CheckoutResult> => {
  try {
    await dispatch(setModalThrobberVisible(true));

    const r: CheckoutResult = await dispatch(setShippingAddress(req));
    if (!hasCheckoutErrors(r)) {
      await dispatch({
        type: RECEIVE_CHECKOUT,
        checkoutUserErrors: r.response.checkoutUserErrors,
        checkout: r.response.checkout
      });
    }

    return r;
  } finally {
    await dispatch(setModalThrobberVisible(false));
  }
};

/**
 * Set the email
 * @param req
 */
export const checkoutSetEmail = (req: SetCheckoutEmailRequest): Thunk<Promise<CheckoutResult>> => async (
  dispatch: any
): Promise<CheckoutResult> => {
  try {
    await dispatch(setModalThrobberVisible(true));

    const r: CheckoutResult = await dispatch(setCheckoutEmail(req));
    if (!hasCheckoutErrors(r)) {
      await dispatch({
        type: RECEIVE_CHECKOUT,
        checkoutUserErrors: r.response.checkoutUserErrors,
        checkout: r.response.checkout
      });
    }

    return r;
  } finally {
    await dispatch(setModalThrobberVisible(false));
  }
};

/**
 * Request a checkout using id
 * @param req
 */
export const requestCheckout = (req: GetCheckoutRequest): Thunk<Promise<GetCheckoutResult>> => async (
  dispatch: any
): Promise<GetCheckoutResult> => {
  const r: GetCheckoutResult = await dispatch(getCheckout(req));

  if (!r.error && r.checkout) {
    handleCheckoutProductData(dispatch, r.checkout);

    await dispatch({
      type: RECEIVE_CHECKOUT,
      checkoutUserErrors: null,
      checkout: r.checkout
    });
  }
  return r;
};

/**
 * Clear checkout data
 */
export const clearCheckout = (): Thunk<Promise<void>> => async (dispatch: any): Promise<void> => {
  dispatch(removeLocalStorageItem(CHECKOUT_ID_LOCAL_STORAGE_NAME));

  await dispatch({
    type: CLEAR_CHECKOUT
  });
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

    const countries: Array<Country> = await dispatch(getCountries({ locale }));
    await dispatch({
      type: RECEIVE_COUNTRIES,
      countries
    });

    return countries;
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

    const addressFields = await dispatch(getAddressFields({ locale, countryCode }));

    await dispatch({
      type: RECEIVE_ADDRESS_FIELDS,
      countryCode,
      addressFields
    });

    return addressFields;
  };
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
