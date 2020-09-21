//Action Type

import {
  GetProductResult,
  GraphQLListNode,
  ListProductsAndTypesResult,
  ListProductsRequest,
  ListProductTypesResult,
  Product
} from './index';
import get from 'lodash/get';
import { basketContains, findInBasket, getProductListKey } from './shopActions';

export const RECEIVE_PRODUCT_TYPES = 'RECEIVE_PRODUCT_TYPES';
export const RECEIVE_PRODUCT = 'RECEIVE_PRODUCT';
export const RECEIVE_PRODUCTS = 'RECEIVE_PRODUCTS';
export const ADD_TO_BASKET = 'ADD_TO_BASKET';
export const REMOVE_FROM_BASKET = 'REMOVE_FROM_BASKET';
export const CLEAR_CACHE = 'CLEAR_CACHE';

export const DEFAULT_PRODUCT_TYPE = '';

export interface BasketItem {
  quantity: number;
  handle: string;
  variant: string | undefined;
}

export interface ShopState {
  /**
   * Product types
   */
  productTypes: Array<string>;

  /**
   * Products by handle
   */
  products: {
    [handle: string]: Product;
  };

  productListings: {
    /**
     *
     */
    [key: string]: Array<string>;
  };

  /**
   * Shopping basket
   */
  basket: Array<BasketItem>;
}

export type ShopActions =
  | {
      type: typeof RECEIVE_PRODUCT_TYPES;
      json: ListProductTypesResult;
    }
  | {
      type: typeof RECEIVE_PRODUCT;
      json: GetProductResult;
    }
  | {
      type: typeof RECEIVE_PRODUCTS;
      json: ListProductsAndTypesResult;
      request: ListProductsRequest;
    }
  | {
      type: typeof ADD_TO_BASKET;
      handle: string;
      variant?: string;
    }
  | {
      type: typeof REMOVE_FROM_BASKET;
      handle: string;
      variant?: string;
    }
  | {
      type: typeof CLEAR_CACHE;
    };

export default function shopReducer(
  state: ShopState = {
    productTypes: [],
    products: {},
    productListings: {},
    basket: []
  },
  action: ShopActions
): ShopState {
  switch (action.type) {
    case RECEIVE_PRODUCT_TYPES: {
      const edges: Array<GraphQLListNode<string>> = get(action, 'json.productTypes.edges', []);
      const productTypes = edges.map(e => e.node);
      return Object.assign({}, state, {
        productTypes
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

    case RECEIVE_PRODUCTS: {
      const receivedProducts = action.json.products;

      const key = getProductListKey(action.request);
      const handles: Array<string> = [];
      const products = Object.assign({}, state.products, {});

      receivedProducts.edges.forEach(n => {
        handles.push(n.node.handle);
        products[n.node.handle] = n.node;
      });

      const productListings = Object.assign({}, state.productListings, {
        [key]: handles
      });

      return Object.assign({}, state, {
        productListings,
        products
      });
    }

    case ADD_TO_BASKET: {
      if (!action.handle) {
        return state;
      }

      const basket = [...state.basket];

      const i = findInBasket(state, action.handle, action.variant);
      if (i === -1) {
        basket.push({
          quantity: 1,
          handle: action.handle,
          variant: action.variant
        });
      } else {
        basket[i].quantity++;
      }

      return Object.assign({}, state, {
        basket
      });
    }

    case REMOVE_FROM_BASKET: {
      const i = findInBasket(state, action.handle, action.variant);
      if (i === -1) {
        return state;
      }

      const basket = [...state.basket];
      if (basket[i].quantity === 1) {
        basket.splice(i, 1);
      } else {
        basket[i].quantity--;
      }

      return Object.assign({}, state, {
        basket
      });
    }

    case CLEAR_CACHE: {
      const products: { [handle: string]: Product } = {};

      Object.keys(state.products).forEach(handle => {
        if (basketContains(state, handle)) {
          products[handle] = state.products[handle];
        }
      });

      return Object.assign({}, state, {
        productListings: {},
        products
      });
    }
  }

  return state;
}
