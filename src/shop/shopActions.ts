//@flow

import {
  CheckoutResult,
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
  Checkout,
  LineItemArray,
  LineItem,
  CheckoutLineItem,
  SetCheckoutEmailRequest,
  setCheckoutEmail,
  applyDefaults,
  GetCollectionRequest,
  GetCollectionResult,
  getCollection,
  ListProductsQuery
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
  BASKET_UPDATED,
  ShopDefaults,
  SET_SHOP_DEFAULTS,
  RECEIVE_COLLECTION
} from './shopReducer';
import { newXcapJsonResult, Thunk } from '../api';
import { Country } from '@shopify/address';
import { FieldName } from '@shopify/address-consts';
import { setModalThrobberVisible } from '../throbber/throbberActions';
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from '../util';
import { forEachGraphQLList, GraphQLList, GraphQLListNode, mapGraphQLList } from '../util/graphql';

/**
 * Set shop default configuration
 * @param defaults
 */
export const setShopDefaults = (defaults: ShopDefaults): Thunk<void> => (dispatch: any): void => {
  dispatch({
    type: SET_SHOP_DEFAULTS,
    defaults
  });
};

/**
 * Get the shop default configuration
 */
export const getShopDefaults = (): Thunk<ShopDefaults> => (dispatch: any, getState: any): ShopDefaults => {
  return getState().shop.defaults;
};

/**
 * Load product types into store
 * @param req
 */
export const requestProductTypes = (req: ListProductTypesRequest): Thunk<Promise<ListProductTypesResult>> => async (
  dispatch: any,
  getState: any
): Promise<ListProductTypesResult> => {
  if (!req.first) {
    req.first = getState().shop.defaults.pageSize;
  }
  const r = await dispatch(listProductTypes(req));
  if (!r.error) {
    await dispatch({ type: RECEIVE_PRODUCT_TYPES, json: r });
  }
  return r;
};

/**
 * Request a product listing
 * @param req
 */
export const requestProducts = (req: ListProductsRequest): Thunk<Promise<ListProductsResult>> => async (
  dispatch: any,
  getState: any
): Promise<ListProductsResult> => {
  applyDefaults(req, getState().shop.defaults);
  const r = await dispatch(listProducts(req));
  if (!r.error) {
    const key = dispatch(getProductListKey(req));
    await dispatch({ type: RECEIVE_LISTING, json: r, request: req, key });
  }
  return r;
};

/**
 * Load products and product types into store
 * @param req
 */
export const requestProductsAndProductTypes = (
  req: ListProductsRequest
): Thunk<Promise<ListProductsAndTypesResult>> => async (
  dispatch: any,
  getState: any
): Promise<ListProductsAndTypesResult> => {
  applyDefaults(req, getState().shop.defaults);
  const r = await dispatch(listProductsAndTypes(req));
  if (!r.error) {
    const key = dispatch(getProductListKey(req));
    await dispatch({ type: RECEIVE_LISTING, json: r, request: req, key });
    await dispatch({ type: RECEIVE_PRODUCT_TYPES, json: r });
  }
  return r;
};

/**
 * Load a single product into store
 * @param req
 */
export const requestProduct = (req: GetProductRequest): Thunk<Promise<GetProductResult>> => async (
  dispatch: any,
  getState: any
): Promise<GetProductResult> => {
  if (!req.imageMaxWidth) {
    req.imageMaxWidth = getState().shop.defaults.imageMaxWidth;
  }
  const r = await dispatch(getProduct(req));
  if (!r.error) {
    await dispatch({ type: RECEIVE_PRODUCT, json: r });
  }
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
  dispatch: any,
  getState: any
): Promise<GetProductsResult> => {
  if (!req.imageMaxWidth) {
    req.imageMaxWidth = getState().shop.defaults.imageMaxWidth;
  }
  const r = await dispatch(getProducts(req));
  if (!r.error) {
    await dispatch({ type: RECEIVE_MULTIPLE_PRODUCTS, json: r });
  }
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

  if (!req.imageMaxWidth) {
    req.imageMaxWidth = shop.defaults.imageMaxWidth;
  }

  const fetchHandles: Array<string> = [];
  for (const h of req.handles) {
    const p = shop.products[h];
    if (!p) {
      fetchHandles.push(h);
    }
  }

  if (fetchHandles.length == 0) {
    return newXcapJsonResult<GetProductsResult>('success', { products: {} });
  }

  const r = await dispatch(getProducts({ handles: fetchHandles, imageMaxWidth: req.imageMaxWidth }));
  if (!r.error) {
    await dispatch({ type: RECEIVE_MULTIPLE_PRODUCTS, json: r });
  }
  return r;
};

/**
 * Request a collection, if missing
 * @param req
 */
export const requestCollection = (req: GetCollectionRequest): Thunk<Promise<GetCollectionResult>> => async (
  dispatch: any,
  getState: () => any
): Promise<GetCollectionResult> => {
  const shop: ShopState = getState().shop;
  const collection = shop.collections[req.handle];
  if (collection) {
    return newXcapJsonResult<GetCollectionResult>('success', { collection });
  }

  if (!req.imageMaxWidth) {
    req.imageMaxWidth = shop.defaults.listingImageMaxWidth;
  }

  const r = await dispatch(getCollection(req));
  if (!r.error) {
    dispatch({
      type: RECEIVE_COLLECTION,
      request: req,
      json: r
    });
  }
  return r;
};

export const CHECKOUT_ID_LOCAL_STORAGE_NAME = 'checkout';

/**
 * Get the key used to index the product listings in ShopState
 * @param req
 */
export const getProductListKey = (req: ListProductsQuery): Thunk<string> => (dispatch: any, getState: any): string => {
  const defaults: ShopDefaults = getState().shop.defaults;
  applyDefaults(req, defaults);

  // NOTE: This must match the server side implementation

  function append(s: string, values: Array<string> | null | undefined): string {
    if (values && values.length !== 0) {
      const x: Array<string> = [];
      for (const v of values) {
        x.push(v.toLowerCase());
      }
      x.sort((a, b) => a.localeCompare(b));
      s += x.join(',');
    }

    s += ';';

    return s;
  }

  let s = '';
  s += (req.q || '') + ';';
  s = append(s, req.productTypes);
  s = append(s, req.tags);
  s += (req.sort || ProductSortKeys.RELEVANCE) + ';';
  s += req.imageMaxWidth + ';';
  s += (req.first || '') + ';';
  s += (req.after || '') + ';';
  s += (req.last || '') + ';';
  s += (req.before || '') + ';';

  return s;
};

/**
 * Clear store cache. Does not empty basket or product types
 */
export const clearCache = (): Thunk<Promise<void>> => async (dispatch: any): Promise<void> => {
  await dispatch({ type: CLEAR_CACHE });
};

/**
 * Get products from a listing
 * @param key
 */
export const getProductListingByKey = (key: string | null | undefined): Thunk<SlimProductListing | null> => (
  dispatch: any,
  getState: any
): SlimProductListing | null => {
  if (key === null || typeof key === 'undefined') {
    return null;
  }
  const shop: ShopState = getState().shop;
  const listing = shop.productListings[key];
  return listing ? listing : null;
};

/**
 * Get products from a listing
 * @param req
 */
export const getProductListing = (req: ListProductsRequest): Thunk<SlimProductListing | null> => (
  dispatch: any
): SlimProductListing | null => {
  const key = dispatch(getProductListKey(req));
  return dispatch(getProductListingByKey(key));
};

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

  if (!imageMaxWidth) {
    imageMaxWidth = getState().shop.defaults.imageMaxWidth;
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
  forEachGraphQLList(checkout.lineItems, i => {
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

  return mapGraphQLList(checkout.lineItems, i => {
    return {
      variantId: i.variant.id,
      quantity: i.quantity
    };
  });
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
  dispatch: any,
  getState: any
): Promise<GetCheckoutResult> => {
  if (!req.imageMaxWidth) {
    req.imageMaxWidth = getState().shop.defaults.imageMaxWidth;
  }
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
