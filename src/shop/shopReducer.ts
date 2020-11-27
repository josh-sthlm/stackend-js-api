import {
  Checkout,
  CheckoutUserError,
  Collection,
  GetCollectionRequest,
  GetCollectionResult,
  GetProductResult,
  GetProductsResult,
  ListProductsAndTypesResult,
  ListProductsRequest,
  ListProductTypesResult,
  Product,
  ProductVariant,
  SlimProduct
} from './index';
import get from 'lodash/get';
import { ProductTypeTree, buildProductTypeTree } from './ProductTypeTree';
import { Country, FieldName } from '@shopify/address-consts';
import { GraphQLListNode, getNextCursor, getPreviousCursor, PageInfo } from '../util/graphql';

export const SET_SHOP_DEFAULTS = 'SET_SHOP_DEFAULTS';
export const RECEIVE_PRODUCT_TYPES = 'RECEIVE_PRODUCT_TYPES';
export const RECEIVE_PRODUCT = 'RECEIVE_PRODUCT';
export const RECEIVE_MULTIPLE_PRODUCTS = 'RECEIVE_MULTIPLE_PRODUCTS';
export const RECEIVE_LISTING = 'RECEIVE_LISTING';
export const RECEIVE_COLLECTION = 'RECEIVE_COLLECTION';
export const CLEAR_CACHE = 'CLEAR_CACHE';
export const BASKET_UPDATED = 'BASKET_UPDATED';
export const ADD_TO_BASKET = 'ADD_TO_BASKET';
export const REMOVE_FROM_BASKET = 'REMOVE_FROM_BASKET';
export const RECEIVE_CHECKOUT = 'RECEIVE_CHECKOUT';
export const CLEAR_CHECKOUT = 'CLEAR_CHECKOUT';
export const RECEIVE_COUNTRIES = 'RECEIVE_COUNTRIES';
export const RECEIVE_ADDRESS_FIELDS = 'RECEIVE_ADDRESS_FIELDS';

export const DEFAULT_PRODUCT_TYPE = '';

export interface AbstractProductListing extends PageInfo {
  /** Cursor not next page */
  nextCursor: string | null;

  /** Cursor to previous page */
  previousCursor: string | null;

  /**
   * The ListProductsRequest
   */
  selection: ListProductsRequest;
}

export interface SlimProductListing extends AbstractProductListing {
  /**
   * Products for this page in the listing
   */
  products: Array<SlimProduct>;
}

export interface ShopDefaults {
  /**
   * Default image size for products (1024)
   */
  imageMaxWidth: number;

  /**
   * Default image size for product listings (256)
   */
  listingImageMaxWidth: number;

  /**
   * Default page size (20)
   */
  pageSize: number;
}

export interface ShopState {
  /**
   * Default settings for the shop
   */
  defaults: ShopDefaults;

  /**
   * Product types
   */
  productTypes: Array<string>;

  /**
   * Product types as a tree
   */
  productTypeTree: ProductTypeTree;

  /**
   * Products by handle
   */
  products: {
    [handle: string]: Product;
  };

  /**
   * Product listing arranged by getProductListKey
   */
  productListings: {
    [key: string]: SlimProductListing;
  };

  /**
   * Collections of products
   */
  collections: {
    [handle: string]: Collection;
  };

  basketUpdated: number;

  /**
   * Current checkout, if any
   */
  checkout: Checkout | null;

  /**
   * Last checkout errors, if any
   */
  checkoutUserErrors: Array<CheckoutUserError> | null;

  /**
   * Country codes, or null if not loaded
   */
  countryCodes: Array<string> | null;

  /**
   * Countries by code
   */
  countriesByCode: { [code: string]: Country };

  /**
   * Required Address fields by country code
   */
  addressFieldsByCountryCode: { [code: string]: FieldName[][] };
}

export type ShopActions =
  | {
      type: typeof SET_SHOP_DEFAULTS;
      defaults: ShopDefaults;
    }
  | {
      type: typeof RECEIVE_PRODUCT_TYPES;
      json: ListProductTypesResult;
    }
  | {
      type: typeof RECEIVE_PRODUCT;
      json: GetProductResult;
    }
  | {
      type: typeof RECEIVE_MULTIPLE_PRODUCTS;
      json: GetProductsResult;
    }
  | {
      type: typeof RECEIVE_LISTING;
      json: ListProductsAndTypesResult;
      key: string;
      request: ListProductsRequest;
    }
  | {
      type: typeof RECEIVE_COLLECTION;
      json: GetCollectionResult;
      request: GetCollectionRequest;
    }
  | {
      type: typeof CLEAR_CACHE;
    }
  | {
      type: typeof ADD_TO_BASKET;
      product: Product;
      variantId: string;
      variant: ProductVariant;
      quantity: number;
    }
  | {
      type: typeof REMOVE_FROM_BASKET;
      product: Product;
      variant: ProductVariant;
      variantId: string;
      quantity: number;
    }
  | {
      type: typeof BASKET_UPDATED;
    }
  | {
      type: typeof RECEIVE_CHECKOUT;
      checkoutUserErrors: Array<CheckoutUserError> | null;
      checkout: Checkout;
    }
  | {
      type: typeof CLEAR_CHECKOUT;
    }
  | {
      type: typeof RECEIVE_COUNTRIES;
      countries: Array<Country>;
    }
  | {
      type: typeof RECEIVE_ADDRESS_FIELDS;
      countryCode: string;
      addressFields: FieldName[][];
    };

export default function shopReducer(
  state: ShopState = {
    defaults: {
      imageMaxWidth: 1024,
      listingImageMaxWidth: 256,
      pageSize: 20
    },
    productTypes: [],
    productTypeTree: [],
    products: {},
    productListings: {},
    collections: {},
    basketUpdated: 0,
    checkout: null,
    checkoutUserErrors: null,
    countryCodes: null,
    countriesByCode: {},
    addressFieldsByCountryCode: {}
  },
  action: ShopActions
): ShopState {
  switch (action.type) {
    case SET_SHOP_DEFAULTS:
      return Object.assign({}, state, {
        defaults: action.defaults,
        // Clear the cache as well
        productListings: {},
        products: {},
        collections: {}
      });

    case RECEIVE_PRODUCT_TYPES: {
      const edges: Array<GraphQLListNode<string>> = get(action, 'json.productTypes.edges', []);
      const productTypes = edges.map(e => e.node);

      return Object.assign({}, state, {
        productTypes,
        productTypeTree: buildProductTypeTree(edges)
      });
    }

    case RECEIVE_PRODUCT: {
      const product = get(action, 'json.product');
      if (product) {
        const products = Object.assign({}, state.products, {
          [product.handle]: product
        });

        return Object.assign({}, state, {
          products
        });
      }
      break;
    }

    case RECEIVE_MULTIPLE_PRODUCTS: {
      const receivedProducts = get(action, 'json.products');
      if (receivedProducts) {
        const products = Object.assign({}, state.products, receivedProducts);
        return Object.assign({}, state, {
          products
        });
      }
      break;
    }

    case RECEIVE_LISTING: {
      const receivedProducts = action.json.products;

      const listing: SlimProductListing = {
        hasNextPage: receivedProducts.pageInfo.hasNextPage,
        hasPreviousPage: receivedProducts.pageInfo.hasPreviousPage,
        nextCursor: getNextCursor(receivedProducts),
        previousCursor: getPreviousCursor(receivedProducts),
        selection: action.request,
        products: []
      };

      receivedProducts.edges.forEach(n => {
        listing.products.push(n.node);
      });

      const productListings = Object.assign({}, state.productListings, {
        [action.key]: listing
      });

      return Object.assign({}, state, {
        productListings
      });
    }

    case RECEIVE_COLLECTION: {
      const collection = action.json.collection;
      const handle = action.request.handle;
      return Object.assign({}, state, {
        collections: Object.assign({}, state.collections, {
          [handle]: collection
        })
      });
    }

    case CLEAR_CACHE:
      return Object.assign({}, state, {
        productListings: {},
        products: {},
        collections: {}
      });

    case BASKET_UPDATED:
    case ADD_TO_BASKET:
    case REMOVE_FROM_BASKET:
      return Object.assign({}, state, {
        basketUpdated: Date.now()
      });

    case RECEIVE_CHECKOUT: {
      return Object.assign({}, state, {
        checkout: action.checkout,
        checkoutUserErrors: action.checkoutUserErrors
      });
    }

    case CLEAR_CHECKOUT:
      return Object.assign({}, state, {
        checkout: null
      });

    case RECEIVE_COUNTRIES: {
      const countryCodes: Array<string> = [];
      const countriesByCode: { [code: string]: Country } = {};
      action.countries.forEach(c => {
        countryCodes.push(c.code);
        countriesByCode[c.code] = c;
      });
      return Object.assign({}, state, {
        countryCodes,
        countriesByCode
      });
    }

    case RECEIVE_ADDRESS_FIELDS: {
      const addressFieldsByCountryCode = Object.assign({}, state.addressFieldsByCountryCode, {
        [action.countryCode]: action.addressFields
      });

      return Object.assign({}, state, {
        addressFieldsByCountryCode
      });
    }
  }

  return state;
}
