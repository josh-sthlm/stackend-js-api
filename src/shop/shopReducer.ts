import {
  Checkout,
  UserError,
  Collection,
  GetCollectionRequest,
  GetCollectionResult,
  GetProductResult,
  GetProductsResult,
  ListProductsAndTypesResult,
  ListProductsRequest,
  ListProductTypesResult,
  MultipleProductListingsResult,
  Product,
  ProductVariant,
  SlimProduct,
  Country,
  AddressFieldName,
  SlimCollection,
  Cart
} from './index';
import get from 'lodash/get';
import { ProductTypeTree, buildProductTypeTree } from './ProductTypeTree';
import {
  GraphQLListNode,
  getNextCursor,
  getPreviousCursor,
  PageInfo,
  GraphQLList,
  forEachGraphQLList,
  mapGraphQLList
} from '../util/graphql';
import { ExtraObjectHandler, registerExtraObjectHandler } from '../api/extraObjectActions';
import { newXcapJsonResult } from '../api';
import { CustomerType, TradeRegion, VatType } from './vat';
import { CurrencyInfo } from './currency';

export const SET_SHOP_DEFAULTS = 'SET_SHOP_DEFAULTS';
export const RECEIVE_PRODUCT_TYPES = 'RECEIVE_PRODUCT_TYPES';
export const RECEIVE_PRODUCT = 'RECEIVE_PRODUCT';
export const RECEIVE_MULTIPLE_PRODUCTS = 'RECEIVE_MULTIPLE_PRODUCTS';
export const RECEIVE_LISTING = 'RECEIVE_LISTING';
export const RECEIVE_LISTINGS = 'RECEIVE_LISTINGS';
export const RECEIVE_COLLECTION = 'RECEIVE_COLLECTION';
export const RECEIVE_COLLECTIONS = 'RECEIVE_COLLECTIONS';
export const RECEIVE_COLLECTION_LIST = 'RECEIVE_COLLECTION_LIST';
export const RECEIVE_SHOPIFY_DOMAIN_REFERENCE_URL_ID = 'RECEIVE_SHOPIFY_DOMAIN_REFERENCE_URL_ID';
export const SHOP_CLEAR_CACHE = 'SHOP_CLEAR_CACHE';
export const BASKET_UPDATED = 'BASKET_UPDATED';
export const ADD_TO_BASKET = 'ADD_TO_BASKET';
export const REMOVE_FROM_BASKET = 'REMOVE_FROM_BASKET';
export const RECEIVE_CHECKOUT = 'RECEIVE_CHECKOUT';
export const CLEAR_CHECKOUT = 'CLEAR_CHECKOUT';
export const RECEIVE_COUNTRIES = 'RECEIVE_COUNTRIES';
export const RECEIVE_ADDRESS_FIELDS = 'RECEIVE_ADDRESS_FIELDS';
export const SET_VATS = 'SET_VATS';
export const SET_CUSTOMER_VAT_INFO = 'SET_CUSTOMER_VAT_INFO';
export const RECEIVE_CURRENCY = 'RECEIVE_CURRENCY';
export const RECEIVE_CART = 'RECEIVE_CART';
export const CLEAR_CART = 'CLEAR_CART';
export const SET_IS_SHOPIFY_APP = 'SET_IS_SHOPIFY_APP';
export const SET_ENABLE_CART_NOTIFICATIONS = 'SET_ENABLE_CART_NOTIFICATIONS';

export const DEFAULT_PRODUCT_TYPE = '';

export interface ShopConfig {
  /** Shopify domain */
  domain: string;

  /** Store front access token */
  accessToken: string;

  /** Country code */
  countryCode: string;

  /** Api version YYYY-MM */
  apiVersion: string;
}

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

export interface VatState {
  /** Should the UI display prices using VAT by default? */
  showPricesUsingVAT: boolean;

  /** Shops origin */
  shopCountryCode: string;

  /** Country code of the customer */
  customerCountryCode: string | null;

  /** Trade region of the customer */
  customerTradeRegion: TradeRegion;

  /** Type of customer */
  customerType: CustomerType | null;

  /** VAT rates as percent for the shops country */
  vatRates: {
    [VatType.STANDARD]: number | boolean;
    [VatType.REDUCED]: number | boolean;
    [VatType.REDUCED_ALT]: number | boolean;
    [VatType.SUPER_REDUCED]: number | boolean;
    [VatType.PARKING]: number | boolean;
  };

  /** Should vat price be shown for shipping rates? */
  showVatForShipping: boolean;

  /** Overrides from the standard vat rate
   *  Maps from product collection to VatType
   */
  overrides: {
    [collectionHandle: string]: VatType;
  };
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
   * Collections of products arranged by handle
   */
  collections: {
    [handle: string]: Collection;
  };

  /**
   * All collections as a list
   */
  allCollections: Array<SlimCollection> | null;

  basketUpdated: number;

  /**
   * Current cart, if any
   */
  cart: Cart | null;

  /**
   * Current checkout, if any
   */
  checkout: Checkout | null;

  /**
   * Last checkout errors, if any
   */
  checkoutUserErrors: Array<UserError> | null;

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
  addressFieldsByCountryCode: { [code: string]: AddressFieldName[][] };

  /**
   * Vats
   */
  vats: VatState | null;

  /**
   * Currencies
   */
  currencies: { [currencyCode: string]: CurrencyInfo };

  /**
   * Reference Url id used for basket notification comments
   */
  shopifyDomainReferenceUrlId: number;

  /**
   * Should cart notifications be enabled? (Posts a comment when someone adds a product to their cart)
   */
  enableCartNotifications: boolean;

  /**
   * True if running as shopify app extension that requires integration with the shopify store.
   */
  isShopifyApp: boolean;
}

export type SetShopDefaultsAction = {
  type: typeof SET_SHOP_DEFAULTS;
  defaults: ShopDefaults;
};

export type ReceiveProductTypesAction = {
  type: typeof RECEIVE_PRODUCT_TYPES;
  json: ListProductTypesResult;
};

export type ReceiveProductAction = {
  type: typeof RECEIVE_PRODUCT;
  json: GetProductResult;
};

export type ReceiveMultipleProductsAction = {
  type: typeof RECEIVE_MULTIPLE_PRODUCTS;
  json: GetProductsResult;
};

export type ReceiveListingAction = {
  type: typeof RECEIVE_LISTING;
  json: ListProductsAndTypesResult;
  key: string;
  request: ListProductsRequest;
};

export type ReceiveListingsAction = {
  type: typeof RECEIVE_LISTINGS;
  listings: MultipleProductListingsResult;
};

export type ReceiveCollectionAction = {
  type: typeof RECEIVE_COLLECTION;
  json: GetCollectionResult;
  request: GetCollectionRequest;
};

export type ReceiveCollectionsAction = {
  type: typeof RECEIVE_COLLECTIONS;
  collections: { [handle: string]: Collection };
};

export type ReceiveCollectionListAction = {
  type: typeof RECEIVE_COLLECTION_LIST;
  collections: GraphQLList<SlimCollection>;
};

export type ReceiveShopifyDomainReferenceUrlId = {
  type: typeof RECEIVE_SHOPIFY_DOMAIN_REFERENCE_URL_ID;
  shopifyDomainReferenceUrlId: number;
};

export type ClearCacheAction = {
  type: typeof SHOP_CLEAR_CACHE;
};
export type ClearCartAction = {
  type: typeof CLEAR_CART;
};

export type ReceiveCartAction = {
  type: typeof RECEIVE_CART;
  cart: Cart | null;
};

export type AddToBasketAction = {
  type: typeof ADD_TO_BASKET;
  product: Product;
  variantId: string;
  variant: ProductVariant;
  quantity: number;
};

export type RemoveFromBasketAction = {
  type: typeof REMOVE_FROM_BASKET;
  product: Product;
  variant: ProductVariant;
  variantId: string;
  quantity: number;
};

export type BasketUpdatedAction = {
  type: typeof BASKET_UPDATED;
};

export type ReceiveCheckoutAction = {
  type: typeof RECEIVE_CHECKOUT;
  checkoutUserErrors: Array<UserError> | null;
  checkout: Checkout;
};

export type ClearCheckoutAction = {
  type: typeof CLEAR_CHECKOUT;
};

export type ReceiveCountriesAction = {
  type: typeof RECEIVE_COUNTRIES;
  countries: Array<Country>;
};

export type ReceiveAddressFieldsAction = {
  type: typeof RECEIVE_ADDRESS_FIELDS;
  countryCode: string;
  addressFields: AddressFieldName[][];
};

export type SetVATsAction = {
  type: typeof SET_VATS;
  vats: VatState;
};

export type SetCustomerVATInfoAction = {
  type: typeof SET_CUSTOMER_VAT_INFO;
  customerCountryCode?: string;
  customerTradeRegion?: TradeRegion;
  customerType?: CustomerType;
};

export type ReceiveCurrencyAction = {
  type: typeof RECEIVE_CURRENCY;
  currency: CurrencyInfo;
};

export type SetIsShopifyAppAction = {
  type: typeof SET_IS_SHOPIFY_APP;
  shopifyApp: boolean;
};

export type SetEnableCartNotificationsAction = {
  type: typeof SET_ENABLE_CART_NOTIFICATIONS;
  enableCartNotifications: boolean;
};

export type ShopActions =
  | SetShopDefaultsAction
  | ReceiveProductTypesAction
  | ReceiveProductAction
  | ReceiveMultipleProductsAction
  | ReceiveListingAction
  | ReceiveListingsAction
  | ReceiveCollectionAction
  | ReceiveCollectionsAction
  | ReceiveCollectionListAction
  | ReceiveShopifyDomainReferenceUrlId
  | ClearCacheAction
  | AddToBasketAction
  | RemoveFromBasketAction
  | BasketUpdatedAction
  | ReceiveCheckoutAction
  | ClearCheckoutAction
  | ReceiveCountriesAction
  | ReceiveAddressFieldsAction
  | SetVATsAction
  | SetCustomerVATInfoAction
  | ReceiveCurrencyAction
  | ClearCartAction
  | ReceiveCartAction
  | SetIsShopifyAppAction
  | SetEnableCartNotificationsAction;

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
    allCollections: null,
    basketUpdated: 0,
    cart: null,
    checkout: null,
    checkoutUserErrors: null,
    countryCodes: null,
    countriesByCode: {},
    addressFieldsByCountryCode: {},
    vats: null,
    currencies: {},
    enableCartNotifications: false,
    shopifyDomainReferenceUrlId: 0,
    isShopifyApp: false
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
        productTypes: [],
        productTypeTree: [],
        collections: {},
        allCollections: null,
        countryCodes: null,
        countriesByCode: {},
        addressFieldsByCountryCode: {},
        enableCartNotifications: false,
        shopifyDomainReferenceUrlId: 0,
        isShopifyApp: false
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

    case RECEIVE_LISTINGS: {
      const listings: { [key: string]: SlimProductListing } = {};

      for (const key of Object.keys(action.listings)) {
        const { listing, request } = action.listings[key];
        const l: SlimProductListing = {
          hasNextPage: listing.pageInfo.hasNextPage,
          hasPreviousPage: listing.pageInfo.hasPreviousPage,
          nextCursor: getNextCursor(listing),
          previousCursor: getPreviousCursor(listing),
          selection: request,
          products: mapGraphQLList(listing, (e: SlimProduct) => e)
        };
        listings[key] = l;
      }

      return Object.assign({}, state, {
        productListings: Object.assign({}, state.productListings, listings)
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

    case RECEIVE_COLLECTIONS: {
      return Object.assign({}, state, {
        collections: Object.assign({}, state.collections, action.collections)
      });
    }

    case RECEIVE_COLLECTION_LIST: {
      const allCollections: Array<SlimCollection> = [];
      forEachGraphQLList<SlimCollection>(action.collections, item => {
        allCollections.push(item);
      });
      return Object.assign({}, state, {
        allCollections
      });
    }

    case RECEIVE_SHOPIFY_DOMAIN_REFERENCE_URL_ID: {
      return Object.assign({}, state, {
        shopifyDomainReferenceUrlId: action.shopifyDomainReferenceUrlId
      });
    }

    case SHOP_CLEAR_CACHE:
      return Object.assign({}, state, {
        productListings: {},
        products: {},
        productTypes: [],
        productTypeTree: [],
        collections: {},
        allCollections: null,
        countryCodes: null,
        countriesByCode: {},
        addressFieldsByCountryCode: {}
      });

    case BASKET_UPDATED:
    case ADD_TO_BASKET:
    case REMOVE_FROM_BASKET:
      return Object.assign({}, state, {
        basketUpdated: Date.now()
      });

    case RECEIVE_CART: {
      return Object.assign({}, state, {
        cart: action.cart
      });
    }

    case CLEAR_CART: {
      return Object.assign({}, state, {
        cart: null
      });
    }

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

    case SET_VATS: {
      return Object.assign({}, state, {
        vats: Object.assign({}, state.vats, action.vats)
      });
    }

    case SET_CUSTOMER_VAT_INFO:
      return Object.assign({}, state, {
        vats: Object.assign({}, state.vats || {}, {
          customerCountryCode: action.customerCountryCode || state.vats?.customerCountryCode,
          customerTradeRegion: action.customerTradeRegion || state.vats?.customerTradeRegion,
          customerType: action.customerType || state.vats?.customerType
        })
      });

    case RECEIVE_CURRENCY:
      return Object.assign({}, state, {
        currencies: {
          ...state.currencies,
          [action.currency.code]: action.currency
        }
      });

    case SET_IS_SHOPIFY_APP:
      return Object.assign({}, state, {
        isShopifyApp: action.shopifyApp || false
      });

    case SET_ENABLE_CART_NOTIFICATIONS:
      return Object.assign({}, state, {
        enableCartNotifications: action.enableCartNotifications || false
      });
  }

  return state;
}

const PRODUCT_REFERENCE_HANDLER: ExtraObjectHandler<Product> = {
  key: 'products',
  context: 'shop',
  onExtraObjectsReceived: (objects, dispatch) => {
    const products: { [handle: string]: Product } = objects as any;
    const json = newXcapJsonResult<GetProductsResult>('success', {
      products
    });
    dispatch({ type: RECEIVE_MULTIPLE_PRODUCTS, json });
  }
};

// If this reducer is used, register its reference handler
registerExtraObjectHandler(PRODUCT_REFERENCE_HANDLER);
