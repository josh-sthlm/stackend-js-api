//@flow

//Action Type

import { GraphQLList, GraphQLListNode, Product } from '../shop';
import _ from 'lodash';

export const RECIEVE_PRODUCT_TYPES = 'RECIEVE_PRODUCT_TYPES';
export const RECIEVE_PRODUCT = 'RECIEVE_PRODUCT';
export const RECIEVE_PRODUCTS = 'RECIEVE_PRODUCTS';
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

export default function shopReducer(
  state: ShopState = {
    productTypes: [],
    products: {},
    productsByType: {},
    basket: [],
  },
  action: {
    type: string;
    receievedAt?: number;
    json?: any;
  }
): ShopState {
  switch (action.type) {
    case RECIEVE_PRODUCT_TYPES: {
      const edges: [GraphQLListNode<string>] = _.get(action, 'json.productTypes.edges', []);
      const productTypes = edges.map(e => e.node);
      return Object.assign({}, state, {
        productTypes,
      });
    }

    case RECIEVE_PRODUCT: {
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

    case RECIEVE_PRODUCTS: {
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
