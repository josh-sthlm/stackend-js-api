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
import {
  addNode,
  getParentProductType,
  getProductListKey,
  isRoot,
  newProductTypeTreeNode,
  ProductTypeTreeNode
} from './shopActions';

export const RECEIVE_PRODUCT_TYPES = 'RECEIVE_PRODUCT_TYPES';
export const RECEIVE_PRODUCT = 'RECEIVE_PRODUCT';
export const RECEIVE_PRODUCTS = 'RECEIVE_PRODUCTS';
export const CLEAR_CACHE = 'CLEAR_CACHE';
export const BASKET_UPDATED = 'BASKET_UPDATED';

export const DEFAULT_PRODUCT_TYPE = '';

export type ProductTypeTree = Array<ProductTypeTreeNode>;

export interface ShopState {
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

  productListings: {
    /**
     *
     */
    [key: string]: Array<string>;
  };

  basketUpdated: number;
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
      type: typeof CLEAR_CACHE;
    }
  | {
      type: typeof BASKET_UPDATED;
    };

export default function shopReducer(
  state: ShopState = {
    productTypes: [],
    productTypeTree: [],
    products: {},
    productListings: {},
    basketUpdated: 0
  },
  action: ShopActions
): ShopState {
  switch (action.type) {
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

    case CLEAR_CACHE:
      return Object.assign({}, state, {
        productListings: {},
        products: {}
      });

    case BASKET_UPDATED:
      return Object.assign({}, state, {
        basketUpdated: Date.now()
      });
  }

  return state;
}

export function buildProductTypeTree(productTypes: Array<GraphQLListNode<string>>): ProductTypeTree {
  const pt: Array<string> = productTypes.map(n => n.node);
  const i = pt.indexOf('');
  if (i !== -1) {
    pt.splice(i, 1);
  }
  pt.sort((a, b) => a.localeCompare(b));

  const t: ProductTypeTree = [];
  const treeHash: { [productType: string]: ProductTypeTreeNode } = {};

  pt.forEach(x => {
    const n = newProductTypeTreeNode(x);
    treeHash[x] = n;

    const parent = getParentProductType(n);
    if (parent) {
      let pn = treeHash[parent];
      if (!pn) {
        pn = newProductTypeTreeNode(parent);
        treeHash[parent] = pn;
        if (isRoot(pn)) {
          t.push(pn);
        }
      }
      addNode(pn, n);
    } else {
      t.push(n);
    }
  });

  return t;
}
