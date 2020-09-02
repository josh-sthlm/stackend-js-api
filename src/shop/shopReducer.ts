//Action Type

import {
  GetProductResult,
  GraphQLList,
  GraphQLListNode,
  ListProductsAndTypesResult,
  ListProductTypesResult,
  Product,
} from './index';
import _ from 'lodash';

export const RECEIVE_PRODUCT_TYPES = 'RECEIVE_PRODUCT_TYPES';
export const RECEIVE_PRODUCT = 'RECEIVE_PRODUCT';
export const RECEIVE_PRODUCTS = 'RECEIVE_PRODUCTS';
export const ADD_TO_BASKET = 'ADD_TO_BASKET';
export const REMOVE_FROM_BASKET = 'REMOVE_FROM_BASKET';

export const DEFAULT_PRODUCT_TYPE = '';

export interface ShopState {
  productTypes: Array<string>;
  products: {
    [handle: string]: Product;
  };
  productsByType: {
    [productType: string]: GraphQLList<Product>;
  };
  basket: Array<any>;
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
    }
  | {
      type: typeof ADD_TO_BASKET;
      product: Product;
    };

export default function shopReducer(
  state: ShopState = {
    productTypes: [],
    products: {},
    productsByType: {},
    basket: [],
  },
  action: ShopActions
): ShopState {
  switch (action.type) {
    case RECEIVE_PRODUCT_TYPES: {
      const edges: Array<GraphQLListNode<string>> = _.get(action, 'json.productTypes.edges', []);
      const productTypes = edges.map(e => e.node);
      return Object.assign({}, state, {
        productTypes,
      });
    }

    case RECEIVE_PRODUCT: {
      const product = _.get(action, 'json.product');
      if (product) {
        const products = Object.assign({}, state.products, {
          [product.handle]: product,
        });

        return Object.assign({}, state, {
          products,
        });
      }
      break;
    }

    case RECEIVE_PRODUCTS: {
      const products = _.get(action, 'json.products');
      const productType = DEFAULT_PRODUCT_TYPE; // FIXME: Get requested type from backend

      // FIXME: Pagination
      state.productsByType[productType] = products;

      const productsByType = Object.assign({}, state.productsByType, {
        [productType]: products,
      });

      return Object.assign({}, state, {
        productsByType,
      });
    }

    case ADD_TO_BASKET: {
      const basket = [...state.basket];
      const p: Product = _.get(action, 'product');
      if (p) {
        basket.push(p);
      }

      return Object.assign({}, state, {
        basket,
      });
    }
  }

  return state;
}
