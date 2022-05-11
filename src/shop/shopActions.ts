import {
  AddressFieldName,
  applyDefaults,
  Checkout,
  CheckoutLineItem,
  checkoutReplaceItems as doCheckoutReplaceItems,
  CheckoutReplaceItemsRequest,
  CheckoutResult,
  Country,
  CreateCartRequest,
  createCheckout as doCreateCheckout,
  CreateCheckoutRequest,
  getAddressFields,
  getCheckout,
  GetCheckoutRequest,
  GetCheckoutResult,
  getCollection,
  GetCollectionRequest,
  GetCollectionResult,
  getCollections,
  GetCollectionsResult,
  getCountries,
  getProduct,
  GetProductRequest,
  GetProductResult,
  getProducts,
  GetProductsRequest,
  GetProductsResult,
  LineItem,
  LineItemArray,
  listProducts,
  listProductsAndTypes,
  ListProductsAndTypesResult,
  ListProductsQuery,
  ListProductsRequest,
  ListProductsResult,
  listProductTypes,
  ListProductTypesRequest,
  ListProductTypesResult,
  Product,
  ProductSortKeys,
  ProductVariant,
  selectShipping as doSelectShipping,
  SelectShippingRequest,
  setCheckoutEmail,
  SetCheckoutEmailRequest,
  setShippingAddress,
  SetShippingAddressRequest,
  createCart as doCreateCart,
  ModifyCartResult,
  getCart as doGetCart,
  cartLinesAdd as doCartLinesAdd,
  cartLinesRemove as doCartLinesRemove,
  Cart,
  CartLine,
  cartFindLine,
  cartLinesUpdate,
  CartBuyerIdentity,
  cartToLineItems,
  cartBuyerIdentityUpdate as doCartBuyerIdentityUpdate
} from './index';
import {
  ADD_TO_BASKET,
  BASKET_UPDATED,
  CLEAR_CART,
  CLEAR_CHECKOUT,
  RECEIVE_ADDRESS_FIELDS,
  RECEIVE_CART,
  RECEIVE_CHECKOUT,
  RECEIVE_COLLECTION,
  RECEIVE_COLLECTION_LIST,
  RECEIVE_COUNTRIES,
  RECEIVE_LISTING,
  RECEIVE_MULTIPLE_PRODUCTS,
  RECEIVE_PRODUCT,
  RECEIVE_PRODUCT_TYPES,
  REMOVE_FROM_BASKET,
  SET_CUSTOMER_VAT_INFO,
  SET_SHOP_DEFAULTS,
  SET_VATS,
  SHOP_CLEAR_CACHE,
  ShopDefaults,
  ShopState,
  SlimProductListing,
  VatState
} from './shopReducer';
import { newXcapJsonErrorResult, newXcapJsonResult, Thunk } from '../api';
import { setModalThrobberVisible } from '../throbber/throbberActions';
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from '../util';
import { forEachGraphQLList, GraphQLList, GraphQLListNode, mapGraphQLList } from '../util/graphql';
import { CustomerType, getCustomerInfo, TradeRegion } from './vat';
import { Community } from '../stackend';
import { CommunityState } from '../stackend/communityReducer';

export const CHECKOUT_ID_LOCAL_STORAGE_NAME = 'checkout';
export const CART_ID_LOCAL_STORAGE_NAME = 'cart';

/**
 * Set shop default configuration
 * @param defaults
 */
export const setShopDefaults =
  (defaults: ShopDefaults): Thunk<void> =>
  (dispatch: any): void => {
    dispatch({
      type: SET_SHOP_DEFAULTS,
      defaults
    });
  };

/**
 * Get the shop default configuration
 */
export const getShopDefaults =
  (): Thunk<ShopDefaults> =>
  (dispatch: any, getState: any): ShopDefaults => {
    return getState().shop.defaults;
  };

/**
 * Load product types into store
 * @param req
 */
export const requestProductTypes =
  (req: ListProductTypesRequest): Thunk<Promise<ListProductTypesResult>> =>
  async (dispatch: any, getState: any): Promise<ListProductTypesResult> => {
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
export const requestProducts =
  (req: ListProductsRequest): Thunk<Promise<ListProductsResult>> =>
  async (dispatch: any, getState: any): Promise<ListProductsResult> => {
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
export const requestProductsAndProductTypes =
  (req: ListProductsRequest): Thunk<Promise<ListProductsAndTypesResult>> =>
  async (dispatch: any, getState: any): Promise<ListProductsAndTypesResult> => {
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
export const requestProduct =
  (req: GetProductRequest): Thunk<Promise<GetProductResult>> =>
  async (dispatch: any, getState: any): Promise<GetProductResult> => {
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
export const requestMultipleProducts =
  (req: GetProductsRequest): Thunk<Promise<GetProductsResult>> =>
  async (dispatch: any, getState: any): Promise<GetProductsResult> => {
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
export const requestMissingProducts =
  (req: GetProductsRequest): Thunk<Promise<GetProductsResult>> =>
  async (dispatch: any, getState: () => any): Promise<GetProductsResult> => {
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
export const requestCollection =
  (req: GetCollectionRequest): Thunk<Promise<GetCollectionResult>> =>
  async (dispatch: any, getState: () => any): Promise<GetCollectionResult> => {
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

/**
 * Request a list of all collections, if missing
 */
export const requestCollections =
  (): Thunk<Promise<GetCollectionsResult>> =>
  async (dispatch: any, getState: () => any): Promise<GetCollectionsResult> => {
    const shop: ShopState = getState().shop;
    if (shop.allCollections) {
      return newXcapJsonResult<GetCollectionsResult>('success', {
        collections: shop.allCollections
      });
    }

    const r = await dispatch(getCollections({}));

    if (!r.error) {
      dispatch({
        type: RECEIVE_COLLECTION_LIST,
        collections: r.collections
      });
    }

    return r;
  };

/**
 * Get the key used to index the product listings in ShopState
 * @param req
 */
export const getProductListKey =
  (req: ListProductsQuery): Thunk<string> =>
  (dispatch: any, getState: any): string => {
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
export const clearCache =
  (): Thunk<Promise<void>> =>
  async (dispatch: any): Promise<void> => {
    await dispatch({ type: SHOP_CLEAR_CACHE });
  };

/**
 * Get products from a listing
 * @param key
 */
export const getProductListingByKey =
  (key: string | null | undefined): Thunk<SlimProductListing | null> =>
  (dispatch: any, getState: any): SlimProductListing | null => {
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
export const getProductListing =
  (req: ListProductsRequest): Thunk<SlimProductListing | null> =>
  (dispatch: any): SlimProductListing | null => {
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
 * Handle product data received via a cart:
 * Adds the products to the store and transforms the returned data
 * @param dispatch
 * @param cart
 */
function handleCartProductData(dispatch: any, cart: Cart | null | undefined): boolean {
  if (!cart) {
    return false;
  }

  const products: { [handle: string]: Product } = {};
  const lines: GraphQLList<CartLine> = { edges: [] };
  forEachGraphQLList(cart.lines, i => {
    const p: any = i.merchandise.product;

    // Contains extra product data
    if (typeof p['availableForSale'] === 'boolean') {
      const product = p as Product;
      products[product.handle] = product;

      // Remove the extra data
      const li: GraphQLListNode<CartLine> = {
        node: {
          ...i,
          merchandise: {
            id: i.merchandise.id,
            product: {
              id: i.merchandise.product.id,
              handle: i.merchandise.product.handle
            }
          }
        }
      };
      lines.edges.push(li);
    } else {
      lines.edges.push({ node: i });
    }
  });

  cart.lines = lines;

  if (Object.keys(products).length !== 0) {
    dispatch({
      type: RECEIVE_MULTIPLE_PRODUCTS,
      json: newXcapJsonResult<GetProductsResult>('success', {
        products
      })
    });
  }

  dispatch({
    type: RECEIVE_CART,
    cart
  });

  return true;
}

/**
 * Create a cart
 */
export function createCart(req: CreateCartRequest): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any, getState: any): Promise<ModifyCartResult> => {
    try {
      await dispatch(setModalThrobberVisible(true));

      // FIXME: Improve country detection
      if (!req.buyerIdentity) {
        req.buyerIdentity = {} as CartBuyerIdentity;
      }

      if (!req.buyerIdentity.countryCode) {
        const ci = dispatch(getCustomerInfo());
        if (ci && ci.customerCountryCode) {
          req.buyerIdentity.countryCode = ci.customerCountryCode;
        } else {
          const communities: CommunityState = getState().communities;
          const countryCode = communities.community?.settings?.shop?.countryCode;
          if (countryCode) {
            req.buyerIdentity.countryCode = countryCode;
          }
        }
      }

      const r: ModifyCartResult = await dispatch(doCreateCart(req));
      if (r.error || r.userErrors?.length !== 0) {
        return r;
      }

      if (r.cart) {
        dispatch(setLocalStorageItem(CART_ID_LOCAL_STORAGE_NAME, r.cart.id));
      }

      handleCartProductData(dispatch, r.cart);

      return r;
    } finally {
      await dispatch(setModalThrobberVisible(false));
    }
  };
}

/**
 * If the user has established a cart, get it
 * @param imageMaxWidth
 */
export function getCart({ imageMaxWidth }: { imageMaxWidth?: number }): Thunk<Promise<Cart | null>> {
  return async (dispatch: any, getState: any): Promise<Cart | null> => {
    const shop: ShopState = getState().shop;
    if (shop.cart) {
      return shop.cart;
    }

    const cartId = dispatch(getLocalStorageItem(CART_ID_LOCAL_STORAGE_NAME));
    if (!cartId) {
      return null;
    }

    const r = await dispatch(doGetCart({ cartId, imageMaxWidth }));
    if (r.cart) {
      handleCartProductData(dispatch, r.cart);
      return r.cart;
    }

    await dispatch(clearCart());
    return null;
  };
}

/**
 * Clear cart data and remove the id
 */
export function clearCart(): Thunk<Promise<void>> {
  return async (dispatch: any): Promise<void> => {
    dispatch(removeLocalStorageItem(CART_ID_LOCAL_STORAGE_NAME));
    await dispatch({
      type: CLEAR_CART
    });
  };
}

/**
 * Alter buyer information
 */
export function cartBuyerIdentityUpdate(buyerIdentity: CartBuyerIdentity): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any): Promise<ModifyCartResult> => {
    try {
      await dispatch(setModalThrobberVisible(true));
      const cart = await dispatch(getCart({}));
      if (!cart) {
        // FIXME: Create empty cart here?
        return newXcapJsonResult<ModifyCartResult>('success', { cart: null });
      }

      const r = await dispatch(doCartBuyerIdentityUpdate({ cartId: cart.id, buyerIdentity }));
      if (r.cart) {
        handleCartProductData(dispatch, r.cart);
      }
      return r;
    } finally {
      await dispatch(setModalThrobberVisible(false));
    }
  };
}

/**
 * Add an item to the cart or increment the quantity. Creating a new cart if needed.
 * @param product
 * @param variant
 * @param quantity
 */
export function cartAdd(
  product: Product,
  variant: ProductVariant,
  quantity?: number
): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any): Promise<ModifyCartResult> => {
    if (!product || !variant) {
      throw new Error('product and variant required');
    }

    const q = quantity || 1;
    const lines = [{ merchandiseId: variant.id, quantity: q }];
    let r = null;

    try {
      await dispatch(setModalThrobberVisible(true));
      const cart = await dispatch(getCart({}));
      if (cart) {
        const line = cartFindLine(cart, variant.id);
        if (line) {
          r = await dispatch(cartSetQuantity(variant.id, line.quantity + q));
        } else {
          r = await dispatch(doCartLinesAdd({ cartId: cart.id, lines }));
          if (!r.error) {
            handleCartProductData(dispatch, r.cart);
          }
        }
      } else {
        r = await dispatch(createCart({ lines }));
      }

      if (!r.error) {
        dispatch({ type: ADD_TO_BASKET, product, variant, variantId: variant.id, quantity: q });
      }

      return r;
    } finally {
      await dispatch(setModalThrobberVisible(false));
    }
  };
}

/**
 * For a product in the cart, decrement the quantity. Remove if 0.
 * NOTE: This differs from the Shopify behavior that removes the line completely.
 * @param product
 * @param variant
 * @param quantity
 */
export function cartRemove(
  product: Product,
  variant: ProductVariant,
  quantity?: number
): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any, _getState: any): Promise<ModifyCartResult> => {
    if (!product || !variant) {
      throw new Error('product and variant required');
    }

    const cart = await dispatch(getCart({}));
    if (!cart) {
      // The cart has probably expired. Improve this situation?
      return newXcapJsonResult<ModifyCartResult>('success', { cart: null });
    }

    const line = cartFindLine(cart, variant.id);
    if (line == null) {
      console.warn('No such product variant in cart', variant.id, cart.lines.edges);
      return newXcapJsonResult<ModifyCartResult>('success', { cart: null });
    }

    try {
      await dispatch(setModalThrobberVisible(true));
      let r = null;
      const q = quantity || 1;
      const newQuantity = line.quantity - q;
      if (newQuantity <= 0) {
        r = await dispatch(doCartLinesRemove({ cartId: cart.id, lineIds: [line.id] }));
      } else {
        r = await dispatch(
          cartLinesUpdate({
            cartId: cart.id,
            lines: [
              {
                id: line.id,
                merchandiseId: line.merchandise.id,
                quantity: newQuantity
              }
            ]
          })
        );
      }

      if (!r.error) {
        handleCartProductData(dispatch, r.cart);
        dispatch({ type: REMOVE_FROM_BASKET, product, variant, variantId: variant.id, quantity: q });
      }

      return r;
    } finally {
      await dispatch(setModalThrobberVisible(false));
    }
  };
}

/**
 * Set quantity of an item.
 * @param variantId
 * @param quantity
 */
export function cartSetQuantity(variantId: string, quantity: number): Thunk<Promise<ModifyCartResult>> {
  return async (dispatch: any): Promise<ModifyCartResult> => {
    const cart = await dispatch(getCart({}));

    if (!cart) {
      if (quantity < 1) {
        return newXcapJsonResult<ModifyCartResult>('success', { cart: null });
      }
      return await dispatch(createCart({ lines: [{ merchandiseId: variantId, quantity: quantity || 1 }] }));
    }

    const line = cartFindLine(cart, variantId);
    if (!line) {
      console.warn('No such product variant in cart', variantId, cart.lines.edges);
      return newXcapJsonResult<ModifyCartResult>('success', { cart: null });
    }

    try {
      await dispatch(setModalThrobberVisible(true));
      let r = null;
      if (quantity < 1) {
        r = await dispatch(doCartLinesRemove({ cartId: cart.id, lineIds: [line.id] }));
      } else {
        r = await dispatch(
          cartLinesUpdate({ cartId: cart.id, lines: [{ id: line.id, quantity: quantity, merchandiseId: variantId }] })
        );
      }

      if (!r.error) {
        handleCartProductData(dispatch, r.cart);
      }

      return r;
    } finally {
      await dispatch(setModalThrobberVisible(false));
    }
  };
}

/**
 * Create a checkout from the cart, possibly reusing
 */
export function createCheckoutFromCart(): Thunk<Promise<CheckoutResult>> {
  return async (dispatch: any, getState: any): Promise<CheckoutResult> => {
    try {
      dispatch(setModalThrobberVisible(true));

      const cart = await dispatch(getCart({}));
      if (!cart) {
        return newXcapJsonErrorResult<CheckoutResult>('cart_not_available');
      }

      // Reuse existing checkout, if available. The customer may have entered address data
      await dispatch(requestOrResetActiveCheckout({}));

      const shop: ShopState = getState().shop;
      const lineItems: LineItemArray = cartToLineItems(cart);
      return await dispatch(checkoutUpdateOrCreateNew(shop, lineItems));
    } finally {
      dispatch(setModalThrobberVisible(false));
    }
  };
}

/**
 * Create a checkout
 */
export function createCheckout(req: CreateCheckoutRequest): Thunk<Promise<CheckoutResult>> {
  return async (dispatch: any): Promise<CheckoutResult> => {
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
}

/**
 * If the user has an active checkout set in the local storage, request that checkout to be loaded.
 * If the checkout is turned into an order, the checkout is reset in local storage.
 * @param imageMaxWidth
 */
export const requestOrResetActiveCheckout =
  ({ imageMaxWidth }: { imageMaxWidth?: number }): Thunk<Promise<GetCheckoutResult>> =>
  async (dispatch: any, getState: any): Promise<GetCheckoutResult> => {
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
 * Handle product data received via checkout:
 * Adds the products to the store and tranforms the returned data
 * @param dispatch
 * @param checkout
 */
function handleCheckoutProductData(dispatch: any, checkout: Checkout | null | undefined): boolean {
  if (!checkout) {
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

  dispatch({
    type: RECEIVE_MULTIPLE_PRODUCTS,
    json: newXcapJsonResult<GetProductsResult>('success', {
      products
    })
  });

  return true;
}

/**
 * Add an item to the checkout. Possibly creating a new checkout.
 * @param product
 * @param variant
 * @param quantity
 */
export const checkoutAdd =
  (product: Product, variant: ProductVariant, quantity?: number): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any, getState: any): Promise<CheckoutResult> => {
    if (!product || !variant) {
      throw new Error('product and variant required');
    }

    const q = quantity || 1;
    const shop: ShopState = getState().shop;
    const lineItems = addItem(toLineItemArray(shop.checkout), variant.id, q);
    const r: CheckoutResult = await dispatch(
      checkoutUpdateOrCreateNew(shop, lineItems, product.handle, variant.id, quantity || 1)
    );
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
export const checkoutRemove =
  (product: Product, variant: ProductVariant, quantity?: number): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any, getState: any): Promise<CheckoutResult> => {
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
export const checkoutSetQuantity =
  (variantId: string, quantity: number): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any, getState: any): Promise<CheckoutResult> => {
    const shop: ShopState = getState().shop;
    const lineItems = setItemQuantity(toLineItemArray(shop.checkout), variantId, quantity);
    return dispatch(checkoutUpdateOrCreateNew(shop, lineItems));
  };

/**
 * Update the items in the checkout. Create a new checkout if needed.
 * @param shop
 * @param lineItems
 * @param addedProductHandle
 * @param variantId
 * @param quantity
 */
export const checkoutUpdateOrCreateNew =
  (
    shop: ShopState,
    lineItems: LineItemArray,
    addedProductHandle?: string,
    variantId?: string,
    quantity?: number
  ): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any): Promise<CheckoutResult> => {
    let r: CheckoutResult;
    if (shop.checkout === null || shop.checkout.completedAt !== null) {
      r = await dispatch(
        createCheckout({
          input: {
            lineItems
          },
          addedProductHandle,
          variantId,
          quantity
        })
      );
    } else {
      r = await dispatch(
        checkoutReplaceItems({
          checkoutId: shop.checkout.id,
          lineItems,
          addedProductHandle,
          variantId,
          quantity
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
export function getProductAndVariant(
  shop: ShopState,
  item: CheckoutLineItem
): {
  product: Product;
  variant: ProductVariant;
} | null {
  return getProductAndVariant2(shop, item.variant.product.handle, item.variant.id);
}

/**
 * Given a product handle and variantId, find the corresponding product variant
 * @param shop
 * @param productHandle
 * @param variantId
 */
export function getProductAndVariant2(
  shop: ShopState,
  productHandle: string,
  variantId: string
): {
  product: Product;
  variant: ProductVariant;
} | null {
  const products = shop.products;
  const product = products[productHandle];
  if (!product) {
    return null;
  }

  const n = product.variants.edges.find(n => n.node.id === variantId);
  if (!n) {
    return null;
  }

  return {
    product,
    variant: n.node
  };
}

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
export const checkoutReplaceItems =
  (req: CheckoutReplaceItemsRequest): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any): Promise<CheckoutResult> => {
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
export const updateShippingAddress =
  (req: SetShippingAddressRequest): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any): Promise<CheckoutResult> => {
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
export const checkoutSetEmail =
  (req: SetCheckoutEmailRequest): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any): Promise<CheckoutResult> => {
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
export const requestCheckout =
  (req: GetCheckoutRequest): Thunk<Promise<GetCheckoutResult>> =>
  async (dispatch: any, getState: any): Promise<GetCheckoutResult> => {
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
export const clearCheckout =
  (): Thunk<Promise<void>> =>
  async (dispatch: any): Promise<void> => {
    dispatch(removeLocalStorageItem(CHECKOUT_ID_LOCAL_STORAGE_NAME));

    await dispatch({
      type: CLEAR_CHECKOUT
    });
  };

/**
 * Select shipping
 * @param req
 */
export const selectShipping =
  (req: SelectShippingRequest): Thunk<Promise<CheckoutResult>> =>
  async (dispatch: any): Promise<CheckoutResult> => {
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
}): Thunk<Promise<AddressFieldName[][]>> {
  return async (dispatch: any, getState: any): Promise<AddressFieldName[][]> => {
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

/**
 * Set the vats
 * @param vats
 */
export function setVATs(vats: VatState): Thunk<void> {
  return (dispatch: any, _getState: any): void => {
    dispatch({ type: SET_VATS, vats });
  };
}

/**
 * Set the vats using a community
 * @param community
 */
export function setCommunityVATS(community: Community | null): Thunk<void> {
  return (dispatch: any, _getState: any): void => {
    if (community && community.settings.vats) {
      const vats = community.settings.vats as VatState;
      dispatch({ type: SET_VATS, vats });
    }
  };
}

/**
 * Set VAT parameters for current customer
 * @param customerCountryCode
 * @param customerTradeRegion
 * @param customerType
 */
export function setCustomerVatInfo({
  customerCountryCode,
  customerTradeRegion,
  customerType
}: {
  customerCountryCode?: string;
  customerTradeRegion?: TradeRegion;
  customerType?: CustomerType;
}) {
  return (dispatch: any, _getState: any): void => {
    dispatch({ type: SET_CUSTOMER_VAT_INFO, customerCountryCode, customerTradeRegion, customerType });
  };
}
